const API = '';
let token = localStorage.getItem('admin_token');
let currentPage = 'overview';
let userPage = 1, jobPage = 1;
let debounceTimer;

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (!token) { window.location.href = '/admin/login'; throw 0; }
try {
  const p = JSON.parse(atob(token.split('.')[1]));
  document.getElementById('adminLabel').textContent = p.userId.slice(0,8) + 'â€¦';
  if (p.exp * 1000 < Date.now()) logout();
} catch(e) { logout(); }

function logout() {
  localStorage.removeItem('admin_token');
  window.location.href = '/admin/login';
}

async function apiFetch(path, opts = {}) {
  const r = await fetch(API + path, {
    ...opts,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (r.status === 401) { logout(); throw new Error('Unauthorized'); }
  return r.json();
}

// â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const titles = { overview:'Overview', users:'Users', jobs:'Jobs', queue:'Queue', security:'Security Logs' };
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item')[['overview','users','jobs','queue','security'].indexOf(name)].classList.add('active');
  document.getElementById('pageTitle').textContent = titles[name];
  currentPage = name;
  if (name === 'overview') loadOverview();
  if (name === 'users') loadUsers();
  if (name === 'jobs') loadJobs();
  if (name === 'queue') loadQueue();
  if (name === 'security') loadSecurity();
}

function setRefreshed() {
  document.getElementById('lastRefresh').textContent = 'Updated ' + new Date().toLocaleTimeString();
}

// â”€â”€ Overview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadOverview() {
  try {
    const d = await apiFetch('/api/admin?resource=stats');
    if (!d.ok) return;
    document.getElementById('ov-users').textContent = d.users.total.toLocaleString();
    const active = (d.users.byTier || []).filter(r => r.subscription_status === 'active').reduce((s,r) => s + r.count, 0);
    document.getElementById('ov-active').textContent = active.toLocaleString();
    document.getElementById('ov-mrr').textContent = '$' + Number(d.revenue.mrrEstimateUsd).toLocaleString();
    document.getElementById('ov-jobs-today').textContent = d.jobs.today.toLocaleString();
    document.getElementById('ov-jobs-total').textContent = d.jobs.total.toLocaleString();
    document.getElementById('ov-banned').textContent = d.users.banned;

    const tierBody = document.getElementById('tier-table');
    tierBody.innerHTML = d.users.byTier.map(r => `
      <tr><td>${cap(r.subscription_tier)}</td><td>${cap(r.subscription_status)}</td><td><strong>${r.count}</strong></td></tr>
    `).join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';

    const trendBody = document.getElementById('jobs-trend');
    trendBody.innerHTML = d.jobs.last7Days.map(r => `
      <tr><td>${r.date}</td><td class="badge badge-green">${r.completed}</td><td class="badge badge-red">${r.failed}</td></tr>
    `).join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';

    setRefreshed();
  } catch(e) { console.error(e); }
}

// â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function debounceLoadUsers() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { userPage = 1; loadUsers(); }, 350);
}

