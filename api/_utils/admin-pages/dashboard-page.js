(function () {
  'use strict';

  const API = '';
  const token = localStorage.getItem('admin_token');
  let currentPage = 'overview';
  let userPage = 1;
  let jobPage = 1;
  let debounceTimer;

  const PAGE_TITLES = {
    overview: 'Overview',
    finance: 'Finance',
    growth: 'Growth',
    users: 'Users',
    jobs: 'Jobs',
    queue: 'Queue',
    moderation: 'Moderation',
    security: 'Security',
  };

  const LOADERS = {
    overview: loadOverview,
    finance: loadFinance,
    growth: loadGrowth,
    users: loadUsers,
    jobs: loadJobs,
    queue: loadQueue,
    moderation: loadModeration,
    security: loadSecurity,
  };

  let currency = localStorage.getItem('admin_currency') || 'USD';
  let usdToKes = 130;
  let fxAsOf = '';
  let fxSource = '';
  let lastFinanceData = null;
  let lastGrowthData = null;
  let lastOverviewStats = null;
  let lastOverviewQueue = null;
  let lastQueueData = null;

  function fmtMoney(usd, decimals) {
    const n = Number(usd) || 0;
    const d = decimals == null ? 2 : decimals;
    if (currency === 'KES') {
      const kes = n * usdToKes;
      const rounded = d === 0 ? Math.round(kes) : kes;
      return (
        'KSh ' +
        rounded.toLocaleString(undefined, {
          minimumFractionDigits: d === 0 ? 0 : Math.min(d, 2),
          maximumFractionDigits: d === 0 ? 0 : Math.min(d, 2),
        })
      );
    }
    return (
      '$' +
      n.toLocaleString(undefined, {
        minimumFractionDigits: Math.min(d, 2),
        maximumFractionDigits: Math.min(d, 2),
      })
    );
  }

  function fmtMoneySigned(usd, decimals) {
    const n = Number(usd) || 0;
    if (n < 0) return '-' + fmtMoney(Math.abs(n), decimals);
    return fmtMoney(n, decimals);
  }

  function updateCurrencyToggleUi() {
    document.querySelectorAll('#currency-toggle [data-currency]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.currency === currency);
    });
  }

  function updateFxLabel() {
    const el = document.getElementById('fx-rate-label');
    if (!el) return;
    if (currency === 'KES') {
      const src = fxSource === 'fallback' ? 'est.' : fxAsOf || 'live';
      el.textContent = '1 USD = ' + usdToKes.toLocaleString() + ' KES (' + src + ')';
    } else {
      el.textContent = '';
    }
  }

  async function loadExchangeRate() {
    try {
      const d = await apiFetch('/api/admin?resource=exchange-rate');
      if (d.ok && d.usdToKes) {
        usdToKes = Number(d.usdToKes);
        fxAsOf = d.asOf || '';
        fxSource = d.source || '';
      }
    } catch (e) {
      console.warn('[admin] exchange rate fetch failed', e);
    }
    updateFxLabel();
  }

  function setCurrency(next) {
    if (next !== 'USD' && next !== 'KES') return;
    currency = next;
    localStorage.setItem('admin_currency', currency);
    updateCurrencyToggleUi();
    updateFxLabel();
    refreshMoneyDisplays();
  }

  function refreshMoneyDisplays() {
    if (lastOverviewStats) {
      renderOverviewMoney(lastOverviewStats);
      refreshOverviewAlerts();
    }
    if (lastFinanceData) renderFinance(lastFinanceData);
    if (lastGrowthData) renderGrowth(lastGrowthData);
    if (lastQueueData) renderQueueMoney(lastQueueData);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!token) {
    window.location.href = '/admin/login';
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const label = document.getElementById('adminLabel');
    if (label) label.textContent = payload.userId.slice(0, 8) + '…';
    if (payload.exp * 1000 < Date.now()) logout();
  } catch (e) {
    logout();
    return;
  }

  function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  }

  async function apiFetch(path, opts) {
    const r = await fetch(API + path, {
      ...opts,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(opts && opts.headers ? opts.headers : {}),
      },
    });
    if (r.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return r.json();
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function showPage(name) {
    if (!PAGE_TITLES[name]) return;

    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.remove('active');
    });

    const pageEl = document.getElementById('page-' + name);
    const navEl = document.querySelector('.nav-item[data-page="' + name + '"]');
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = PAGE_TITLES[name];

    currentPage = name;
    const loader = LOADERS[name];
    if (loader) loader();
  }

  function setRefreshed() {
    const el = document.getElementById('lastRefresh');
    if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
  }

  function renderAlerts(containerId, alerts) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!alerts.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = alerts
      .map(function (a) {
        return (
          '<div class="alert alert-' +
          a.kind +
          '">' +
          '<div><div class="alert-title">' +
          esc(a.title) +
          '</div>' +
          (a.body ? '<div class="alert-body">' + esc(a.body) + '</div>' : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function setCapBar(el, pct) {
    if (!el) return;
    const scale = Math.min(Math.max(pct / 100, 0), 1);
    el.style.transform = 'scaleX(' + scale + ')';
    el.classList.remove('warn', 'danger');
    if (pct >= 90) el.classList.add('danger');
    else if (pct >= 75) el.classList.add('warn');
  }

  // ── Overview ────────────────────────────────────────────────────────────────
  async function loadOverview() {
    try {
      const [stats, queue] = await Promise.all([
        apiFetch('/api/admin?resource=stats'),
        apiFetch('/api/admin?resource=queue-stats'),
      ]);

      if (!stats.ok) return;

      lastOverviewStats = stats;
      lastOverviewQueue = queue.ok ? queue : null;

      const active = (stats.users.byTier || [])
        .filter(function (r) {
          return r.subscription_status === 'active';
        })
        .reduce(function (s, r) {
          return s + r.count;
        }, 0);

      setText('ov-users', stats.users.total.toLocaleString());
      setText('ov-new-today', stats.users.newToday.toLocaleString());
      setText('ov-new-week', stats.users.newThisWeek.toLocaleString());
      setText('ov-active', active.toLocaleString());
      renderOverviewMoney(stats);
      setText('ov-jobs-today', stats.jobs.today.toLocaleString());
      setText('ov-infringements', String(stats.moderation.totalInfringements));
      setText('ov-banned', String(stats.users.banned));

      const tierBody = document.getElementById('tier-table');
      if (tierBody) {
        tierBody.innerHTML =
          (stats.users.byTier || [])
            .map(function (r) {
              return (
                '<tr><td>' +
                cap(r.subscription_tier) +
                '</td><td>' +
                cap(r.subscription_status) +
                '</td><td><strong>' +
                r.count +
                '</strong></td></tr>'
              );
            })
            .join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';
      }

      const trendBody = document.getElementById('jobs-trend');
      if (trendBody) {
        trendBody.innerHTML =
          (stats.jobs.last7Days || [])
            .map(function (r) {
              return (
                '<tr><td>' +
                r.date +
                '</td><td><span class="badge badge-green">' +
                r.completed +
                '</span></td><td><span class="badge badge-red">' +
                r.failed +
                '</span></td></tr>'
              );
            })
            .join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';

        refreshOverviewAlerts();
      }

      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  function renderOverviewMoney(stats) {
    setText('ov-mrr', fmtMoney(stats.revenue.mrrEstimateUsd, 0));
  }

  function refreshOverviewAlerts() {
    if (!lastOverviewStats) return;
    const queue = lastOverviewQueue;
    const failedToday = (lastOverviewStats.jobs.last7Days || []).reduce(function (s, r) {
      return s + (r.failed || 0);
    }, 0);
    var alerts = [];
    if (queue) {
      if (queue.queue.isPaused) {
        alerts.push({
          kind: 'danger',
          title: 'Queue paused',
          body: queue.queue.pauseReason || 'Daily cost cap threshold reached.',
        });
      } else if (queue.today.costPercent >= 80) {
        alerts.push({
          kind: 'warn',
          title: 'Cost cap at ' + queue.today.costPercent + '%',
          body:
            'Today: ' +
            fmtMoney(queue.today.costUsd, 2) +
            ' of ' +
            fmtMoney(queue.today.costCap, 2),
        });
      } else {
        alerts.push({
          kind: 'ok',
          title: 'Systems operational',
          body:
            'Queue active · ' +
            queue.queue.pending +
            ' pending · cap ' +
            queue.today.costPercent +
            '%',
        });
      }
    }
    if (failedToday > 0) {
      alerts.push({
        kind: 'warn',
        title: failedToday + ' failed jobs (7d)',
        body: 'Check the Jobs page for retries.',
      });
    }
    if (lastOverviewStats.moderation.totalInfringements > 0) {
      alerts.push({
        kind: 'warn',
        title: lastOverviewStats.moderation.totalInfringements + ' content infringements',
        body: 'Review flagged uploads on the Moderation page.',
      });
    }
    renderAlerts('overview-alerts', alerts);
  }

  function fmtPct(n, decimals) {
    const v = Number(n) || 0;
    const d = decimals == null ? 1 : decimals;
    return v.toFixed(d) + '%';
  }

  function fmtMonth(iso) {
    if (!iso) return '—';
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return iso.slice(0, 7);
    return d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
  }

  // ── Growth ────────────────────────────────────────────────────────────────
  async function loadGrowth() {
    try {
      const d = await apiFetch('/api/admin?resource=growth');
      if (!d.ok) return;

      if (d.meta && d.meta.exchange && d.meta.exchange.usdToKes) {
        usdToKes = Number(d.meta.exchange.usdToKes);
        fxAsOf = d.meta.exchange.asOf || '';
        fxSource = d.meta.exchange.source || '';
        updateFxLabel();
      }

      lastGrowthData = d;
      renderGrowth(d);
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  function renderGrowth(d) {
    const s = d.snapshot || {};
    setText('gr-mau', String(s.mau ?? '—'));
    setText('gr-total', String(s.totalUsers ?? '—'));
    setText('gr-mrr', fmtMoney(s.mrrUsd, 0));
    setText('gr-arr', fmtMoney(s.arrUsd, 0));
    setText('gr-churn', fmtPct(s.churnRatePercent, 1));

    setText(
      'gr-mau-hint',
      s.mauPercentOfTotal != null
        ? s.mauPercentOfTotal + '% of total users generated this month'
        : 'Users with ≥1 generation this month'
    );
    setText('gr-mrr-hint', (s.activePaidSubs || 0) + ' active paid subscriptions');
    setText(
      'gr-churn-hint',
      d.churn && d.churn.ratePercentLastMonth != null
        ? 'Last month: ' + fmtPct(d.churn.ratePercentLastMonth, 1)
        : 'Paid subs lost this month'
    );

    setText('gr-active-paid', String(s.activePaidSubs ?? '—'));
    setText('gr-new-users', String(s.newUsersMtd ?? '—'));
    setText('gr-new-paid', String(s.newPaidSubsMtd ?? '—'));
    setText('gr-churned', String(s.churnedSubsMtd ?? '—'));

    const totalUsers = Number(s.totalUsers) || 0;
    const mauRows = (d.trends && d.trends.mauByMonth) || [];
    const mauEl = document.getElementById('gr-mau-trend');
    if (mauEl) {
      mauEl.innerHTML =
        mauRows
          .map(function (r) {
            const pct = totalUsers > 0 ? ((Number(r.mau) / totalUsers) * 100).toFixed(1) : '0.0';
            return (
              '<tr><td>' +
              fmtMonth(r.month) +
              '</td><td><strong>' +
              r.mau +
              '</strong></td><td>' +
              pct +
              '%</td></tr>'
            );
          })
          .join('') || '<tr><td colspan="3" class="empty">No MAU data yet</td></tr>';
    }

    const signupEl = document.getElementById('gr-signup-trend');
    if (signupEl) {
      const signups = (d.trends && d.trends.newUsersByMonth) || [];
      signupEl.innerHTML =
        signups
          .map(function (r) {
            return (
              '<tr><td>' +
              fmtMonth(r.month) +
              '</td><td><strong>' +
              r.new_users +
              '</strong></td></tr>'
            );
          })
          .join('') || '<tr><td colspan="2" class="empty">No signup data yet</td></tr>';
    }

    const churnEl = document.getElementById('gr-churn-trend');
    if (churnEl) {
      const churnRows = (d.trends && d.trends.churnByMonth) || [];
      churnEl.innerHTML =
        churnRows
          .map(function (r) {
            return (
              '<tr><td>' +
              fmtMonth(r.month) +
              '</td><td><strong>' +
              r.churned +
              '</strong></td></tr>'
            );
          })
          .join('') || '<tr><td colspan="2" class="empty">No churn history yet</td></tr>';
    }

    const tierEl = document.getElementById('gr-tier-table');
    if (tierEl) {
      const tiers = (d.revenue && d.revenue.activeByTier) || [];
      tierEl.innerHTML =
        tiers
          .map(function (r) {
            return (
              '<tr><td>' +
              cap(r.tier) +
              '</td><td>' +
              r.count +
              '</td><td>' +
              fmtMoney(r.unitPriceUsd, 0) +
              '</td><td><strong>' +
              fmtMoney(r.subtotalUsd, 0) +
              '</strong></td></tr>'
            );
          })
          .join('') || '<tr><td colspan="4" class="empty">No active paid subs</td></tr>';
    }

    setText('gr-disclaimer', d.meta && d.meta.disclaimer ? d.meta.disclaimer : '');
  }

  // ── Finance ───────────────────────────────────────────────────────────────
  async function loadFinance() {
    try {
      const d = await apiFetch('/api/admin?resource=finance');
      if (!d.ok) return;

      if (d.meta && d.meta.exchange && d.meta.exchange.usdToKes) {
        usdToKes = Number(d.meta.exchange.usdToKes);
        fxAsOf = d.meta.exchange.asOf || '';
        fxSource = d.meta.exchange.source || '';
        updateFxLabel();
      }

      lastFinanceData = d;
      renderFinance(d);
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  function renderFinance(d) {
      const gens = d.generations && d.generations.monthToDate ? d.generations.monthToDate : {};
      setText('fin-gens-total', String(gens.total ?? '—'));
      setText('fin-gens-done', String(gens.completed ?? '—'));
      setText('fin-gens-failed', String(gens.failed ?? '—'));
      const trialCost =
        d.generations && d.generations.trial ? d.generations.trial.costMtdUsd : 0;
      setText('fin-trial-cost', fmtMoney(trialCost, 2));

      setText('fin-mrr', fmtMoney(d.revenue.mrrEstimateUsd, 0));
      setText('fin-cost-mtd', fmtMoney(d.costs.monthToDateUsd, 2));
      setText('fin-net', fmtMoneySigned(d.margin.estimatedNetUsd, 2));
      setText(
        'fin-subs-hint',
        d.revenue.totalActiveSubs + ' active paid subscriptions'
      );

      const econTable = document.getElementById('fin-economics-table');
      if (econTable) {
        const rows = (d.generations && d.generations.byUserTier) || [];
        econTable.innerHTML =
          rows
            .map(function (r) {
              const isTrial = r.tier === 'trial';
              return (
                '<tr class="' +
                (isTrial ? 'row-trial' : '') +
                '"><td>' +
                cap(r.tier) +
                (isTrial ? ' <span class="badge badge-amber">$0 rev</span>' : '') +
                '</td><td>' +
                (r.activeSubs || '—') +
                '</td><td>' +
                fmtMoney(r.revenueMrrUsd, 0) +
                '</td><td>' +
                r.generationsMtd +
                (r.failedMtd ? ' <span style="color:var(--muted);font-size:12px">(' + r.failedMtd + ' failed)</span>' : '') +
                '</td><td><strong>' +
                fmtMoney(r.costMtdUsd, 2) +
                '</strong></td></tr>'
              );
            })
            .join('') ||
          '<tr><td colspan="5" class="empty">No generation data this month</td></tr>';
      }

      const modelTable = document.getElementById('fin-model-table');
      if (modelTable) {
        const models = (d.generations && d.generations.byModel) || [];
        modelTable.innerHTML =
          models
            .map(function (m) {
              return (
                '<tr><td>' +
                esc(m.label || m.model) +
                '</td><td>' +
                m.completed +
                '</td><td>' +
                m.failed +
                '</td><td>' +
                (m.unitCostUsd != null ? fmtMoney(m.unitCostUsd, 3) : '—') +
                '</td><td><strong>' +
                fmtMoney(m.costUsd, 2) +
                '</strong></td></tr>'
              );
            })
            .join('') ||
          '<tr><td colspan="5" class="empty">No model cost data this month</td></tr>';
      }

      const modelNote = document.getElementById('fin-model-note');
      if (modelNote && d.meta && d.meta.modelCosts) {
        const costs = d.meta.modelCosts;
        modelNote.textContent =
          'Unit rates: Flux / Seedream / Nano Banana ' +
          fmtMoney(costs['black-forest-labs/flux-kontext-pro'] || costs.default || 0.04, 3) +
          ' · Nano Banana 2 ' +
          fmtMoney(costs['google/nano-banana-2'] || 0.067, 3) +
          ' · failed jobs $0';
      }

      const today = d.costs.today;
      setText('fin-today-cost', fmtMoney(today.costUsd, 2) + ' spent today');
      setText('fin-today-cap', 'Cap ' + fmtMoney(today.capUsd, 2));

      const capBadge = document.getElementById('fin-cap-badge');
      if (capBadge) {
        if (today.queuePaused) {
          capBadge.className = 'badge badge-red';
          capBadge.textContent = 'Paused';
        } else {
          capBadge.className = 'badge badge-green';
          capBadge.textContent = today.capPercent + '% used';
        }
      }
      setCapBar(document.getElementById('fin-cap-bar'), today.capPercent);

      const revTable = document.getElementById('fin-revenue-table');
      if (revTable) {
        revTable.innerHTML =
          (d.revenue.activeByTier || [])
            .map(function (r) {
              return (
                '<tr><td>' +
                cap(r.tier) +
                '</td><td>' +
                r.count +
                '</td><td>' +
                fmtMoney(r.unitPriceUsd, 0) +
                '</td><td><strong>' +
                fmtMoney(r.subtotalUsd, 0) +
                '</strong></td></tr>'
              );
            })
            .join('') || '<tr><td colspan="4" class="empty">No active paid subs</td></tr>';
      }

      renderSpendTable('fin-spend-7', d.costs.last7.daily);
      setText(
        'fin-7-total',
        '7d total: ' +
          fmtMoney(d.costs.last7.total, 2) +
          ' · avg ' +
          fmtMoney(d.costs.last7.average, 2) +
          '/day'
      );

      renderSpendTable('fin-spend-30', d.costs.last30.daily);
      const hint = document.getElementById('fin-net-hint');
      if (hint) {
        hint.textContent =
          currency === 'KES'
            ? 'MRR minus month-to-date costs · ' + usdToKes.toLocaleString() + ' KES per USD'
            : 'MRR minus month-to-date costs';
      }
      setText(
        'fin-30-total',
        '30d total: ' +
          fmtMoney(d.costs.last30.total, 2) +
          ' · avg ' +
          fmtMoney(d.costs.last30.average, 2) +
          '/day · ' +
          (d.meta && d.meta.disclaimer ? d.meta.disclaimer : '')
      );
  }

  function renderSpendTable(id, rows) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML =
      (rows || [])
        .map(function (r) {
          return (
            '<tr><td>' +
            r.date +
            '</td><td>' +
            fmtMoney(r.cost, 2) +
            '</td><td>' +
            r.jobs +
            '</td></tr>'
          );
        })
        .join('') || '<tr><td colspan="3" class="empty">No spend data</td></tr>';
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  function debounceLoadUsers() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      userPage = 1;
      loadUsers();
    }, 350);
  }

  async function loadUsers() {
    const search = document.getElementById('user-search').value.trim();
    const tier = document.getElementById('user-tier').value;
    const status = document.getElementById('user-status').value;
    const qs = new URLSearchParams({ page: String(userPage), limit: '20' });
    if (search) qs.set('search', search);
    if (tier) qs.set('tier', tier);
    if (status) qs.set('status', status);

    document.getElementById('users-table').innerHTML =
      '<tr><td colspan="7" class="empty"><span class="spinner"></span></td></tr>';

    try {
      const d = await apiFetch('/api/admin?resource=users&' + qs);
      const tbody = document.getElementById('users-table');
      if (!d.ok || !d.users.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>';
        document.getElementById('users-pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = d.users
        .map(function (u) {
          return (
            '<tr>' +
            '<td class="mono">' +
            u.id.slice(0, 8) +
            '…</td>' +
            '<td>' +
            (u.email || '<span style="color:var(--muted)">—</span>') +
            '</td>' +
            '<td><span class="badge ' +
            tierBadge(u.subscription_tier) +
            '">' +
            cap(u.subscription_tier) +
            '</span></td>' +
            '<td><span class="badge ' +
            statusBadge(u.subscription_status) +
            '">' +
            cap(u.subscription_status) +
            '</span></td>' +
            '<td>' +
            u.usage_this_month +
            '</td>' +
            '<td>' +
            fmtDate(u.created_at) +
            '</td>' +
            '<td><button class="btn btn-ghost btn-sm" type="button" data-user="' +
            u.id +
            '">View</button></td>' +
            '</tr>'
          );
        })
        .join('');
      renderPagination('users-pagination', d.page, d.pages, function (p) {
        userPage = p;
        loadUsers();
      });
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  async function openUserPanel(userId) {
    document.getElementById('user-panel').classList.add('open');
    document.getElementById('panel-backdrop').classList.add('open');
    document.getElementById('user-panel-body').innerHTML = '<span class="spinner"></span>';

    try {
      const d = await apiFetch('/api/admin?resource=users&id=' + userId);
      if (!d.ok) {
        document.getElementById('user-panel-body').innerHTML =
          '<div class="error-msg">Failed to load user</div>';
        return;
      }
      const u = d.user;
      const isBanned = !!u.banned_at;
      document.getElementById('user-panel-body').innerHTML =
        fieldRow('ID', '<span class="mono">' + esc(u.id) + '</span>') +
        fieldRow('Email', esc(u.email || '—')) +
        fieldRow('RevenueCat ID', '<span class="mono">' + esc(u.revenuecat_user_id || '—') + '</span>') +
        fieldRow(
          'Tier',
          '<span class="badge ' + tierBadge(u.subscription_tier) + '">' + cap(u.subscription_tier) + '</span>'
        ) +
        fieldRow(
          'Status',
          '<span class="badge ' +
            statusBadge(u.subscription_status) +
            '">' +
            cap(u.subscription_status) +
            '</span>'
        ) +
        fieldRow('Trial Used', u.trial_generations_used + ' / 3') +
        fieldRow('Usage This Month', String(u.usage_this_month)) +
        fieldRow('Infringements', String(d.infringements)) +
        fieldRow('Banned', isBanned ? esc(fmtDate(u.banned_at)) : 'No') +
        fieldRow('Joined', fmtDate(u.created_at)) +
        (d.subscription
          ? '<div class="section-title">Subscription</div>' +
            fieldRow('Platform', cap(d.subscription.platform)) +
            fieldRow('Period End', fmtDate(d.subscription.current_period_end)) +
            fieldRow('Cancel at End', d.subscription.cancel_at_period_end ? 'Yes' : 'No')
          : '') +
        '<div class="section-title">Actions</div>' +
        '<div class="panel-actions">' +
        (isBanned
          ? '<button class="btn btn-success btn-sm" type="button" data-action="unban" data-user="' +
            u.id +
            '">Unban User</button>'
          : '<button class="btn btn-danger btn-sm" type="button" data-action="ban" data-user="' +
            u.id +
            '">Ban User</button>') +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="quota" data-user="' +
        u.id +
        '">Adjust Quota</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="tier" data-user="' +
        u.id +
        '">Change Tier</button>' +
        '</div>' +
        '<div class="section-title">Recent Jobs (' +
        d.recentJobs.length +
        ')</div>' +
        (d.recentJobs.length
          ? '<table style="font-size:12px"><thead><tr><th>ID</th><th>Style</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
            d.recentJobs
              .map(function (j) {
                return (
                  '<tr><td class="mono">' +
                  j.id.slice(0, 8) +
                  '…</td><td>' +
                  esc(j.style_id) +
                  '</td><td><span class="badge ' +
                  statusBadge(j.status) +
                  '">' +
                  j.status +
                  '</span></td><td>' +
                  fmtDate(j.created_at) +
                  '</td></tr>'
                );
              })
              .join('') +
            '</tbody></table>'
          : '<div style="color:var(--muted);font-size:12px">No jobs yet</div>');
    } catch (e) {
      document.getElementById('user-panel-body').innerHTML =
        '<div class="error-msg">Error loading user</div>';
    }
  }

  function closePanel() {
    document.getElementById('user-panel').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('open');
  }

  async function adminAction(action, userId) {
    if (!confirm(cap(action) + ' this user?')) return;
    try {
      const d = await apiFetch('/api/admin?resource=users&action=' + action, {
        method: 'POST',
        body: JSON.stringify({ userId: userId }),
      });
      if (d.ok) {
        openUserPanel(userId);
        loadUsers();
      } else alert(d.error || 'Action failed');
    } catch (e) {
      alert('Request failed');
    }
  }

  async function adminAdjustQuota(userId) {
    const val = prompt('Quota adjustment (positive to add, negative to subtract):');
    if (val === null) return;
    const n = parseInt(val, 10);
    if (isNaN(n)) return alert('Enter a number');
    const d = await apiFetch('/api/admin?resource=users&action=quota', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, adjustment: n }),
    });
    if (d.ok) openUserPanel(userId);
    else alert(d.error || 'Failed');
  }

  async function adminChangeTier(userId) {
    const tier = prompt('New tier (trial/starter/popular/pro):');
    if (!tier) return;
    const d = await apiFetch('/api/admin?resource=users&action=tier', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, tier: tier }),
    });
    if (d.ok) {
      openUserPanel(userId);
      loadUsers();
    } else alert(d.error || 'Failed');
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────
  async function loadJobs() {
    const status = document.getElementById('job-status').value;
    const qs = new URLSearchParams({ page: String(jobPage), limit: '20' });
    if (status) qs.set('status', status);

    document.getElementById('jobs-table').innerHTML =
      '<tr><td colspan="7" class="empty"><span class="spinner"></span></td></tr>';

    try {
      const d = await apiFetch('/api/admin?resource=jobs&' + qs);
      const tbody = document.getElementById('jobs-table');
      if (!d.ok || !d.jobs.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty">No jobs found</td></tr>';
        document.getElementById('jobs-pagination').innerHTML = '';
        return;
      }
      tbody.innerHTML = d.jobs
        .map(function (j) {
          return (
            '<tr>' +
            '<td class="mono">' +
            j.id.slice(0, 8) +
            '…</td>' +
            '<td class="mono">' +
            (j.user_id ? j.user_id.slice(0, 8) + '…' : '—') +
            '</td>' +
            '<td>' +
            esc(j.style_id) +
            '</td>' +
            '<td><span class="badge ' +
            statusBadge(j.status) +
            '">' +
            j.status +
            '</span></td>' +
            '<td>' +
            j.priority +
            '</td>' +
            '<td>' +
            fmtDate(j.created_at) +
            '</td>' +
            '<td style="display:flex;gap:4px">' +
            (j.status === 'failed'
              ? '<button class="btn btn-success btn-sm" type="button" data-job-action="retry" data-job="' +
                j.id +
                '">Retry</button>'
              : '') +
            (['pending', 'processing'].includes(j.status)
              ? '<button class="btn btn-danger btn-sm" type="button" data-job-action="cancel" data-job="' +
                j.id +
                '">Cancel</button>'
              : '') +
            '</td>' +
            '</tr>'
          );
        })
        .join('');
      renderPagination('jobs-pagination', d.page, d.pages, function (p) {
        jobPage = p;
        loadJobs();
      });
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  async function jobAction(action, jobId) {
    try {
      const d = await apiFetch('/api/admin?resource=jobs&action=' + action + '&jobId=' + jobId, {
        method: 'POST',
      });
      if (d.ok) loadJobs();
      else alert(d.error || 'Action failed');
    } catch (e) {
      alert('Request failed');
    }
  }

  // ── Queue ─────────────────────────────────────────────────────────────────
  async function loadQueue() {
    try {
      const d = await apiFetch('/api/admin?resource=queue-stats');
      if (!d.ok) return;

      lastQueueData = d;

      setText('q-pending', String(d.queue.pending));
      setText('q-processing', String(d.queue.processing));
      setText('q-completed', String(d.queue.completed));
      setText('q-failed', String(d.queue.failed));
      document.getElementById('q-status').innerHTML = d.queue.isPaused
        ? '<span class="badge badge-red">Paused</span>'
        : '<span class="badge badge-green">Active</span>';
      setText('q-wait', d.queue.averageWaitTime + 's');
      setText('q-cap-pct', d.today.costPercent + '%');

      renderQueueMoney(d);

      var queueAlerts = [];
      if (d.queue.isPaused) {
        queueAlerts.push({
          kind: 'danger',
          title: 'Queue is paused',
          body: d.queue.pauseReason || 'Cost protection triggered.',
        });
      } else if (d.today.costPercent >= 75) {
        queueAlerts.push({
          kind: 'warn',
          title: 'Approaching daily cap',
          body: d.today.costPercent + '% of ' + fmtMoney(d.today.costCap, 2),
        });
      }
      renderAlerts('queue-alerts', queueAlerts);

      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  function renderQueueMoney(d) {
    setText('q-cost', fmtMoney(d.today.costUsd, 2));
    const body = document.getElementById('spending-table');
    if (body) {
      body.innerHTML =
        (d.spending7d || [])
          .map(function (r) {
            return (
              '<tr><td>' +
              r.date +
              '</td><td>' +
              fmtMoney(r.cost, 2) +
              '</td><td>' +
              r.jobs +
              '</td></tr>'
            );
          })
          .join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';
    }
  }

  // ── Moderation ────────────────────────────────────────────────────────────
  async function loadModeration() {
    document.getElementById('moderation-table').innerHTML =
      '<tr><td colspan="6" class="empty"><span class="spinner"></span></td></tr>';

    try {
      const d = await apiFetch('/api/admin?resource=moderation&limit=50');
      if (!d.ok) return;

      setText('mod-total', String(d.total));

      const tbody = document.getElementById('moderation-table');
      if (!d.recent.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No infringements recorded</td></tr>';
        return;
      }

      tbody.innerHTML = d.recent
        .map(function (row) {
          const details =
            row.details && typeof row.details === 'object'
              ? JSON.stringify(row.details).slice(0, 80) + '…'
              : row.details || '—';
          return (
            '<tr>' +
            '<td style="white-space:nowrap">' +
            fmtDate(row.created_at) +
            '</td>' +
            '<td><span class="badge badge-amber">' +
            esc(row.infringement_type) +
            '</span></td>' +
            '<td class="mono">' +
            (row.user_id ? row.user_id.slice(0, 8) + '…' : '—') +
            '</td>' +
            '<td>' +
            cap(row.subscription_tier || '—') +
            '</td>' +
            '<td class="mono" style="max-width:200px;overflow:hidden;text-overflow:ellipsis">' +
            esc(details) +
            '</td>' +
            '<td>' +
            (row.user_id
              ? '<button class="btn btn-ghost btn-sm" type="button" data-user="' +
                row.user_id +
                '">User</button>'
              : '') +
            '</td>' +
            '</tr>'
          );
        })
        .join('');

      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Security ──────────────────────────────────────────────────────────────
  async function loadSecurity() {
    const type = document.getElementById('sec-type').value;
    const success = document.getElementById('sec-success').value;
    const qs = new URLSearchParams({ limit: '100' });
    if (type) qs.set('eventType', type);
    if (success !== '') qs.set('success', success);

    document.getElementById('security-table').innerHTML =
      '<tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>';

    try {
      const d = await apiFetch('/api/admin?resource=security-logs&' + qs);
      const tbody = document.getElementById('security-table');
      if (!d.ok || !d.events.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No events found</td></tr>';
        return;
      }
      tbody.innerHTML = d.events
        .map(function (e) {
          return (
            '<tr>' +
            '<td style="white-space:nowrap">' +
            fmtDate(e.created_at) +
            '</td>' +
            '<td>' +
            esc(e.event_type) +
            '</td>' +
            '<td class="mono">' +
            esc(e.ip_address || '—') +
            '</td>' +
            '<td class="mono">' +
            (e.user_id ? e.user_id.slice(0, 8) + '…' : '—') +
            '</td>' +
            '<td><span class="badge ' +
            (e.success ? 'badge-green' : 'badge-red') +
            '">' +
            (e.success ? 'OK' : 'FAIL') +
            '</span></td>' +
            '</tr>'
          );
        })
        .join('');
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function fieldRow(label, valueHtml) {
    return (
      '<div class="field-row"><span class="field-label">' +
      esc(label) +
      '</span><span class="field-value">' +
      valueHtml +
      '</span></div>'
    );
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleString() : '—';
  }

  function tierBadge(t) {
    return (
      { trial: 'badge-gray', starter: 'badge-green', popular: 'badge-indigo', pro: 'badge-amber' }[t] ||
      'badge-gray'
    );
  }

  function statusBadge(s) {
    return (
      {
        active: 'badge-green',
        trial: 'badge-gray',
        canceled: 'badge-amber',
        expired: 'badge-red',
        completed: 'badge-green',
        failed: 'badge-red',
        pending: 'badge-gray',
        processing: 'badge-indigo',
      }[s] || 'badge-gray'
    );
  }

  function renderPagination(id, page, pages, cb) {
    const el = document.getElementById(id);
    if (!el) return;
    if (pages <= 1) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML =
      '<button class="btn btn-ghost btn-sm" type="button" data-page-prev ' +
      (page <= 1 ? 'disabled' : '') +
      '>Prev</button>' +
      '<span style="color:var(--muted);font-size:12px">Page ' +
      page +
      ' of ' +
      pages +
      '</span>' +
      '<button class="btn btn-ghost btn-sm" type="button" data-page-next ' +
      (page >= pages ? 'disabled' : '') +
      '>Next</button>';

    const prev = el.querySelector('[data-page-prev]');
    const next = el.querySelector('[data-page-next]');
    if (prev && page > 1) prev.addEventListener('click', function () { cb(page - 1); });
    if (next && page < pages) next.addEventListener('click', function () { cb(page + 1); });
  }

  // ── Event wiring ──────────────────────────────────────────────────────────
  document.getElementById('sidebar-nav').addEventListener('click', function (e) {
    const item = e.target.closest('.nav-item[data-page]');
    if (item) showPage(item.dataset.page);
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('close-panel-btn').addEventListener('click', closePanel);
  document.getElementById('panel-backdrop').addEventListener('click', closePanel);

  const currencyToggle = document.getElementById('currency-toggle');
  if (currencyToggle) {
    currencyToggle.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-currency]');
      if (btn) setCurrency(btn.dataset.currency);
    });
  }
  updateCurrencyToggleUi();

  loadExchangeRate().then(function () {
    refreshMoneyDisplays();
  });

  document.getElementById('user-search').addEventListener('input', debounceLoadUsers);
  document.getElementById('user-tier').addEventListener('change', function () {
    userPage = 1;
    loadUsers();
  });
  document.getElementById('user-status').addEventListener('change', function () {
    userPage = 1;
    loadUsers();
  });
  document.getElementById('job-status').addEventListener('change', function () {
    jobPage = 1;
    loadJobs();
  });
  document.getElementById('sec-type').addEventListener('change', loadSecurity);
  document.getElementById('sec-success').addEventListener('change', loadSecurity);

  document.body.addEventListener('click', function (e) {
    const refresh = e.target.closest('[data-refresh]');
    if (refresh) {
      const loader = LOADERS[refresh.dataset.refresh];
      if (loader) loader();
      return;
    }

    const userBtn = e.target.closest('[data-user]');
    if (userBtn && !userBtn.dataset.action && !userBtn.dataset.jobAction) {
      openUserPanel(userBtn.dataset.user);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const uid = actionBtn.dataset.user;
      const act = actionBtn.dataset.action;
      if (act === 'ban' || act === 'unban') adminAction(act, uid);
      if (act === 'quota') adminAdjustQuota(uid);
      if (act === 'tier') adminChangeTier(uid);
      return;
    }

    const jobBtn = e.target.closest('[data-job-action]');
    if (jobBtn) jobAction(jobBtn.dataset.jobAction, jobBtn.dataset.job);
  });

  // Expose for legacy inline handlers if any remain
  window.showPage = showPage;
  window.logout = logout;
  window.closePanel = closePanel;

  loadOverview();

  setInterval(function () {
    if (currentPage === 'overview') loadOverview();
    if (currentPage === 'queue') loadQueue();
    if (currentPage === 'finance') loadFinance();
    if (currentPage === 'growth') loadGrowth();
  }, 60000);
})();
