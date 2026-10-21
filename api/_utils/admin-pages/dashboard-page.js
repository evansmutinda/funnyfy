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
    system: 'System',
    finance: 'Finance',
    growth: 'Growth',
    users: 'Users',
    jobs: 'Jobs',
    styles: 'Styles',
    queue: 'Queue',
    moderation: 'Moderation',
    security: 'Security',
  };

  const LOADERS = {
    overview: loadOverview,
    system: loadSystem,
    finance: loadFinance,
    growth: loadGrowth,
    users: loadUsers,
    jobs: loadJobs,
    styles: loadStyles,
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
  let lastRuntime = null;
  let lastJobDetail = null;
  let jobFilterTimer;

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

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('admin_theme', next);
    document.querySelectorAll('#theme-toggle [data-theme-choice]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.themeChoice === next);
    });
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
    if (lastRuntime) renderSystem(lastRuntime);
    if (lastJobDetail) renderJobPanel(lastJobDetail);
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (!token) {
    window.location.href = '/admin/login';
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
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
                tierLabel(r.subscription_tier) +
                '</td><td>' +
                statusLabel(r.subscription_status) +
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
      }

      refreshOverviewAlerts();
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
    const failed7d = (lastOverviewStats.jobs.last7Days || []).reduce(function (s, r) {
      return s + (r.failed || 0);
    }, 0);

    const badge = document.getElementById('ov-system-badge');
    var alerts = [];

    if (queue) {
      const pending = queue.queue.pending;
      const pct = queue.today.costPercent;
      setText('ov-system-pending', String(pending));
      setText(
        'ov-system-cap',
        pct + '% · ' + fmtMoney(queue.today.costUsd, 2) + ' / ' + fmtMoney(queue.today.costCap, 2)
      );

      if (queue.queue.isPaused) {
        setText('ov-system-queue', 'Paused');
        if (badge) {
          badge.className = 'badge badge-red';
          badge.textContent = 'Paused';
        }
        alerts.push({
          kind: 'danger',
          title:
            queue.queue.pauseKind === 'billing'
              ? 'Queue paused — Replicate credits'
              : 'Queue paused',
          body:
            (queue.queue.pauseReason || 'Daily cost cap threshold reached.') +
            (queue.queue.canResumeBilling
              ? ' Top up Replicate, then Resume on the Queue page.'
              : ''),
        });
      } else if (pct >= 80) {
        setText('ov-system-queue', 'Active');
        if (badge) {
          badge.className = 'badge badge-amber';
          badge.textContent = 'Cap high';
        }
        alerts.push({
          kind: 'warn',
          title: 'Cost cap at ' + pct + '%',
          body:
            'Today: ' +
            fmtMoney(queue.today.costUsd, 2) +
            ' of ' +
            fmtMoney(queue.today.costCap, 2),
        });
      } else {
        setText('ov-system-queue', 'Active');
        if (badge) {
          badge.className = 'badge badge-green';
          badge.textContent = 'Operational';
        }
      }
    } else {
      setText('ov-system-queue', '—');
      setText('ov-system-pending', '—');
      setText('ov-system-cap', '—');
      if (badge) {
        badge.className = 'badge badge-gray';
        badge.textContent = 'Unknown';
      }
    }

    setText('ov-system-failed', String(failed7d));
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
              tierLabel(r.tier) +
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
      setText('fin-store', fmtMoney(d.revenue.storeCashMtdUsd || 0, 2));
      setText('fin-store-net', fmtMoney(d.revenue.storeNetEstimateUsd || 0, 2));

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
              const isUnpaid = r.tier === 'trial';
              return (
                '<tr class="' +
                (isUnpaid ? 'row-trial' : '') +
                '"><td>' +
                tierLabel(r.tier) +
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
          'Unit rates: Flux / Seedream ' +
          fmtMoney(costs['black-forest-labs/flux-kontext-pro'] || costs.default || 0.04, 3) +
          ' · Nano Banana ' +
          fmtMoney(costs['google/nano-banana'] || 0.039, 3) +
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
                tierLabel(r.tier) +
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
            tierLabel(u.subscription_tier) +
            '</span></td>' +
            '<td><span class="badge ' +
            statusBadge(u.subscription_status) +
            '">' +
            statusLabel(u.subscription_status) +
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
    lastJobDetail = null;
    setPanelTitle('User');
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
          '<span class="badge ' + tierBadge(u.subscription_tier) + '">' + tierLabel(u.subscription_tier) + '</span>'
        ) +
        fieldRow(
          'Status',
          '<span class="badge ' +
            statusBadge(u.subscription_status) +
            '">' +
            statusLabel(u.subscription_status) +
            '</span>'
        ) +
        fieldRow('Usage This Month', String(u.usage_this_month)) +
        fieldRow(
          'Closed test',
          d.closedTest && d.closedTest.enabled
            ? d.closedTest.current +
              ' / ' +
              d.closedTest.limit +
              ' total, today ' +
              d.closedTest.dailyCurrent +
              ' / ' +
              d.closedTest.dailyLimit
            : 'Off'
        ) +
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
        '<div class="section-title">Support note</div>' +
        '<textarea id="user-note">' +
        esc(d.adminNote || '') +
        '</textarea>' +
        '<div class="panel-actions"><button class="btn btn-ghost btn-sm" type="button" data-action="note" data-user="' +
        u.id +
        '">Save note</button></div>' +
        '<div class="section-title">Recent Jobs (' +
        d.recentJobs.length +
        ')</div>' +
        (d.recentJobs.length
          ? '<table style="font-size:12px"><thead><tr><th>ID</th><th>Style</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
            d.recentJobs
              .map(function (j) {
                return (
                  '<tr><td><button class="btn btn-ghost btn-sm" type="button" data-job-open="' +
                  j.id +
                  '">' +
                  j.id.slice(0, 8) +
                  '…</button></td><td>' +
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
    const reason = askReason(cap(action) + ' this user');
    if (!reason) return;
    try {
      const d = await apiFetch('/api/admin?resource=users&action=' + action, {
        method: 'POST',
        body: JSON.stringify({ userId: userId, reason: reason }),
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
    const reason = askReason('Adjust quota by ' + n);
    if (!reason) return;
    const d = await apiFetch('/api/admin?resource=users&action=quota', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, adjustment: n, reason: reason }),
    });
    if (d.ok) openUserPanel(userId);
    else alert(d.error || 'Failed');
  }

  async function adminChangeTier(userId) {
    const tier = prompt('New tier (starter, popular, or pro):');
    if (!tier) return;
    const reason = askReason('Change tier to ' + tier.trim());
    if (!reason) return;
    const d = await apiFetch('/api/admin?resource=users&action=tier', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, tier: tier.trim(), reason: reason }),
    });
    if (d.ok) {
      openUserPanel(userId);
      loadUsers();
    } else alert(d.error || 'Failed');
  }

  async function adminSaveNote(userId) {
    const el = document.getElementById('user-note');
    const note = el ? el.value.trim() : '';
    const reason = askReason('Save support note');
    if (!reason) return;
    const d = await apiFetch('/api/admin?resource=users&action=note', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, note: note, reason: reason }),
    });
    if (d.ok) openUserPanel(userId);
    else alert(d.error || 'Failed');
  }

  // ── System ────────────────────────────────────────────────────────────────
  async function loadSystem() {
    try {
      const d = await apiFetch('/api/admin?resource=runtime');
      if (!d.ok) return;
      lastRuntime = d;
      renderSystem(d);
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  function renderSystem(d) {
    const dep = d.deployment || {};
    const closed = d.closedTest || {};
    const ver = d.appVersion || {};
    const spend = d.spending || {};
    setText('sys-host', dep.host || '—');
    setText('sys-vercel-env', dep.vercelEnv || '—');
    setText('sys-branch', dep.gitBranch || '—');
    setText('sys-commit', dep.gitCommit || '—');
    setText('sys-tz', d.timezone || '—');
    const envBadge = document.getElementById('sys-env-badge');
    if (envBadge) {
      const host = String(dep.host || '');
      const staging = host.indexOf('staging') !== -1;
      envBadge.textContent = staging ? 'Staging' : (dep.vercelEnv || 'This deploy');
      envBadge.className = 'badge ' + (staging ? 'badge-amber' : 'badge-indigo');
    }
    const closedBadge = document.getElementById('sys-closed-badge');
    if (closedBadge) {
      closedBadge.textContent = closed.enabled ? 'On' : 'Off';
      closedBadge.className = 'badge ' + (closed.enabled ? 'badge-amber' : 'badge-green');
    }
    setText('sys-closed-total', closed.enabled ? String(closed.totalQuota) : '0 (paywall)');
    setText('sys-closed-daily', closed.enabled ? String(closed.dailyQuota) : '—');
    setText('sys-latest', ver.latestAppVersion || 'Off');
    setText('sys-min-required', ver.minRequiredAppVersion || 'Off');
    setText('sys-min-catalog', ver.minAppVersion || 'Off');
    setText('sys-store', ver.storeUrl || '—');
    setText('sys-cap', fmtMoney(spend.capUsd, 2));
    setText('sys-today', fmtMoney(spend.todayCostUsd, 2));
    setText('sys-pause', spend.paused ? (spend.pauseReason || 'Paused') : 'Running');
    const pauseBadge = document.getElementById('sys-pause-badge');
    if (pauseBadge) {
      pauseBadge.textContent = spend.paused ? 'Paused' : 'Running';
      pauseBadge.className = 'badge ' + (spend.paused ? 'badge-red' : 'badge-green');
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  async function loadStyles() {
    document.getElementById('styles-table').innerHTML =
      '<tr><td colspan="6" class="empty"><span class="spinner"></span></td></tr>';
    try {
      const d = await apiFetch('/api/admin?resource=styles');
      const tbody = document.getElementById('styles-table');
      if (!d.ok || !d.styles.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No generations this month</td></tr>';
        return;
      }
      tbody.innerHTML = d.styles
        .map(function (s) {
          const name = s.label ? esc(s.label) : esc(s.styleId);
          const rate = Math.round((s.failRate || 0) * 100);
          return (
            '<tr><td title="' +
            esc(s.styleId) +
            '">' +
            name +
            '</td><td>' +
            s.jobs +
            '</td><td>' +
            s.completed +
            '</td><td>' +
            s.failed +
            '</td><td>' +
            rate +
            '%</td><td>' +
            fmtMoney(s.costUsd, 2) +
            '</td></tr>'
          );
        })
        .join('');
      setRefreshed();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────
  function debounceLoadJobs() {
    clearTimeout(jobFilterTimer);
    jobFilterTimer = setTimeout(function () {
      jobPage = 1;
      loadJobs();
    }, 300);
  }

  async function loadJobs() {
    const status = document.getElementById('job-status').value;
    const style = document.getElementById('job-style').value.trim();
    const userId = document.getElementById('job-user').value.trim();
    const q = document.getElementById('job-search').value.trim();
    const qs = new URLSearchParams({ page: String(jobPage), limit: '20' });
    if (status) qs.set('status', status);
    if (style) qs.set('style', style);
    if (userId) qs.set('userId', userId);
    if (q) qs.set('q', q);

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
          const styleName = j.style_label ? esc(j.style_label) : esc(j.style_id);
          return (
            '<tr>' +
            '<td><button class="btn btn-ghost btn-sm" type="button" data-job-open="' +
            j.id +
            '">' +
            j.id.slice(0, 8) +
            '…</button></td>' +
            '<td class="mono">' +
            (j.user_id ? j.user_id.slice(0, 8) + '…' : '—') +
            '</td>' +
            '<td title="' +
            esc(j.style_id) +
            '">' +
            styleName +
            '</td>' +
            '<td><span class="badge ' +
            statusBadge(j.status) +
            '">' +
            j.status +
            '</span></td>' +
            '<td>' +
            fmtMoney(j.cost_usd, 2) +
            '</td>' +
            '<td>' +
            fmtDate(j.created_at) +
            '</td>' +
            '<td class="cell-actions"><div class="cell-actions-inner">' +
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
            '</div></td>' +
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

  async function openJobPanel(jobId) {
    setPanelTitle('Job');
    document.getElementById('user-panel').classList.add('open');
    document.getElementById('panel-backdrop').classList.add('open');
    document.getElementById('user-panel-body').innerHTML = '<span class="spinner"></span>';
    try {
      const d = await apiFetch('/api/admin?resource=jobs&id=' + encodeURIComponent(jobId));
      if (!d.ok || !d.job) {
        lastJobDetail = null;
        document.getElementById('user-panel-body').innerHTML =
          '<div class="error-msg">' + esc(d.error || 'Failed to load job') + '</div>';
        return;
      }
      lastJobDetail = d.job;
      renderJobPanel(d.job);
    } catch (e) {
      lastJobDetail = null;
      document.getElementById('user-panel-body').innerHTML =
        '<div class="error-msg">Error loading job</div>';
    }
  }

  function renderJobPanel(j) {
    const styleName = j.style_label ? esc(j.style_label) + ' <span class="mono">(' + esc(j.style_id) + ')</span>' : esc(j.style_id);
    const input = safeImageUrl(j.input_image_url);
    const output = safeImageUrl(j.output_image_url);
    const media =
      input || output
        ? '<div class="media-grid">' +
          (input
            ? '<figure><figcaption>Input</figcaption><img alt="Input" src="' + esc(input) + '"></figure>'
            : '') +
          (output
            ? '<figure><figcaption>Output</figcaption><img alt="Output" src="' + esc(output) + '"></figure>'
            : '') +
          '</div>'
        : '';
    document.getElementById('user-panel-body').innerHTML =
      fieldRow('ID', '<span class="mono">' + esc(j.id) + '</span>') +
      fieldRow('Status', '<span class="badge ' + statusBadge(j.status) + '">' + esc(j.status) + '</span>') +
      fieldRow('Style', styleName) +
      fieldRow('Model', esc(j.model_label || '—')) +
      fieldRow('Model id', '<span class="mono">' + esc(j.model_version || j.configured_model || '—') + '</span>') +
      fieldRow('Cost', fmtMoney(j.cost_usd, 4)) +
      fieldRow('Priority', String(j.priority ?? '—')) +
      fieldRow('User', j.user_id
        ? '<button class="btn btn-ghost btn-sm" type="button" data-user="' + esc(j.user_id) + '">' + esc(j.email || j.user_id.slice(0, 8) + '…') + '</button>'
        : '—') +
      fieldRow('Tier', j.subscription_tier ? tierLabel(j.subscription_tier) : '—') +
      fieldRow('Created', fmtDate(j.created_at)) +
      fieldRow('Started', fmtDate(j.started_at)) +
      fieldRow('Completed', fmtDate(j.completed_at)) +
      fieldRow('Replicate', '<span class="mono">' + esc(j.replicate_prediction_id || '—') + '</span>') +
      '<div class="section-title">Error</div>' +
      '<div class="panel-note">' + esc(j.error_message || 'None') + '</div>' +
      (j.sheet_expressions
        ? '<div class="section-title">Sheet</div><div class="panel-note">' + esc(j.sheet_expressions) + '</div>'
        : '') +
      (media ? '<div class="section-title">Images</div>' + media : '') +
      '<div class="section-title">Actions</div>' +
      '<div class="panel-actions">' +
      (j.status === 'failed'
        ? '<button class="btn btn-success btn-sm" type="button" data-job-action="retry" data-job="' + j.id + '">Retry</button>'
        : '') +
      (j.status === 'pending' || j.status === 'processing'
        ? '<button class="btn btn-danger btn-sm" type="button" data-job-action="cancel" data-job="' + j.id + '">Cancel</button>'
        : '') +
      '</div>';
  }

  async function jobAction(action, jobId) {
    const reason = askReason(cap(action) + ' this job');
    if (!reason) return;
    try {
      const d = await apiFetch('/api/admin?resource=jobs&action=' + action + '&jobId=' + jobId, {
        method: 'POST',
        body: JSON.stringify({ reason: reason }),
      });
      if (d.ok) {
        loadJobs();
        if (lastJobDetail && lastJobDetail.id === jobId) openJobPanel(jobId);
      } else alert(d.error || 'Action failed');
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

      var resumeBtn = document.getElementById('q-resume-btn');
      if (resumeBtn) resumeBtn.style.display = d.queue.canResumeBilling ? '' : 'none';
      var pauseBtn = document.getElementById('q-pause-btn');
      if (pauseBtn) pauseBtn.style.display = d.queue.canPause ? '' : 'none';
      var resumeOpBtn = document.getElementById('q-resume-op-btn');
      if (resumeOpBtn) resumeOpBtn.style.display = d.queue.canResumeOperator ? '' : 'none';

      var priority = d.queue.byPriority || {};
      setText(
        'q-priority',
        'Pending by plan — pro ' +
          (priority.high || 0) +
          ', popular ' +
          (priority.medium || 0) +
          ', other ' +
          (priority.low || 0) +
          '. Oldest pending: ' +
          (d.queue.oldestPendingJob ? fmtDate(d.queue.oldestPendingJob) : 'none')
      );

      renderQueueMoney(d);

      var queueAlerts = [];
      if (d.queue.isPaused) {
        queueAlerts.push({
          kind: 'danger',
          title:
            d.queue.pauseKind === 'billing'
              ? 'Paused — Replicate credits'
              : d.queue.pauseKind === 'operator'
                ? 'Paused by an admin'
                : 'Queue is paused',
          body:
            (d.queue.pauseReason || 'Cost protection triggered.') +
            (d.queue.canResumeBilling ? ' Top up Replicate, then resume the billing pause.' : '') +
            (d.queue.canResumeOperator ? ' Resume the operator pause when you want generations to run.' : ''),
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

  async function queueOperatorAction(action) {
    const reason = askReason(action === 'pause' ? 'Pause the queue' : 'Resume the operator pause');
    if (!reason) return;
    try {
      const d = await apiFetch('/api/admin?resource=queue-stats&action=' + action, {
        method: 'POST',
        body: JSON.stringify({ reason: reason }),
      });
      alert(d.message || (d.ok ? 'Updated' : d.error || 'Failed'));
      loadQueue();
    } catch (e) {
      alert('Request failed');
    }
  }

  async function resumeQueue() {
    const reason = askReason('Resume the queue');
    if (!reason) return;
    try {
      const d = await apiFetch('/api/admin?resource=queue-stats&action=resume', {
        method: 'POST',
        body: JSON.stringify({ reason: reason }),
      });
      alert(d.message || (d.ok ? 'Queue resumed' : d.error || 'Resume failed'));
      loadQueue();
    } catch (e) {
      alert('Resume request failed');
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
          const flags = (row.violations || [])
            .map(function (v) {
              return v.category + ' ' + Math.round((v.score || 0) * 100) + '%';
            })
            .join(', ');
          const summary = [row.source, row.stage, flags].filter(Boolean).join(' · ') || '—';
          const image = safeImageUrl(row.imageUrl);
          return (
            '<tr>' +
            '<td>' +
            (image ? '<img class="mod-thumb" alt="" src="' + esc(image) + '">' : '—') +
            '</td>' +
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
            esc(summary) +
            '</td>' +
            '<td class="cell-actions"><div class="cell-actions-inner">' +
            (row.user_id && !row.banned_at
              ? '<button class="btn btn-danger btn-sm" type="button" data-action="ban" data-user="' +
                row.user_id +
                '">Ban</button>'
              : '') +
            (row.user_id
              ? '<button class="btn btn-ghost btn-sm" type="button" data-user="' +
                row.user_id +
                '">User</button>'
              : '') +
            (row.jobId
              ? '<button class="btn btn-ghost btn-sm" type="button" data-job-open="' +
                row.jobId +
                '">Job</button>'
              : '') +
            '</div></td>' +
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
      '<tr><td colspan="6" class="empty"><span class="spinner"></span></td></tr>';

    try {
      const d = await apiFetch('/api/admin?resource=security-logs&' + qs);
      const tbody = document.getElementById('security-table');
      if (!d.ok || !d.events.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No events found</td></tr>';
        return;
      }
      tbody.innerHTML = d.events
        .map(function (ev) {
          return (
            '<tr>' +
            '<td style="white-space:nowrap">' +
            fmtDate(ev.created_at) +
            '</td>' +
            '<td>' +
            esc(ev.event_type) +
            '</td>' +
            '<td class="mono">' +
            esc(ev.ip_address || '—') +
            '</td>' +
            '<td class="mono">' +
            (ev.user_id ? ev.user_id.slice(0, 8) + '…' : '—') +
            '</td>' +
            '<td><span class="badge ' +
            (ev.success ? 'badge-green' : 'badge-red') +
            '">' +
            (ev.success ? 'OK' : 'FAIL') +
            '</span></td>' +
            '<td class="panel-note">' +
            esc(auditSummary(ev.details)) +
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setPanelTitle(text) {
    const el = document.getElementById('panel-title');
    if (el) el.textContent = text;
  }

  function askReason(label) {
    const reason = prompt(label + '\n\nReason (required, recorded in Security):');
    if (reason == null) return null;
    const trimmed = reason.trim();
    if (!trimmed) {
      alert('A reason is required');
      return null;
    }
    if (trimmed.length > 280) {
      alert('Reason must be 280 characters or fewer');
      return null;
    }
    return trimmed;
  }

  async function downloadExport(kind) {
    try {
      const r = await fetch(API + '/api/admin?resource=export&kind=' + kind, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (r.status === 401) {
        logout();
        return;
      }
      if (!r.ok) {
        alert('Export failed');
        return;
      }
      const blob = await r.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = kind + '.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    } catch (e) {
      alert('Export failed');
    }
  }

  function safeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href;
    } catch (e) {
      return '';
    }
    return '';
  }

  function auditSummary(details) {
    if (!details || typeof details !== 'object') return '—';
    const parts = [];
    if (details.reason) parts.push(details.reason);
    if (details.previousTier || details.nextTier) {
      parts.push((details.previousTier || '—') + ' → ' + (details.nextTier || '—'));
    }
    if (details.adjustment != null) {
      parts.push('adjust ' + details.adjustment + ' (' + details.previousCount + ' → ' + details.nextCount + ')');
    }
    if (details.jobId) parts.push('job ' + String(details.jobId).slice(0, 8));
    if (details.styleId) parts.push(details.styleId);
    if (details.previousError) parts.push(String(details.previousError).slice(0, 80));
    if (details.adminId) parts.push('admin ' + String(details.adminId).slice(0, 8));
    return parts.length ? parts.join(' · ') : '—';
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

  function tierLabel(t) {
    if (!t || t === 'trial') return 'No plan';
    return { starter: 'Starter', popular: 'Popular', pro: 'Pro' }[t] || cap(t);
  }

  function statusLabel(s) {
    if (!s || s === 'trial') return 'Unsubscribed';
    return cap(s);
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

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    themeToggle.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-theme-choice]');
      if (btn) applyTheme(btn.dataset.themeChoice);
    });
  }

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
  ['job-search', 'job-style', 'job-user'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', debounceLoadJobs);
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
      if (act === 'note') adminSaveNote(uid);
      return;
    }

    const exportBtn = e.target.closest('[data-export]');
    if (exportBtn) {
      downloadExport(exportBtn.dataset.export);
      return;
    }

    if (e.target.closest('#q-pause-btn')) {
      queueOperatorAction('pause');
      return;
    }
    if (e.target.closest('#q-resume-op-btn')) {
      queueOperatorAction('resume-operator');
      return;
    }
    if (e.target.closest('#q-resume-btn')) {
      resumeQueue();
      return;
    }

    const jobBtn = e.target.closest('[data-job-action]');
    if (jobBtn) {
      jobAction(jobBtn.dataset.jobAction, jobBtn.dataset.job);
      return;
    }

    const jobOpen = e.target.closest('[data-job-open]');
    if (jobOpen) openJobPanel(jobOpen.dataset.jobOpen);
  });

  // Expose for legacy inline handlers if any remain
  window.showPage = showPage;
  window.logout = logout;
  window.closePanel = closePanel;

  loadOverview();

  setInterval(function () {
    if (currentPage === 'overview') loadOverview();
    if (currentPage === 'system') loadSystem();
    if (currentPage === 'queue') loadQueue();
    if (currentPage === 'finance') loadFinance();
    if (currentPage === 'growth') loadGrowth();
  }, 60000);
})();
