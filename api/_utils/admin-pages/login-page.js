(function () {
  const form = document.getElementById('loginForm');
  const userIdInput = document.getElementById('userId');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');
  const clearLink = document.getElementById('clearStoredLogin');

  const ERROR_MESSAGES = {
    ACCESS_DENIED: 'Not an admin. Use an admin_users id/email, or a legacy users.id listed in ADMIN_USER_IDS.',
    INVALID_CREDENTIALS: 'Admin not found in this environment. Use admin_users (or staging vs production DB mismatch).',
    LOGIN_FAILED: 'Server error during login. Redeploy after the latest admin fixes.',
    RATE_LIMITED: 'Too many login attempts. Wait 15 minutes and try again.',
    AUTH_CONFIG_ERROR: 'Server auth is not configured (JWT_SECRET missing on Vercel).',
    ADMIN_NOT_CONFIGURED: 'No admins configured. Insert into admin_users (or set ADMIN_USER_IDS) and redeploy.',
    INVALID_USER_ID: 'Enter an admin UUID or email.',
  };

  function formatError(data, status) {
    const code = data?.error || '';
    if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
    return data?.message || code || `Error: ${status}`;
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    successDiv.classList.remove('show');
  }

  function showSuccess(message) {
    successDiv.textContent = message;
    successDiv.classList.add('show');
    errorDiv.classList.remove('show');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.innerHTML = loading
      ? '<span class="loading"></span>Signing in...'
      : 'Sign in';
  }

  if (clearLink) {
    clearLink.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('admin_token');
      showSuccess('Saved login cleared. You can sign in again.');
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const userId = userIdInput.value.trim();
    if (!userId) {
      showError('Admin ID or email is required');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const looksLikeEmail = userId.includes('@');
    if (!uuidRegex.test(userId) && !looksLikeEmail) {
      showError('Enter an admin UUID or email');
      return;
    }

    setLoading(true);
    showError('');
    showSuccess('');

    try {
      const response = await fetch('/api/admin?resource=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(function () { return { error: 'Unknown error' }; });
        showError(formatError(errorData, response.status));
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        showSuccess('Login successful! Redirecting...');
        setTimeout(function () {
          window.location.href = '/admin/dashboard';
        }, 500);
      } else {
        showError(formatError(data, 0) || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      showError('Cannot connect to server. Check your internet connection and try again.');
      setLoading(false);
    }
  });

  const token = localStorage.getItem('admin_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        window.location.href = '/admin/dashboard';
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch (e) {
      localStorage.removeItem('admin_token');
    }
  }
})();