async function loadUsers() {
  const search = document.getElementById('user-search').value.trim();
  const tier = document.getElementById('user-tier').value;
  const status = document.getElementById('user-status').value;
  const qs = new URLSearchParams({ page: userPage, limit: 20 });
  if (search) qs.set('search', search);
  if (tier) qs.set('tier', tier);
  if (status) qs.set('status', status);

  document.getElementById('users-table').innerHTML = '<tr><td colspan="7" class="empty"><span class="spinner"></span></td></tr>';
  try {
    const d = await apiFetch('/api/admin?resource=users&' + qs);
    const tbody = document.getElementById('users-table');
    if (!d.ok || !d.users.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No users found</td></tr>'; return; }
    tbody.innerHTML = d.users.map(u => `
      <tr>
        <td class="mono">${u.id.slice(0,8)}â€¦</td>
        <td>${u.email || '<span style="color:var(--muted)">â€”</span>'}</td>
        <td><span class="badge ${tierBadge(u.subscription_tier)}">${cap(u.subscription_tier)}</span></td>
        <td><span class="badge ${statusBadge(u.subscription_status)}">${cap(u.subscription_status)}</span></td>
        <td>${u.usage_this_month}</td>
        <td>${fmtDate(u.created_at)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="openUserPanel('${u.id}')">View</button></td>
      </tr>
    `).join('');
    renderPagination('users-pagination', d.page, d.pages, p => { userPage = p; loadUsers(); });
    setRefreshed();
  } catch(e) { console.error(e); }
}

async function openUserPanel(userId) {
  document.getElementById('user-panel').classList.add('open');
  document.getElementById('user-panel-body').innerHTML = '<span class="spinner"></span>';
  try {
    const d = await apiFetch('/api/admin?resource=users&id=' + userId);
    if (!d.ok) { document.getElementById('user-panel-body').innerHTML = '<div class="error-msg">Failed to load user</div>'; return; }
    const u = d.user;
    const isBanned = !!u.banned_at;
    document.getElementById('user-panel-body').innerHTML = `
      <div class="field-row"><span class="field-label">ID</span><span class="field-value mono">${u.id}</span></div>
      <div class="field-row"><span class="field-label">Email</span><span class="field-value">${u.email || 'â€”'}</span></div>
      <div class="field-row"><span class="field-label">RevenueCat ID</span><span class="field-value mono">${u.revenuecat_user_id || 'â€”'}</span></div>
      <div class="field-row"><span class="field-label">Tier</span><span class="field-value"><span class="badge ${tierBadge(u.subscription_tier)}">${cap(u.subscription_tier)}</span></span></div>
      <div class="field-row"><span class="field-label">Status</span><span class="field-value"><span class="badge ${statusBadge(u.subscription_status)}">${cap(u.subscription_status)}</span></span></div>
      <div class="field-row"><span class="field-label">Trial Used</span><span class="field-value">${u.trial_generations_used} / 3</span></div>
      <div class="field-row"><span class="field-label">Usage This Month</span><span class="field-value">${u.usage_this_month}</span></div>
      <div class="field-row"><span class="field-label">Infringements</span><span class="field-value">${d.infringements}</span></div>
      <div class="field-row"><span class="field-label">Banned</span><span class="field-value">${isBanned ? 'ðŸš« ' + fmtDate(u.banned_at) : 'No'}</span></div>
      <div class="field-row"><span class="field-label">Joined</span><span class="field-value">${fmtDate(u.created_at)}</span></div>
      ${d.subscription ? `
        <div class="section-title">Subscription</div>
        <div class="field-row"><span class="field-label">Platform</span><span class="field-value">${cap(d.subscription.platform)}</span></div>
        <div class="field-row"><span class="field-label">Period End</span><span class="field-value">${fmtDate(d.subscription.current_period_end)}</span></div>
        <div class="field-row"><span class="field-label">Cancel at End</span><span class="field-value">${d.subscription.cancel_at_period_end ? 'Yes' : 'No'}</span></div>
      ` : ''}
      <div class="section-title">Actions</div>
      <div class="panel-actions">
        ${isBanned
          ? `<button class="btn btn-success btn-sm" onclick="adminAction('unban','${u.id}')">Unban User</button>`
          : `<button class="btn btn-danger btn-sm" onclick="adminAction('ban','${u.id}')">Ban User</button>`}
        <button class="btn btn-ghost btn-sm" onclick="adminAdjustQuota('${u.id}')">Adjust Quota</button>
        <button class="btn btn-ghost btn-sm" onclick="adminChangeTier('${u.id}')">Change Tier</button>
      </div>
      <div class="section-title">Recent Jobs (${d.recentJobs.length})</div>
      ${d.recentJobs.length ? `<table style="font-size:12px">
        <thead><tr><th>ID</th><th>Style</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${d.recentJobs.map(j => `
          <tr><td class="mono">${j.id.slice(0,8)}â€¦</td><td>${j.style_id}</td>
          <td><span class="badge ${statusBadge(j.status)}">${j.status}</span></td>
          <td>${fmtDate(j.created_at)}</td></tr>
        `).join('')}</tbody>
      </table>` : '<div style="color:var(--muted);font-size:12px">No jobs yet</div>'}
    `;
  } catch(e) { document.getElementById('user-panel-body').innerHTML = '<div class="error-msg">Error loading user</div>'; }
}

function closePanel() { document.getElementById('user-panel').classList.remove('open'); }

async function adminAction(action, userId) {
  if (!confirm(`${cap(action)} this user?`)) return;
  try {
    const d = await apiFetch(`/api/admin?resource=users&action=${action}`, { method: 'POST', body: JSON.stringify({ userId }) });
    if (d.ok) { openUserPanel(userId); loadUsers(); }
    else alert(d.error || 'Action failed');
  } catch(e) { alert('Request failed'); }
}

async function adminAdjustQuota(userId) {
  const val = prompt('Quota adjustment (positive to add, negative to subtract):');
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n)) return alert('Enter a number');
  const d = await apiFetch('/api/admin?resource=users&action=quota', { method: 'POST', body: JSON.stringify({ userId, adjustment: n }) });
  if (d.ok) { openUserPanel(userId); } else alert(d.error || 'Failed');
}

async function adminChangeTier(userId) {
  const tier = prompt('New tier (trial/starter/popular/pro):');
  if (!tier) return;
  const d = await apiFetch('/api/admin?resource=users&action=tier', { method: 'POST', body: JSON.stringify({ userId, tier }) });
  if (d.ok) { openUserPanel(userId); loadUsers(); } else alert(d.error || 'Failed');
}

