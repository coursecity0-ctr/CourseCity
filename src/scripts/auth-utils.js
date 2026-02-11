/**
 * Authentication Utilities
 * Handles secure authentication checks and redirects
 */

// Get API base URL (same logic as api.js)
const isProduction = typeof window !== 'undefined' &&
  window.location &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1');

let API_BASE_URL;
if (isProduction) {
  API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;
} else {
  const __API_HOST__ = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
  API_BASE_URL = `http://${__API_HOST__}:5000/api`;
}

/**
 * Authentication Utilities Class
 */
class AuthUtils {

  /**
   * Check if user is authenticated via backend API
   * @returns {Promise<{authenticated: boolean, user: object|null}>}
   */
  static async checkAuthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include', // Important for session cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        authenticated: data.authenticated || false,
        user: data.user || null
      };
    } catch (error) {
      console.error('Auth status check failed:', error);
      return {
        authenticated: false,
        user: null
      };
    }
  }

  /**
   * Require authentication for an action
   * If not authenticated, redirect to login with return URL
   * @param {string} intendedPage - The page user wants to access
   * @param {Function} callback - Function to execute if authenticated
   */
  static async requireAuth(intendedPage, callback) {
    try {
      const authStatus = await this.checkAuthStatus();

      if (authStatus.authenticated) {
        // User is authenticated, execute callback
        if (typeof callback === 'function') {
          callback(authStatus.user);
        }
        return true;
      } else {
        // User not authenticated, redirect to login
        this.redirectToLogin(intendedPage);
        return false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // On error, redirect to login for safety
      this.redirectToLogin(intendedPage);
      return false;
    }
  }

  /**
   * Redirect to login page with return URL
   * @param {string} returnUrl - URL to return to after login
   */
  static redirectToLogin(returnUrl) {
    // Store intended destination in localStorage
    if (returnUrl) {
      localStorage.setItem('redirectAfterLogin', returnUrl);
    }

    // Get login URL and add debugging
    const loginUrl = this.getLoginUrl();
    console.log('Current path:', window.location.pathname);
    console.log('Redirecting to login URL:', loginUrl);
    console.log('Full redirect URL will be:', new URL(loginUrl, window.location.href).href);

    // Redirect to login page
    window.location.href = loginUrl;
  }

  /**
   * Get login page URL
   * @returns {string}
   */
  static getLoginUrl() {
    // Determine current path and compute a correct relative login path
    const currentPath = window.location.pathname;

    // If we're in any subdirectory of src/pages/, compute depth dynamically
    if (currentPath.includes('/src/pages/')) {
      const parts = currentPath.split('/');
      const pagesIndex = parts.indexOf('pages');

      if (pagesIndex !== -1) {
        // Number of folder levels after "pages" before the filename
        const depthAfterPages = parts.length - pagesIndex - 2; // exclude 'pages' and filename
        let prefix = '../'; // from src/pages to src/

        for (let i = 0; i < depthAfterPages; i++) {
          prefix += '../';
        }

        return prefix + 'auth/login.html';
      }

      // Fallback if for some reason we can't detect depth
      return '../auth/login.html';
    }
    // If we're in src/ but not in pages/ subdirectory
    else if (currentPath.includes('/src/') && !currentPath.includes('/pages/')) {
      return 'auth/login.html';
    }
    // If we're at root level or any other location
    else {
      return 'src/auth/login.html';
    }
  }

  /**
   * Handle post-login redirect
   * Call this after successful login
   */
  static handlePostLoginRedirect() {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');

    if (redirectUrl) {
      // Clear the stored redirect URL
      localStorage.removeItem('redirectAfterLogin');

      // Redirect to intended page
      window.location.href = redirectUrl;
    } else {
      // Default redirect to homepage
      window.location.href = this.getHomepageUrl();
    }
  }

  /**
   * Get homepage URL relative to current location
   * @returns {string}
   */
  static getHomepageUrl() {
    const currentPath = window.location.pathname;

    if (currentPath.includes('/src/pages/')) {
      return 'index.html';
    } else if (currentPath.includes('/src/auth/')) {
      return '../pages/index.html';
    } else if (currentPath.includes('/src/')) {
      return 'pages/index.html';
    } else {
      return 'src/pages/index.html';
    }
  }

  /**
   * Protected navigation - checks auth before navigating
   * @param {string} targetPage - Page to navigate to
   */
  static async navigateIfAuthenticated(targetPage) {
    const isAuthenticated = await this.requireAuth(targetPage, () => {
      window.location.href = targetPage;
    });

    return isAuthenticated;
  }

  /**
   * Show authentication required message
   * @param {string} action - The action that requires authentication
   */
  static showAuthRequiredMessage(action = 'access this feature') {
    // You can customize this to use your toast notification system
    if (typeof showToast === 'function') {
      showToast(`Please log in to ${action}`, 'warning');
    } else {
      alert(`Please log in to ${action}`);
    }
  }

  /**
   * Initialize authentication state on page load
   * Updates UI based on authentication status
   */
  static async initializeAuthState() {
    try {
      const authStatus = await this.checkAuthStatus();

      // Update global app state if available
      if (typeof AppState !== 'undefined') {
        AppState.user = authStatus.user;
        if (typeof AppState.updateUI === 'function') {
          AppState.updateUI();
        }
      }

      // Update auth UI if function exists
      if (typeof updateAuthUI === 'function') {
        updateAuthUI();
      }

      // If user is authenticated, sync all features
      if (authStatus.authenticated && authStatus.user) {
        console.log('🔄 User is authenticated, syncing features...');

        // Sync all features if function is available
        if (typeof syncAllFeaturesAfterLogin === 'function') {
          await syncAllFeaturesAfterLogin();
        }
      }

      return authStatus;
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      return { authenticated: false, user: null };
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthUtils;
}

// Make available globally
window.AuthUtils = AuthUtils;
