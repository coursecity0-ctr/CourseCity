/**
 * Admin Authentication Utility
 * Centralized authentication and authorization checks for admin pages
 * Prevents unauthorized access to admin panel
 */

// Admin authentication check
async function checkAdminAccess() {
  try {
    // First check admin-specific session storage
    let user = null;
    const adminUser = sessionStorage.getItem('admin_user');
    
    if (adminUser) {
      try {
        user = JSON.parse(adminUser);
        // Verify it's still valid
        if (user.role === 'admin' && user.is_active !== false) {
          // User found in admin session
        } else {
          user = null;
          sessionStorage.removeItem('admin_user');
        }
      } catch (e) {
        console.error('Error parsing admin user:', e);
        sessionStorage.removeItem('admin_user');
      }
    }

    // If no admin user found, check regular session
    if (!user) {
      if (typeof AppState !== 'undefined' && AppState.user && AppState.user.role === 'admin') {
        user = AppState.user;
        // Store in admin session
        sessionStorage.setItem('admin_user', JSON.stringify(user));
      } else {
        // Try to get from storage
        const storedUser = localStorage.getItem('coursecity_user') || sessionStorage.getItem('coursecity_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role === 'admin' && parsedUser.is_active !== false) {
              user = parsedUser;
              // Store in admin session
              sessionStorage.setItem('admin_user', JSON.stringify(user));
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
    }

    // If no user found locally, try API
    if (!user) {
      try {
        const userData = await API.getCurrentUser();
        if (userData && userData.user) {
          const fetchedUser = userData.user;
          // Only use if it's an admin
          if (fetchedUser.role === 'admin' && fetchedUser.is_active !== false) {
            user = fetchedUser;
            // Store in admin session
            sessionStorage.setItem('admin_user', JSON.stringify(user));
            // Update AppState if available
            if (typeof AppState !== 'undefined') {
              AppState.user = user;
            }
          } else {
            // Not an admin, redirect to admin login
            redirectToLogin();
            return false;
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // User is not authenticated
        redirectToLogin();
        return false;
      }
    }

    // Verify admin access with backend (double-check)
    try {
      await API.verifyAdminAccess();
    } catch (error) {
      console.error('Admin verification failed:', error);
      // Backend confirms user is not admin
      showAccessDenied('Access denied. Admin privileges required.');
      return false;
    }

    // Check if user exists
    if (!user) {
      console.warn('No user found - redirecting to login');
      redirectToLogin();
      return false;
    }

    // Check if user is active
    if (user.is_active === false || user.is_active === 0) {
      console.warn('User account is inactive');
      showAccessDenied('Your account has been deactivated. Please contact support.');
      return false;
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      console.warn('User does not have admin role:', user.role);
      showAccessDenied('Access denied. Admin privileges required.');
      return false;
    }

    // User is authenticated and is admin
    return {
      authorized: true,
      user: user
    };

  } catch (error) {
    console.error('Error checking admin access:', error);
    showAccessDenied('Failed to verify admin access. Please try again.');
    return false;
  }
}

// Redirect to admin login page
function redirectToLogin() {
  const currentPath = window.location.pathname;
  let loginPath = 'login.html';
  
  // Determine correct path based on current location
  if (currentPath.includes('/pages/admin/')) {
    loginPath = 'login.html';
  } else if (currentPath.includes('/admin/')) {
    loginPath = 'login.html';
  }
  
  // Store return URL for redirect after login
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${loginPath}?return=${returnUrl}`;
}

// Show access denied message and redirect
function showAccessDenied(message) {
  // Hide page content immediately
  const mainContent = document.querySelector('.admin-main') || document.querySelector('main') || document.body;
  if (mainContent) {
    mainContent.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 2rem; text-align: center;">
        <div style="font-size: 4rem; color: #dc3545; margin-bottom: 1rem;">
          <i class="fas fa-shield-alt"></i>
        </div>
        <h1 style="color: #dc3545; margin-bottom: 1rem;">Access Denied</h1>
        <p style="color: #666; font-size: 1.1rem; margin-bottom: 2rem; max-width: 500px;">
          ${message}
        </p>
        <div>
          <a href="../../pages/index.html" class="btn btn-primary" style="text-decoration: none; display: inline-block; margin-right: 1rem;">
            <i class="fas fa-home"></i> Go to Homepage
          </a>
          <a href="login.html" class="btn btn-secondary" style="text-decoration: none; display: inline-block;">
            <i class="fas fa-sign-in-alt"></i> Admin Login
          </a>
        </div>
      </div>
    `;
  }

  // Show toast if available
  if (typeof showToast === 'function') {
    showToast(message, 'error');
  } else {
    alert(message);
  }

  // Redirect after delay
  setTimeout(() => {
    redirectToLogin();
  }, 3000);
}

// Initialize admin page with authentication check
async function initAdminPage() {
  // Check admin access first (don't show loading overlay to avoid disrupting layout)
  const authResult = await checkAdminAccess();

  if (!authResult || !authResult.authorized) {
    // Access denied - showAccessDenied already handled the UI
    return false;
  }

  // Return user data for use in page scripts
  return authResult.user;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkAdminAccess,
    initAdminPage,
    redirectToLogin,
    showAccessDenied
  };
}