// â”€â”€ Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadJobs() {
  const status = document.getElementById('job-status').value;
  const qs = new URLSearchParams({ page: jobPage, limit: 20 });
  if (status) qs.set('status', status);
  document.getElementById('jobs-table').innerHTML = '<tr><td colspan="7" class="empty"><span class="spinner"></span></td></tr>';
  try {
    const d = await apiFetch('/api/admin?resource=jobs&' + qs);
    const tbody = document.getElementById('jobs-table');
    if (!d.ok || !d.jobs.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty">No jobs found</td></tr>'; return; }
    tbody.innerHTML = d.jobs.map(j => `
      <tr>
        <td class="mono">${j.id.slice(0,8)}â€¦</td>
        <td class="mono">${j.user_id ? j.user_id.slice(0,8) + 'â€¦' : 'â€”'}</td>
        <td>${j.style_id}</td>
        <td><span class="badge ${statusBadge(j.status)}">${j.status}</span></td>
        <td>${j.priority}</td>
        <td>${fmtDate(j.created_at)}</td>
        <td style="display:flex;gap:4px">
          ${j.status === 'failed' ? `<button class="btn btn-success btn-sm" onclick="jobAction('retry','${j.id}')">Retry</button>` : ''}
          ${['pending','processing'].includes(j.status) ? `<button class="btn btn-danger btn-sm" onclick="jobAction('cancel','${j.id}')">Cancel</button>` : ''}
        </td>
      </tr>
    `).join('');
    renderPagination('jobs-pagination', d.page, d.pages, p => { jobPage = p; loadJobs(); });
    setRefreshed();
  } catch(e) { console.error(e); }
}

async function jobAction(action, jobId) {
  try {
    const d = await apiFetch(`/api/admin?resource=jobs&action=${action}&jobId=${jobId}`, { method: 'POST' });
    if (d.ok) loadJobs(); else alert(d.error || 'Action failed');
  } catch(e) { alert('Request failed'); }
}

// â”€â”€ Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadQueue() {
  try {
    const d = await apiFetch('/api/admin?resource=queue-stats');
    if (!d.ok) return;
    document.getElementById('q-pending').textContent = d.queue.pending;
    document.getElementById('q-processing').textContent = d.queue.processing;
    document.getElementById('q-status').innerHTML = d.queue.isPaused
      ? '<span class="badge badge-red">Paused</span>'
      : '<span class="badge badge-green">Active</span>';
    document.getElementById('q-wait').textContent = d.queue.averageWaitTime + 's';
    document.getElementById('q-cost').textContent = '$' + d.today.costUsd.toFixed(2);
    document.getElementById('q-cap-pct').textContent = d.today.costPercent + '%';

    const body = document.getElementById('spending-table');
    body.innerHTML = d.spending7d.map(r => `
      <tr><td>${r.date}</td><td>$${r.cost.toFixed(4)}</td><td>${r.jobs}</td></tr>
    `).join('') || '<tr><td colspan="3" class="empty">No data</td></tr>';
    setRefreshed();
  } catch(e) { console.error(e); }
}

// â”€â”€ Security â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function loadSecurity() {
  const type = document.getElementById('sec-type').value;
  const success = document.getElementById('sec-success').value;
  const qs = new URLSearchParams({ limit: 100 });
  if (type) qs.set('eventType', type);
  if (success !== '') qs.set('success', success);
  document.getElementById('security-table').innerHTML = '<tr><td colspan="5" class="empty"><span class="spinner"></span></td></tr>';
  try {
    const d = await apiFetch('/api/admin?resource=security-logs&' + qs);
    const tbody = document.getElementById('security-table');
    if (!d.ok || !d.events.length) { tbody.innerHTML = '<tr><td colspan="5" class="empty">No events found</td></tr>'; return; }
    tbody.innerHTML = d.events.map(e => `
      <tr>
        <td style="white-space:nowrap">${fmtDate(e.created_at)}</td>
        <td>${e.event_type}</td>
        <td class="mono">${e.ip_address || 'â€”'}</td>
        <td class="mono">${e.user_id ? e.user_id.slice(0,8) + 'â€¦' : 'â€”'}</td>
        <td><span class="badge ${e.success ? 'badge-green' : 'badge-red'}">${e.success ? 'OK' : 'FAIL'}</span></td>
      </tr>
    `).join('');
    setRefreshed();
  } catch(e) { console.error(e); }
}

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'â€”'; }
function fmtDate(d) { return d ? new Date(d).toLocaleString() : 'â€”'; }
function tierBadge(t) { return { trial:'badge-gray', starter:'badge-green', popular:'badge-indigo', pro:'badge-amber' }[t] || 'badge-gray'; }
function statusBadge(s) { return { active:'badge-green', trial:'badge-gray', canceled:'badge-amber', expired:'badge-red', completed:'badge-green', failed:'badge-red', pending:'badge-gray', processing:'badge-indigo' }[s] || 'badge-gray'; }

function renderPagination(id, page, pages, cb) {
  const el = document.getElementById(id);
  if (pages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <button class="btn btn-ghost btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="(${cb})(${page-1})">â€¹ Prev</button>
    <span style="color:var(--muted);font-size:12px">Page ${page} of ${pages}</span>
    <button class="btn btn-ghost btn-sm" ${page >= pages ? 'disabled' : ''} onclick="(${cb})(${page+1})">Next â€º</button>
  `;
}

// Initial load
loadOverview();
// Auto-refresh every 60s
setInterval(() => { if (currentPage === 'overview') loadOverview(); if (currentPage === 'queue') loadQueue(); }, 60000);
