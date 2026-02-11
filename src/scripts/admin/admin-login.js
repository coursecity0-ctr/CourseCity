/**
 * Admin Login Handler
 * Separate authentication flow for admin users
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('admin-login-form');
  const errorMessage = document.getElementById('error-message');
  const loginBtn = document.getElementById('admin-login-btn');

  if (!loginForm) {
    console.error('Admin login form not found');
    return;
  }

  // Check if already logged in as admin
  checkExistingAdminSession();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');

    // Validation
    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    // Show loading state
    loginBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    hideError();

    try {
      // Attempt login
      const result = await API.login(email, password);

      if (!result || !result.user) {
        throw new Error('Invalid response from server');
      }

      // Verify user is admin
      if (result.user.role !== 'admin') {
        // Clear session if non-admin logged in
        await API.logout();
        throw new Error('Access denied. Admin privileges required.');
      }

      // Check if admin account is active
      if (result.user.is_active === false || result.user.is_active === 0) {
        await API.logout();
        throw new Error('Your admin account has been deactivated. Please contact support.');
      }

      // Store admin user in sessionStorage (separate from regular user session)
      sessionStorage.setItem('admin_user', JSON.stringify(result.user));
      
      // Also update AppState if available
      if (typeof AppState !== 'undefined') {
        AppState.user = result.user;
        AppState.saveToStorage();
      }

      // Show success message
      showSuccess('Login successful! Redirecting to admin dashboard...');

      // Redirect to admin dashboard
      setTimeout(() => {
        // Check for return URL
        const urlParams = new URLSearchParams(window.location.search);
        const returnUrl = urlParams.get('return');
        
        if (returnUrl && returnUrl.includes('admin/')) {
          window.location.href = decodeURIComponent(returnUrl);
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1000);

    } catch (error) {
      console.error('Admin login error:', error);
      
      let errorMsg = 'Login failed. Please check your credentials.';
      if (error.message) {
        errorMsg = error.message;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMsg = 'Cannot connect to server. Please ensure the backend is running.';
      }

      showError(errorMsg);

      // Re-enable button
      loginBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  });
});

// Check if user is already logged in as admin
async function checkExistingAdminSession() {
  try {
    // Check sessionStorage first (admin-specific)
    const adminUser = sessionStorage.getItem('admin_user');
    if (adminUser) {
      const user = JSON.parse(adminUser);
      if (user.role === 'admin' && user.is_active !== false) {
        // Verify with backend
        try {
          await API.verifyAdminAccess();
          // Already logged in, redirect to dashboard
          window.location.href = 'dashboard.html';
          return;
        } catch (error) {
          // Session invalid, clear it
          sessionStorage.removeItem('admin_user');
        }
      }
    }

    // Check API for current user
    const userData = await API.getCurrentUser();
    if (userData && userData.user) {
      if (userData.user.role === 'admin' && userData.user.is_active !== false) {
        // Verify admin access
        try {
          await API.verifyAdminAccess();
          // Store as admin user
          sessionStorage.setItem('admin_user', JSON.stringify(userData.user));
          window.location.href = 'dashboard.html';
          return;
        } catch (error) {
          // Not admin or session expired
        }
      }
    }
  } catch (error) {
    // Not logged in or error, continue to login form
    console.log('No existing admin session found');
  }
}

// Show error message
function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    
    // Scroll to error
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Hide error message
function hideError() {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
}

// Show success message (temporary)
function showSuccess(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.style.background = '#d4edda';
    errorEl.style.borderColor = '#c3e6cb';
    errorEl.style.color = '#155724';
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

