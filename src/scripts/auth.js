// Authentication Handler for CourseCity
// Handles login and signup using backend API

document.addEventListener('DOMContentLoaded', () => {
  // Check if API is available
  if (typeof API === 'undefined') {
    console.error('API is not loaded! Make sure api.js is included before auth.js');
    // Show error to user
    const errorMsg = 'Authentication service is not available. Please refresh the page.';
    alert(errorMsg);
    return;
  }

  // Check if we're on login or signup page
  const loginForm = document.getElementById('page-login-form') || document.getElementById('login-form');
  const signupForm = document.getElementById('page-signup-form') || document.getElementById('signup-form');

  // Debug logging
  console.log('Auth script loaded. Forms found:', {
    loginForm: !!loginForm,
    signupForm: !!signupForm,
    apiAvailable: typeof API !== 'undefined'
  });

  // Login Form Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      
      const email = document.getElementById('page-login-email')?.value || document.getElementById('login-email')?.value;
      const password = document.getElementById('page-login-password')?.value || document.getElementById('login-password')?.value;
      const rememberMe = document.getElementById('page-remember-me')?.checked || document.getElementById('remember-me')?.checked || false;
      const submitBtn = document.getElementById('login-submit-btn');
      
      console.log('Login attempt:', { email: email ? 'provided' : 'missing', password: password ? 'provided' : 'missing', rememberMe });
      
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      try {
        // Disable button and show loading state (toggle spans, don't replace innerHTML)
        if (submitBtn) {
          submitBtn.disabled = true;
          const text = submitBtn.querySelector('.btn-text');
          const loader = submitBtn.querySelector('.btn-loader');
          if (text) text.style.display = 'none';
          if (loader) loader.style.display = 'inline-flex';
        }

        // Call API login
        console.log('Calling API.login...');
        let result;
        try {
          result = await API.login(email, password);
          console.log('API.login result:', result);
        } catch (error) {
          // Handle rate limiting error specifically
          if (error.message && (error.message.includes('Too many') || error.message.includes('429'))) {
            showToast('Too many login attempts. Please wait 15 minutes before trying again.', 'error');
            // Re-enable button
            if (submitBtn) {
              submitBtn.disabled = false;
              const text = submitBtn.querySelector('.btn-text');
              const loader = submitBtn.querySelector('.btn-loader');
              if (text) text.style.display = '';
              if (loader) loader.style.display = 'none';
            }
            return;
          }
          throw error; // Re-throw other errors
        }
        
        if (!result || !result.user) {
          throw new Error('Invalid response from server');
        }
        
        // Store user in AppState
        if (typeof AppState !== 'undefined') {
          AppState.user = result.user;
          
          // Handle Remember Me functionality
          if (rememberMe) {
            // Remember Me checked: Save to localStorage for persistent login across sessions
            AppState.saveToStorage();
            // Clear any sessionStorage user data
            sessionStorage.removeItem('coursecity_user');
            console.log('Remember Me checked - saving to localStorage for persistent login');
          } else {
            // Remember Me NOT checked: Save to sessionStorage only (session-only login)
            // User will be logged out when browser closes
            // Save user to sessionStorage
            sessionStorage.setItem('coursecity_user', JSON.stringify(result.user));
            // Clear localStorage user
            localStorage.removeItem('coursecity_user');
            // Save other state (cart, wishlist) to localStorage (these persist regardless)
            const tempCart = AppState.cart;
            const tempWishlist = AppState.wishlist;
            const tempTheme = AppState.theme;
            localStorage.setItem('coursecity_cart', JSON.stringify(tempCart));
            localStorage.setItem('coursecity_wishlist', JSON.stringify(tempWishlist));
            localStorage.setItem('coursecity_theme', tempTheme);
            
            console.log('Remember Me NOT checked - saving to sessionStorage for session-only login');
          }
          
          // Enable all features immediately after login
          if (typeof enableAllFeatures === 'function') {
            enableAllFeatures();
          }
          
          // Update UI to show all logged-in features
          AppState.updateUI();
          
          // Comprehensive feature sync after login
          await syncAllFeaturesAfterLogin();
        }

        showToast('Login successful! Redirecting...', 'success');
        
        // Use AuthUtils for post-login redirect handling
        setTimeout(() => {
          if (typeof AuthUtils !== 'undefined' && typeof AuthUtils.handlePostLoginRedirect === 'function') {
            AuthUtils.handlePostLoginRedirect();
          } else {
            // Fallback to existing redirect logic
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('return');
            
            // Check if there's a redirect URL stored (e.g., from "View all notifications" click)
            const storedRedirectUrl = sessionStorage.getItem('auth_redirect_url') || localStorage.getItem('auth_redirect_url');
            
            // Priority: return URL from query > stored redirect URL > default
            const redirectUrl = returnUrl || storedRedirectUrl;
            
            if (redirectUrl) {
              // Clear the redirect URL before redirecting
              sessionStorage.removeItem('auth_redirect_url');
              localStorage.removeItem('auth_redirect_url');
              
              // If return URL is a full URL, use it directly
              if (returnUrl && (returnUrl.startsWith('http://') || returnUrl.startsWith('https://'))) {
                window.location.href = decodeURIComponent(returnUrl);
                return;
              }
              
              // Handle relative URLs
              window.location.href = redirectUrl;
            } else {
              // Default redirect to homepage
              window.location.href = '../pages/index.html';
            }
          }
        }, 1500);

      } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Login failed. Please try again.', 'error');
      } finally {
        // Re-enable button
        if (submitBtn) {
          submitBtn.disabled = false;
          const text = submitBtn.querySelector('.btn-text');
          const loader = submitBtn.querySelector('.btn-loader');
          if (text) text.style.display = '';
          if (loader) loader.style.display = 'none';
        }
      }
    });
  } else {
    console.warn('Login form not found on page');
  }

  // Signup Form Handler
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Signup form submitted');
      
      const name = document.getElementById('page-signup-name')?.value || document.getElementById('signup-name')?.value;
      const username = document.getElementById('page-signup-username')?.value || document.getElementById('signup-username')?.value;
      const email = document.getElementById('page-signup-email')?.value || document.getElementById('signup-email')?.value;
      const password = document.getElementById('page-signup-password')?.value || document.getElementById('signup-password')?.value;
      const confirmPassword = document.getElementById('page-signup-confirm-password')?.value || document.getElementById('signup-confirm-password')?.value;
      const submitBtn = document.getElementById('signup-submit-btn');
      
      console.log('Signup attempt:', {
        name: name ? 'provided' : 'missing',
        email: email ? 'provided' : 'missing',
        password: password ? 'provided' : 'missing',
        confirmPassword: confirmPassword ? 'provided' : 'missing'
      });
      
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        // Disable button and show loading state (toggle spans, don't replace innerHTML)
        if (submitBtn) {
          submitBtn.disabled = true;
          const text = submitBtn.querySelector('.btn-text');
          const loader = submitBtn.querySelector('.btn-loader');
          if (text) text.style.display = 'none';
          if (loader) loader.style.display = 'inline-flex';
        }

        // Generate username from email if not provided (sanitize and cap length)
        const baseFromEmail = (email.split('@')[0] || 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '');
        const suffix = Math.random().toString(36).slice(2, 8); // 6 chars
        // Ensure overall length <= 50 (DB column limit)
        const maxBaseLen = 50 - 1 - suffix.length; // for '_' + suffix
        const safeBase = (baseFromEmail.length > maxBaseLen)
          ? baseFromEmail.slice(0, maxBaseLen)
          : baseFromEmail;
        const generatedUsername = (username && username.trim()) || `${safeBase}_${suffix}`;

        // Call API register
        console.log('Calling API.register...');
        const result = await API.register({
          username: generatedUsername,
          email,
          password,
          full_name: name
        });
        console.log('API.register result:', result);
        
        if (!result || !result.success) {
          throw new Error('Registration failed. Please try again.');
        }
        
        showToast('Account created successfully! Please login.', 'success');
        
        // Redirect to login page after short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);

      } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = error?.message || 'Registration failed. Please try again.';
        
        // Check for specific error types
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 5000.';
        } else if (errorMessage.toLowerCase().includes('exists')) {
          errorMessage = 'An account with this email or username already exists.';
        } else if (errorMessage.toLowerCase().includes('validation')) {
          errorMessage = 'Please check your details and try again.';
        }
        
        showToast(errorMessage, 'error');
        
        // Re-enable button
        if (submitBtn) {
          submitBtn.disabled = false;
          const text = submitBtn.querySelector('.btn-text');
          const loader = submitBtn.querySelector('.btn-loader');
          if (text) text.style.display = '';
          if (loader) loader.style.display = 'none';
        }
      }
    });
  } else {
    console.warn('Signup form not found on page');
  }

  // Google OAuth Login
  const googleLoginBtn = document.getElementById('google-login') || document.getElementById('google-login-btn') || document.getElementById('google-signup');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.loginWithGoogle();
    });
  }

  // Facebook OAuth Login
  const facebookLoginBtn = document.getElementById('facebook-login') || document.getElementById('facebook-login-btn') || document.getElementById('facebook-signup');
  if (facebookLoginBtn) {
    facebookLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.loginWithFacebook();
    });
  }

  // Password visibility toggles
  const togglePassword = (toggleBtnId, inputId) => {
    const btn = document.getElementById(toggleBtnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = input.getAttribute('type') === 'password';
      input.setAttribute('type', isPassword ? 'text' : 'password');
      btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      // swap icon
      const icon = btn.querySelector('i');
      if (icon) {
        icon.classList.remove(isPassword ? 'fa-eye' : 'fa-eye-slash');
        icon.classList.add(isPassword ? 'fa-eye-slash' : 'fa-eye');
      }
    });
  };

  // Login page toggle
  togglePassword('toggle-login-password', 'page-login-password');
  // Signup page toggles
  togglePassword('toggle-signup-password', 'page-signup-password');
  togglePassword('toggle-confirm-password', 'page-signup-confirm-password');
});

// Toast notification helper
function showToast(message, type = 'info') {
  // Use Toast object if available (from script.js)
  if (typeof Toast !== 'undefined' && Toast[type]) {
    Toast[type](message);
    return;
  }

  // Fallback to basic alert if Toast not available
  console.log(`[${type.toUpperCase()}]`, message);
  
  // Try to create a simple toast
  const toastContainer = document.getElementById('toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

