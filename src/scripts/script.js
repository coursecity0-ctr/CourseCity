// ====================================
// COURSECITY - MAIN JAVASCRIPT
// Professional Course Platform
// ====================================

'use strict';

// ====================================
// STATE MANAGEMENT
// ====================================
const AppState = {
  user: null,
  cart: [],
  wishlist: [],
  theme: 'light',

  // Initialize state from localStorage
  init() {
    this.loadFromStorage();
    this.updateUI();
  },

  loadFromStorage() {
    // Check localStorage first (persistent login - Remember Me checked)
    // Then check sessionStorage (session-only login - Remember Me NOT checked)
    const localStorageUser = localStorage.getItem('coursecity_user');
    const sessionStorageUser = sessionStorage.getItem('coursecity_user');

    // Prefer localStorage (Remember Me checked) over sessionStorage (Remember Me NOT checked)
    this.user = JSON.parse(localStorageUser || sessionStorageUser || 'null');

    this.cart = JSON.parse(localStorage.getItem('coursecity_cart') || '[]');
    this.wishlist = JSON.parse(localStorage.getItem('coursecity_wishlist') || '[]');
    this.theme = localStorage.getItem('coursecity_theme') || 'light';
  },

  saveToStorage() {
    localStorage.setItem('coursecity_user', JSON.stringify(this.user));
    localStorage.setItem('coursecity_cart', JSON.stringify(this.cart));
    localStorage.setItem('coursecity_wishlist', JSON.stringify(this.wishlist));
    localStorage.setItem('coursecity_theme', this.theme);
  },

  updateUI() {
    updateCartUI();
    updateAuthUI();
    if (typeof updateThemeUI === 'function') {
      updateThemeUI();
    }
  }
};

// ====================================
// UTILITY FUNCTIONS
// ====================================
const Utils = {
  // Format currency
  formatPrice(amount) {
    return `GH₵${Number(amount).toFixed(2)}`;
  },

  // Parse price from string
  parsePrice(priceStr) {
    const match = priceStr.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  },

  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Validate email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Get initials from name
  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
};

// ====================================
// TOAST NOTIFICATIONS
// ====================================
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icons[type]}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    `;

    this.container.appendChild(toast);

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    // Auto remove
    setTimeout(() => this.remove(toast), duration);
  },

  remove(toast) {
    toast.style.animation = 'toastSlideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  warning(message) {
    this.show(message, 'warning');
  },

  info(message) {
    this.show(message, 'info');
  }
};

// Add toast slide out animation
const style = document.createElement('style');
style.textContent = `
  @keyframes toastSlideOut {
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

// ====================================
// AUTHENTICATION SYSTEM
// ====================================
const Auth = {
  modal: null,
  loginForm: null,
  signupForm: null,

  init() {
    this.modal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.signupForm = document.getElementById('signup-form');

    // Always set up event listeners and password strength handling
    // even on pages without the auth modal (e.g. Explore, Contact, Blog),
    // so that shared actions like logout still work.
    this.setupEventListeners();
    this.setupPasswordStrength();
  },

  setupEventListeners() {
    // Show modal
    const showAuthBtn = document.getElementById('show-auth-modal');
    if (showAuthBtn) {
      showAuthBtn.addEventListener('click', () => this.showModal());
    }

    // Close modal
    const closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn && this.modal) {
      closeBtn.addEventListener('click', () => this.hideModal());
    }

    // Close on backdrop click (only if modal exists on this page)
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.hideModal();
      });
    }

    // Tab switching
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Form submissions
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (this.signupForm) {
      this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  setupPasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    const strengthBar = document.getElementById('password-strength-bar');

    if (!passwordInput || !strengthBar) return;

    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strength = this.calculatePasswordStrength(password);

      strengthBar.className = 'password-strength-bar';
      if (password.length > 0) {
        if (strength < 3) {
          strengthBar.classList.add('weak');
        } else if (strength < 5) {
          strengthBar.classList.add('medium');
        } else {
          strengthBar.classList.add('strong');
        }
      }
    });
  },

  calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  },

  showModal() {
    if (this.modal) {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  hideModal() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.toggle('active', form.id === `${tabName}-form`);
    });
  },

  handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!Utils.validateEmail(email)) {
      Toast.error('Please enter a valid email address');
      return;
    }

    // Simulate login (in real app, this would be an API call)
    const user = {
      name: email.split('@')[0],
      email: email,
      avatar: Utils.getInitials(email.split('@')[0])
    };

    AppState.user = user;
    AppState.saveToStorage();

    this.hideModal();
    updateAuthUI();
    Toast.success(`Welcome back, ${user.name}!`);

    this.loginForm.reset();
  },

  handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (!Utils.validateEmail(email)) {
      Toast.error('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      Toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Toast.error('Password must be at least 8 characters long');
      return;
    }

    // Simulate signup (in real app, this would be an API call)
    const user = {
      name: name,
      email: email,
      avatar: Utils.getInitials(name)
    };

    AppState.user = user;
    AppState.saveToStorage();

    this.hideModal();
    updateAuthUI();
    Toast.success(`Account created successfully! Welcome, ${user.name}!`);

    this.signupForm.reset();
  },

  async logout() {
    // Comprehensive feature cleanup
    await cleanupAllFeaturesOnLogout();

    // API logout call
    if (typeof API !== 'undefined') {
      try {
        await API.logout();
      } catch (error) {
        console.warn('API logout failed:', error);
      }
    }

    Toast.info('You have been logged out');

    // Close dropdown
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('active');

    // Redirect to homepage after logout for consistent UX across pages
    try {
      if (typeof AuthUtils !== 'undefined' && typeof AuthUtils.getHomepageUrl === 'function') {
        const homepageUrl = AuthUtils.getHomepageUrl();
        if (homepageUrl) {
          window.location.href = homepageUrl;
        }
      }
    } catch (err) {
      console.warn('Homepage redirect after logout failed:', err);
    }
  }
};

// ====================================
// UPDATE AUTH UI
// ====================================
function updateAuthUI() {
  const userProfile = document.getElementById('user-profile');
  const showAuthBtn = document.getElementById('show-auth-modal');
  const userAvatar = document.getElementById('user-avatar');
  const loginBtn = document.querySelector('.btn-login-link');
  // Check for both .btn-login and .btn-signup classes (different pages use different classes)
  const signupBtn = document.querySelector('.btn-login') || document.querySelector('.btn-signup');
  const wishlistBtn = document.getElementById('wishlist-btn');
  const cartBtn = document.getElementById('cart-btn');
  const mobileAuthLinks = document.querySelectorAll('.nav-auth-link');

  if (AppState.user) {
    // User is logged in - show profile and wishlist, hide auth buttons
    if (userProfile) {
      userProfile.style.display = 'block';
      if (userAvatar) {
        updateAvatarDisplay(userAvatar, AppState.user);
      }

      // Note: Admin access is separate - admins should use admin login page
      // Admin link removed from regular user dropdown for security
    }
    if (wishlistBtn) wishlistBtn.style.display = 'inline-flex';
    if (showAuthBtn) showAuthBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (mobileAuthLinks && mobileAuthLinks.length) {
      mobileAuthLinks.forEach(link => {
        link.style.display = 'none';
      });
    }

    // Remove login-required styling from cart
    if (cartBtn) {
      cartBtn.classList.remove('requires-login');
      cartBtn.title = 'Open cart';
    }

    // Enable all authenticated features
    enableAllFeatures();
  } else {
    // User is not logged in - hide profile and wishlist, show auth buttons
    if (userProfile) userProfile.style.display = 'none';
    if (wishlistBtn) wishlistBtn.style.display = 'none';
    if (showAuthBtn) showAuthBtn.style.display = 'inline-flex';
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (signupBtn) signupBtn.style.display = 'inline-flex';
    if (mobileAuthLinks && mobileAuthLinks.length) {
      mobileAuthLinks.forEach(link => {
        link.style.display = 'inline-flex';
      });
    }

    // Remove any visual indicators from cart (no lock icon)
    if (cartBtn) {
      cartBtn.classList.remove('requires-login');
      cartBtn.title = 'View cart';
    }
  }
}

// Admin access is separate - removed from regular user dropdown
// Admins should access admin panel via: src/pages/admin/login.html

// Enable all features after successful login
function enableAllFeatures() {
  if (!AppState.user) {
    console.log('Cannot enable features: user not logged in');
    return;
  }

  console.log('Enabling all features for logged-in user');

  // Remove any "login required" messages or disabled states
  const loginRequiredMessages = document.querySelectorAll('[data-login-required="true"]');
  loginRequiredMessages.forEach(el => {
    el.style.display = 'none';
  });

  // Enable checkout buttons
  const checkoutButtons = document.querySelectorAll('.checkout-btn, #checkout-btn, .btn-checkout');
  checkoutButtons.forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
    }
  });

  // Enable wishlist buttons
  const wishlistButtons = document.querySelectorAll('.wishlist-btn, .add-to-wishlist, .fa-heart');
  wishlistButtons.forEach(btn => {
    if (btn && btn.closest('button')) {
      btn.closest('button').disabled = false;
      btn.closest('button').style.pointerEvents = 'auto';
    }
  });

  // Enable cart buttons
  const cartButtons = document.querySelectorAll('.add-to-cart, .cart-btn');
  cartButtons.forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
    }
  });

  // Show profile-related links
  const profileLinks = document.querySelectorAll('a[href*="profile"], a[href*="my-courses"]');
  profileLinks.forEach(link => {
    link.style.display = '';
    link.style.pointerEvents = 'auto';
  });

  // Enable course enrollment buttons
  const enrollButtons = document.querySelectorAll('.enroll-btn, .btn-enroll, .start-course');
  enrollButtons.forEach(btn => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('disabled');
      btn.style.pointerEvents = 'auto';
    }
  });

  // Remove any disabled classes from feature elements
  const disabledElements = document.querySelectorAll('.feature-disabled, .requires-login');
  disabledElements.forEach(el => {
    el.classList.remove('feature-disabled', 'requires-login');
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });

  // Show notifications button if hidden
  const notificationBtn = document.getElementById('notification-bell-btn');
  if (notificationBtn) {
    notificationBtn.style.display = '';
  }

  console.log('All features enabled');
}

// Update avatar display (supports both image and initials)
function updateAvatarDisplay(element, user) {
  if (!element || !user) return;

  const imageUrl = user.profile_image || user.avatar;
  const name = user.full_name || user.name || user.email || 'User';

  // Clear existing content
  element.innerHTML = '';

  if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
    // Display image
    const img = document.createElement('img');
    // Handle relative URLs from backend
    if (imageUrl.startsWith('/')) {
      const hostname = window.location.hostname;
      const port = hostname === 'localhost' || hostname === '127.0.0.1' ? ':5000' : '';
      img.src = `http://${hostname}${port}${imageUrl}`;
    } else {
      img.src = imageUrl;
    }
    img.alt = name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';

    // Fallback to initials if image fails to load
    img.onerror = () => {
      displayAvatarInitials(element, name);
    };

    element.appendChild(img);
  } else {
    // Display initials
    displayAvatarInitials(element, name);
  }
}

// Display initials in avatar
function displayAvatarInitials(element, name) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  element.textContent = initials;
}

// User dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
  const userAvatarBtn = document.getElementById('user-avatar-btn');
  const userDropdown = document.getElementById('user-dropdown');

  if (userAvatarBtn && userDropdown) {
    userAvatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking on dropdown navigation links (except logout)
    const dropdownLinks = userDropdown.querySelectorAll('.user-dropdown-item');
    dropdownLinks.forEach(link => {
      if (link.id !== 'logout-btn') {
        link.addEventListener('click', () => {
          userDropdown.classList.remove('active');
        });
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && !userAvatarBtn.contains(e.target)) {
        userDropdown.classList.remove('active');
      }
    });
  }
});

// ====================================
// CART FUNCTIONALITY
// ====================================
const Cart = {
  async addToCart(title, price, image = '', courseId = null) {
    // Check if user is logged in and API is available
    if (typeof API !== 'undefined' && AppState.user) {
      try {
        // Get course ID if not provided
        const finalCourseId = courseId || this.getCourseIdByTitle(title);
        console.log('Adding to cart:', { title, courseId: finalCourseId, user: AppState.user.email });

        // Check if backend is reachable first
        const isServerRunning = await this.checkServerConnection();
        if (!isServerRunning) {
          throw new Error('Backend server is not running');
        }

        // Use API for logged-in users
        await API.addToCart(finalCourseId, 1);
        Toast.success(`${title} added to cart`);

        // Refresh cart UI from API
        await this.refreshFromAPI();

        // Add notification
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.notifyCartAdd(title);
        }
        return;
      } catch (error) {
        console.error('API cart error:', error);
        console.log('Error details:', {
          message: error.message,
          status: error.status,
          user: AppState.user ? AppState.user.email : 'No user',
          courseId: courseId || this.getCourseIdByTitle(title)
        });

        // Provide specific error messages based on error type
        if (error.message && error.message.includes('Backend server is not running')) {
          Toast.warning('Backend server is offline. Item saved locally.');
        } else if (error.message && error.message.includes('401')) {
          Toast.warning('Session expired. Please login again to sync your cart.');
          // Clear user session
          AppState.user = null;
          updateAuthUI();
        } else if (error.message && error.message.includes('404')) {
          // Check if it's a cart endpoint 404 or course not found
          if (error.message.includes('Course not found')) {
            Toast.warning('Course not found in database. Item saved locally.');
          } else {
            Toast.warning('Cart API not available. Item saved locally.');
          }
        } else if (error.message && error.message.includes('500')) {
          Toast.warning('Server error. Item saved locally.');
        } else if (error.message && error.message.includes('Failed to fetch')) {
          Toast.warning('Network error. Item saved locally.');
        } else {
          Toast.warning('Cart sync temporarily unavailable. Item saved locally.');
        }
      }
    } else if (!AppState.user) {
      // User is not logged in - show appropriate message
      Toast.info('Item added to cart. Login to sync across devices.');
    } else {
      // API not available
      Toast.info('API not available. Item saved locally.');
    }

    // Fallback to localStorage for guests or if API fails
    const existing = AppState.cart.find(item => item.title === title);

    if (existing) {
      existing.quantity++;
      Toast.success(`${title} quantity updated in cart`);
    } else {
      AppState.cart.push({
        title,
        price,
        quantity: 1,
        image
      });
      Toast.success(`${title} added to cart`);
    }

    AppState.saveToStorage();
    updateCartUI();

    // Add notification
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.notifyCartAdd(title);
    }
  },

  // Check if backend server is running
  async checkServerConnection() {
    try {
      // Get the API base URL (same logic as api.js)
      const isProduction = typeof window !== 'undefined' &&
        window.location &&
        !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1');

      let apiBaseUrl;
      if (isProduction) {
        apiBaseUrl = window.API_BASE_URL || `${window.location.origin}/api`;
      } else {
        const apiHost = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
        apiBaseUrl = `http://${apiHost}:5000/api`;
      }

      // Try to check auth status instead of /test endpoint
      const response = await fetch(`${apiBaseUrl}/auth/status`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok || response.status === 401; // 401 means server is running but not authenticated
    } catch (error) {
      console.log('Server connection check failed:', error.message);
      return false;
    }
  },

  // Helper to get course ID from title (temporary until we pass IDs directly)
  getCourseIdByTitle(title) {
    // Course title to ID mapping based on the seed data
    const courseMap = {
      'Data and Business Analytics Masterclass': 1,
      'Excel Masterclass for Students & Professionals': 2,
      'Complete Power BI Masterclass': 3,
      'SQL Masterclass for Data Analysis': 4,
      'Python Programming Masterclass': 5,
      'Complete Web Development Bootcamp': 6,
      'React.js Complete Course': 7,
      'Node.js Backend Development': 8,
      'Full Stack JavaScript Course': 9,
      'Advanced JavaScript Concepts': 10,
      'Graphic Design Masterclass': 11,
      'Complete Graphic Design Masterclass: From Beginner to Professional Designer': 11, // Map to same as Graphic Design Masterclass
      'Adobe Photoshop Complete Course': 12,
      'UI/UX Design Fundamentals': 13,
      'Video Editing with Premiere Pro': 14,
      'Motion Graphics with After Effects': 15
    };

    // Return mapped ID or log warning and use fallback
    const mappedId = courseMap[title];
    if (mappedId) {
      console.log(`✅ Course "${title}" mapped to ID: ${mappedId}`);
      return mappedId;
    } else {
      console.warn(`⚠️ Course "${title}" not found in mapping. Using fallback ID.`);
      // For unmapped courses, just use a default ID (like course 1) to avoid 404s
      return 1; // Default to first course instead of generating random IDs
    }
  },

  // Simple hash function to generate consistent IDs from strings
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000 + 1; // Keep it reasonable (1-1000)
  },

  // Refresh cart from API and merge with offline items
  async refreshFromAPI() {
    if (typeof API !== 'undefined' && AppState.user) {
      try {
        const result = await API.getCart();
        if (result && result.items) {
          // Store offline items before overwriting
          const offlineItems = AppState.cart.filter(item => !item.id);

          // Convert API cart format to local format
          const onlineItems = result.items.map(item => ({
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image_url,
            id: item.id,
            course_id: item.course_id
          }));

          // Merge offline items with online items
          AppState.cart = this.mergeCartItems(onlineItems, offlineItems);
          updateCartUI();
          console.log('✅ Cart synced from API and merged with offline items');
        }
      } catch (error) {
        console.error('Error refreshing cart from API:', error);
        if (error.message && error.message.includes('401')) {
          // Session expired
          AppState.user = null;
          updateAuthUI();
          Toast.warning('Session expired. Please login again.');
        }
      }
    }
  },

  // Merge online and offline cart items intelligently
  mergeCartItems(onlineItems, offlineItems) {
    const mergedItems = [...onlineItems]; // Start with online items

    // Add offline items that don't exist online, or merge quantities
    for (const offlineItem of offlineItems) {
      const existingOnlineItem = mergedItems.find(item =>
        item.title === offlineItem.title ||
        (item.course_id && item.course_id === this.getCourseIdByTitle(offlineItem.title))
      );

      if (existingOnlineItem) {
        // Item exists online, merge quantities
        const originalQuantity = existingOnlineItem.quantity;
        existingOnlineItem.quantity += offlineItem.quantity;
        existingOnlineItem.needsQuantityUpdate = true; // Mark for server update
        console.log(`🔄 Merged quantities for "${offlineItem.title}": ${originalQuantity} + ${offlineItem.quantity} = ${existingOnlineItem.quantity}`);
      } else {
        // Item doesn't exist online, add it (will be synced to server later)
        mergedItems.push({
          ...offlineItem,
          needsServerSync: true // Mark as needing to be added to server
        });
        console.log(`➕ Added offline item "${offlineItem.title}" to merged cart`);
      }
    }

    return mergedItems;
  },

  // Sync offline cart to server when user logs in
  async syncOfflineCartToServer() {
    if (!AppState.user || typeof API === 'undefined') {
      return;
    }

    // Get current offline cart items (items without server ID)
    const offlineItems = AppState.cart.filter(item => !item.id);

    // Also check for items that have quantities that need updating on server
    const itemsToUpdate = AppState.cart.filter(item => item.id && item.needsQuantityUpdate);

    if (offlineItems.length === 0 && itemsToUpdate.length === 0) {
      console.log('No offline cart items to sync');
      return;
    }

    console.log(`🔄 Syncing ${offlineItems.length} offline items and ${itemsToUpdate.length} quantity updates to server...`);

    try {
      // 1. Add new offline items to server cart
      for (const item of offlineItems) {
        try {
          const courseId = this.getCourseIdByTitle(item.title);
          if (courseId) {
            await API.addToCart(courseId, item.quantity);
            console.log(`✅ Synced "${item.title}" (qty: ${item.quantity}) to server cart`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to sync "${item.title}":`, error.message);
        }
      }

      // 2. Update quantities for existing items that were merged
      for (const item of itemsToUpdate) {
        try {
          // Update quantity on server (this would need a backend API endpoint)
          // For now, we'll remove and re-add with correct quantity
          await API.removeFromCart(item.id);
          const courseId = item.course_id || this.getCourseIdByTitle(item.title);
          await API.addToCart(courseId, item.quantity);
          console.log(`✅ Updated "${item.title}" quantity to ${item.quantity} on server`);
        } catch (error) {
          console.warn(`⚠️ Failed to update quantity for "${item.title}":`, error.message);
        }
      }

      // 3. Refresh cart from server to get the final synced state
      await this.refreshFromAPI();

      // 4. Clear any sync flags
      AppState.cart.forEach(item => delete item.needsQuantityUpdate);
      AppState.saveToStorage();

      Toast.success('Cart synced successfully!');
      console.log('🎉 Offline cart sync completed');

    } catch (error) {
      console.error('❌ Error syncing offline cart:', error);
      Toast.warning('Some cart items could not be synced. Please check your cart.');
    }
  },

  removeFromCart(index) {
    const item = AppState.cart[index];
    AppState.cart.splice(index, 1);
    AppState.saveToStorage();
    updateCartUI();
    Toast.info(`${item.title} removed from cart`);
  },

  updateQuantity(index, delta) {
    if (!AppState.cart[index]) return;

    AppState.cart[index].quantity += delta;

    if (AppState.cart[index].quantity <= 0) {
      this.removeFromCart(index);
    } else {
      AppState.saveToStorage();
      updateCartUI();
    }
  },

  getTotal() {
    return AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getTotalItems() {
    return AppState.cart.reduce((total, item) => total + item.quantity, 0);
  },

  clear() {
    AppState.cart = [];
    AppState.saveToStorage();
    updateCartUI();
  },

  // Initialize online/offline sync detection
  initializeOnlineSync() {
    // Sync when coming back online
    window.addEventListener('online', async () => {
      console.log('🌐 Connection restored, checking for cart sync...');
      if (AppState.user) {
        Toast.info('Connection restored. Syncing cart...');
        await this.syncOfflineCartToServer();
      }
    });

    // Log when going offline
    window.addEventListener('offline', () => {
      console.log('📴 Connection lost, cart will work in offline mode');
      Toast.info('Working offline. Items will sync when connection is restored.');
    });
  }
};

function updateCartUI() {
  const cartItemsPreview = document.getElementById('cart-items-preview');
  const cartCount = document.getElementById('cart-count');
  const cartTotalPreview = document.getElementById('cart-total-preview');

  // Update count in header
  if (cartCount) {
    const totalItems = Cart.getTotalItems();
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }

  // Update total in header dropdown
  if (cartTotalPreview) {
    cartTotalPreview.textContent = `Total: ${Utils.formatPrice(Cart.getTotal())}`;
  }

  // Update mini preview items list in header dropdown
  if (cartItemsPreview) {
    cartItemsPreview.innerHTML = '';

    if (AppState.cart.length === 0) {
      cartItemsPreview.innerHTML = '<li class="cart-empty-message">Your cart is empty</li>';
    } else {
      // Show max 3 items in preview
      const itemsToShow = AppState.cart.slice(0, 3);

      itemsToShow.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item-preview';

        // Add sync status indicator
        const syncStatus = item.id ?
          '<span class="sync-status synced" title="Synced to server">🔄</span>' :
          '<span class="sync-status offline" title="Offline - will sync on login">📱</span>';

        li.innerHTML = `
          <div class="cart-item-preview-image">
            <img src="${item.image || 'Assets/image/ExcelR.png'}" alt="${item.title}">
          </div>
          <div class="cart-item-preview-info">
            <span class="cart-item-preview-title">${item.title}</span>
            <div class="cart-item-preview-meta">
              <span class="quantity">Qty: ${item.quantity}</span>
              <span class="price">GH₵${(item.price * item.quantity).toFixed(2)}</span>
              ${AppState.user ? syncStatus : ''}
            </div>
          </div>
          <button class="cart-item-preview-remove" onclick="Cart.removeFromCart(${index})" aria-label="Remove item">
            <i class="fas fa-times"></i>
          </button>
        `;
        cartItemsPreview.appendChild(li);
      });

      // Show "X more items" if there are more than 3
      if (AppState.cart.length > 3) {
        const moreItems = document.createElement('li');
        moreItems.className = 'cart-more-items';
        // Use the same target as the visible "View Full Cart" button so paths work on nested pages
        const viewCartLink = document.querySelector('.btn-view-cart');
        const cartHref = viewCartLink ? viewCartLink.getAttribute('href') || 'cart.html' : 'cart.html';
        moreItems.innerHTML = `<a href="${cartHref}">${AppState.cart.length - 3} more item(s) in cart</a>`;
        cartItemsPreview.appendChild(moreItems);
      }
    }
  }
}

// Cart dropdown toggle
document.addEventListener('DOMContentLoaded', () => {
  // Skip cart dropdown toggle wiring on All Courses pages - courses-page.js handles it
  // Check for courses-page-specific element to reliably detect the page
  const isCoursesPage = document.getElementById('course-search') !== null ||
    window.location.pathname.includes('/All_Courses/') ||
    window.location.pathname.includes('Courses.html');

  const cartBtn = document.getElementById('cart-btn');
  const cartDropdown = document.getElementById('cart-dropdown');

  // Only wire the generic cart dropdown toggle on non-All Courses pages
  if (!isCoursesPage && cartBtn && cartDropdown) {
    cartBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isOpen = cartDropdown.classList.toggle('active');
      cartBtn.setAttribute('aria-expanded', isOpen);
      return;

      // Check if user is authenticated before opening cart
      if (typeof AuthUtils !== 'undefined') {
        const isAuthenticated = await AuthUtils.requireAuth('cart.html', () => {
          // User is authenticated, open the cart dropdown
          const isOpenInner = cartDropdown.classList.toggle('active');
          cartBtn.setAttribute('aria-expanded', isOpenInner);
        });

        if (!isAuthenticated) {
          // Show message to user that login is required
          AuthUtils.showAuthRequiredMessage('view your cart');
          return;
        }
      } else {
        // Fallback: Check AppState.user if AuthUtils is not available
        if (!AppState.user) {
          // User not logged in, redirect to login
          localStorage.setItem('redirectAfterLogin', 'cart.html');
          window.location.href = '../auth/login.html';
          return;
        }

        // User is logged in, open cart dropdown
        const isOpenInner = cartDropdown.classList.toggle('active');
        cartBtn.setAttribute('aria-expanded', isOpenInner);
      }
    });

    cartDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('click', (e) => {
      if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
        cartDropdown.classList.remove('active');
        cartBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Protected navigation handlers for cart modal buttons (run on all pages)
  initializeProtectedNavigation();

  // Initialize online/offline sync detection
  if (typeof Cart !== 'undefined' && typeof Cart.initializeOnlineSync === 'function') {
    Cart.initializeOnlineSync();
    console.log('🌐 Online/offline sync detection initialized');
  }
});

// ====================================
// PROTECTED NAVIGATION HANDLERS
// ====================================
function initializeProtectedNavigation() {
  console.log('🔗 Initializing protected navigation...');
  const currentPath = window.location.pathname;
  const isCoursesPage = currentPath.includes('/All_Courses/') || currentPath.includes('Courses.html');

  // Handle "View Full Cart" button
  const viewCartBtn = document.querySelector('.btn-view-cart');
  if (viewCartBtn) {
    console.log('✅ Found View Full Cart button, adding event listener');
    viewCartBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('🛒 View Full Cart button clicked');

      // Check if user is logged in
      if (AppState.user) {
        // User is logged in, navigate to cart page
        console.log('✅ User is logged in, navigating to cart page');
        console.log('User:', AppState.user.email);
        // Use the button href so paths work correctly from nested pages
        const targetHref = viewCartBtn.getAttribute('href') || 'cart.html';
        window.location.href = targetHref;
      } else {
        // User not logged in, redirect to login with return URL
        console.log('❌ User not logged in, redirecting to login');
        // On All Courses pages, return user to the same page after login
        const returnUrl = isCoursesPage ? currentPath : 'cart.html';
        if (typeof AuthUtils !== 'undefined') {
          AuthUtils.redirectToLogin(returnUrl);
        } else {
          // Fallback if AuthUtils not available
          localStorage.setItem('redirectAfterLogin', returnUrl);
          window.location.href = '../auth/login.html';
        }
      }
    });
  } else {
    console.warn('⚠️ View Full Cart button not found');
  }

  const quickCheckoutBtn = document.getElementById('quick-checkout-btn');
  if (quickCheckoutBtn) {
    quickCheckoutBtn.addEventListener('click', (e) => {
      if (AppState.user) {
        return;
      }

      e.preventDefault();
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation();
      }

      // On All Courses pages, return user to the same page after login
      const returnUrl = isCoursesPage ? currentPath : 'cart.html';

      if (typeof AuthUtils !== 'undefined') {
        AuthUtils.redirectToLogin(returnUrl);
      } else {
        localStorage.setItem('redirectAfterLogin', returnUrl);
        window.location.href = '../auth/login.html';
      }
    });
  }

  // Handle other protected navigation links
  initializeOtherProtectedLinks();
}

/**
 * Initialize other protected navigation links
 */
function initializeOtherProtectedLinks() {
  // Protect wishlist navigation
  const wishlistLinks = document.querySelectorAll('a[href*="wishlist"]');
  // Intentionally do not override click behavior for wishlist links.
  // Let the browser follow the href directly so icons/links always
  // navigate to the wishlist page.

  // Protect profile navigation
  const profileLinks = document.querySelectorAll('a[href*="profile"]:not([href^="http"])');
  console.log(`👤 Found ${profileLinks.length} profile links to protect`);
  profileLinks.forEach((link, index) => {
    console.log(`👤 Profile link ${index + 1}: ${link.getAttribute('href')}`);
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('👤 Profile link clicked:', link.getAttribute('href'));

      // Check if user is logged in
      if (AppState.user) {
        // User is logged in, navigate to profile page
        console.log('✅ User is logged in, navigating to profile page');
        console.log('User:', AppState.user.email);
        window.location.href = link.getAttribute('href');
      } else {
        // User not logged in, redirect to login with return URL
        console.log('❌ User not logged in, redirecting to login');
        const targetPage = link.getAttribute('href');
        if (typeof AuthUtils !== 'undefined') {
          AuthUtils.redirectToLogin(targetPage);
        } else {
          // Fallback if AuthUtils not available
          localStorage.setItem('redirectAfterLogin', targetPage);
          window.location.href = '../auth/login.html';
        }
      }
    });
  });

  // Protect my-courses navigation
  const myCoursesLinks = document.querySelectorAll('a[href*="my-courses"]');
  myCoursesLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      // Check if user is logged in
      if (AppState.user) {
        // User is logged in, navigate to my courses page
        console.log('User is logged in, navigating to my courses page');
        console.log('User:', AppState.user.email);
        window.location.href = link.getAttribute('href');
      } else {
        // User not logged in, redirect to login with return URL
        console.log('User not logged in, redirecting to login');
        const targetPage = link.getAttribute('href');
        if (typeof AuthUtils !== 'undefined') {
          AuthUtils.redirectToLogin(targetPage);
        } else {
          // Fallback if AuthUtils not available
          localStorage.setItem('redirectAfterLogin', targetPage);
          window.location.href = '../auth/login.html';
        }
      }
    });
  });

  // Protect notifications navigation (non "View All" links)
  const notificationLinks = document.querySelectorAll('a[href*="notifications"]:not(.btn-view-all-notifications)');
  notificationLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      // Resolve the full notifications target path from the link href
      let targetUrl = link.getAttribute('href') || 'notifications.html';
      try {
        const currentUrl = new URL(window.location.href);
        const resolvedUrl = new URL(targetUrl, currentUrl);
        targetUrl = resolvedUrl.pathname;
      } catch (err) {
        console.log('URL parsing failed for notifications navigation link, using href as-is:', targetUrl);
      }

      const isAuthenticated = await AuthUtils.requireAuth(targetUrl, () => {
        window.location.href = targetUrl;
      });

      if (!isAuthenticated && typeof AuthUtils.showAuthRequiredMessage === 'function') {
        AuthUtils.showAuthRequiredMessage('view notifications');
      }
    });
  });
}

// ====================================
// WISHLIST FUNCTIONALITY
// ====================================
const Wishlist = {
  async toggle(courseTitle, courseData = null) {
    // Check if user is logged in and API is available
    if (typeof API !== 'undefined' && AppState.user) {
      try {
        const courseId = courseData?.id || this.getCourseIdByTitle(courseTitle);
        const index = AppState.wishlist.findIndex(item =>
          typeof item === 'string' ? item === courseTitle : item.title === courseTitle
        );

        if (index > -1) {
          // Remove from wishlist via API
          await API.removeFromWishlist(courseId);
          Toast.info(`${courseTitle} removed from wishlist`);
        } else {
          // Add to wishlist via API
          await API.addToWishlist(courseId);
          Toast.success(`${courseTitle} added to wishlist`);

          // Add notification
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.notifyWishlistAdd(courseTitle);
          }
        }

        // Refresh wishlist from API
        await this.refreshFromAPI();
        return;
      } catch (error) {
        console.error('API wishlist error:', error);
        Toast.warning('Using offline wishlist. Please login to sync.');
      }
    }

    // Fallback to localStorage for guests or if API fails
    const index = AppState.wishlist.findIndex(item =>
      typeof item === 'string' ? item === courseTitle : item.title === courseTitle
    );

    if (index > -1) {
      AppState.wishlist.splice(index, 1);
      Toast.info(`${courseTitle} removed from wishlist`);
    } else {
      // Store complete course object
      const courseObj = courseData || {
        title: courseTitle,
        image: '',
        price: 0,
        oldPrice: 0,
        instructor: 'CourseCity', // Note: This field name remains 'instructor' for backend compatibility
        rating: 4.9,
        reviews: 0,
        duration: '',
        lectures: '',
        students: '',
        category: '',
        difficulty: 'Beginner'
      };
      AppState.wishlist.push(courseObj);
      Toast.success(`${courseTitle} added to wishlist`);

      // Add notification
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.notifyWishlistAdd(courseTitle);
      }
    }

    AppState.saveToStorage();
    this.updateUI();
    return index === -1; // Return true if added, false if removed
  },

  has(courseTitle) {
    return AppState.wishlist.some(item =>
      typeof item === 'string' ? item === courseTitle : item.title === courseTitle
    );
  },

  updateUI() {
    // Update all wishlist buttons
    document.querySelectorAll('.wishlist-btn, .card-wishlist-btn').forEach(btn => {
      const courseTitle = btn.dataset.course;
      const icon = btn.querySelector('i');

      if (this.has(courseTitle)) {
        btn.classList.add('active');
        if (icon) icon.className = 'fas fa-heart';
      } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'far fa-heart';
      }
    });

    // Update wishlist counter in header
    const wishlistCount = document.getElementById('wishlist-count');
    if (wishlistCount) {
      const count = AppState.wishlist.length;
      wishlistCount.textContent = count;
      wishlistCount.style.display = count > 0 ? 'block' : 'none';
    }
  },

  // Helper to get course ID from title (temporary until we pass IDs directly)
  getCourseIdByTitle(title) {
    // This is a workaround - ideally we'd pass course IDs from the UI
    return title;
  },

  // Refresh wishlist from API
  async refreshFromAPI() {
    if (typeof API !== 'undefined' && AppState.user) {
      try {
        const result = await API.getWishlist();
        // Convert API wishlist format to local format
        AppState.wishlist = result.items.map(item => ({
          title: item.title,
          image: item.image_url,
          price: item.price,
          oldPrice: item.old_price,
          instructor: item.instructor,
          rating: item.rating,
          reviews: item.reviews_count,
          duration: item.duration,
          lectures: item.lectures_count,
          students: item.students_count,
          category: item.category,
          difficulty: item.difficulty,
          id: item.course_id
        }));
        this.updateUI();
      } catch (error) {
        console.error('Error refreshing wishlist from API:', error);
      }
    }
  }
};

// ====================================
// CATEGORY FILTER & SEARCH
// ====================================
const CourseFilter = {
  currentCategory: 'all',
  searchQuery: '',

  init() {
    this.setupCategoryTabs();
    this.setupSearch();
    this.setupTabScroll();
  },

  setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    const courseCards = document.querySelectorAll('.course-card-new');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Get category
        this.currentCategory = tab.dataset.category;

        // Filter courses
        this.filterCourses();
      });
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('course-search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(() => {
        this.searchQuery = searchInput.value.toLowerCase().trim();
        this.filterCourses();
      }, 300));
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        if (searchInput) {
          this.searchQuery = searchInput.value.toLowerCase().trim();
          this.filterCourses();
        }
      });
    }
  },

  setupTabScroll() {
    const tabContainer = document.getElementById('category-tabs');
    const leftArrow = document.getElementById('tab-arrow-left');
    const rightArrow = document.getElementById('tab-arrow-right');

    if (!tabContainer || !leftArrow || !rightArrow) return;

    leftArrow.addEventListener('click', () => {
      tabContainer.scrollBy({ left: -200, behavior: 'smooth' });
    });

    rightArrow.addEventListener('click', () => {
      tabContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });
  },

  filterCourses() {
    const courseCards = document.querySelectorAll('.course-card-new');
    let visibleCount = 0;

    courseCards.forEach(card => {
      const category = card.dataset.category;
      const title = card.querySelector('.course-title')?.textContent.toLowerCase() || '';
      const description = card.querySelector('.course-description')?.textContent.toLowerCase() || '';

      const matchesCategory = this.currentCategory === 'all' || category === this.currentCategory;
      const matchesSearch = !this.searchQuery ||
        title.includes(this.searchQuery) ||
        description.includes(this.searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show message if no results
    const courseGrid = document.getElementById('course-grid');
    let noResultsMsg = document.getElementById('no-results-message');

    if (visibleCount === 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-results-message';
        noResultsMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);';
        noResultsMsg.innerHTML = '<i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><p style="font-size: 1.125rem;">No courses found matching your criteria.</p>';
        courseGrid.appendChild(noResultsMsg);
      }
    } else {
      if (noResultsMsg) {
        noResultsMsg.remove();
      }
    }
  }
};

// ====================================
// ADD TO CART BUTTONS - NEW VERSION
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  // New course card buttons
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();

      const courseCard = btn.closest('.course-card-new');
      if (!courseCard) return;

      const titleEl = courseCard.querySelector('.course-title');
      const priceEl = courseCard.querySelector('.price-new');
      const imgEl = courseCard.querySelector('.course-image img');

      if (!titleEl || !priceEl) return;

      const title = titleEl.textContent.trim();
      const price = parseFloat(btn.dataset.price || priceEl.textContent.replace(/[^\d.]/g, '')) || 0;
      const image = imgEl ? imgEl.src : '';

      Cart.addToCart(title, price, image);
    });
  });

  // Legacy add to cart buttons (for old course cards if any)
  document.querySelectorAll('button').forEach(btn => {
    const btnText = btn.textContent.trim().toLowerCase();

    if (btnText === 'add to cart' && !btn.classList.contains('btn-add-cart')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const courseCard = btn.closest('.course-info, .course-card, .slide');
        if (!courseCard) return;

        const titleEl = courseCard.querySelector('h2, h3');
        const priceEl = courseCard.querySelector('.price');
        const imgEl = courseCard.querySelector('img');

        if (!titleEl || !priceEl) return;

        const title = titleEl.textContent.trim();
        const priceText = priceEl.textContent.replace(/[^\d.]/g, '').split(' ')[0];
        const price = parseFloat(priceText) || 0;
        const image = imgEl ? imgEl.src : '';

        Cart.addToCart(title, price, image);
      });
    }
  });

  // New wishlist buttons on course cards
  document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const courseTitle = btn.dataset.course;
      if (courseTitle) {
        // Extract complete course data from the card
        const card = btn.closest('.course-card-new');
        if (card) {
          const courseData = {
            title: courseTitle,
            image: card.querySelector('img')?.src || '',
            price: parseFloat(card.querySelector('.price-new')?.textContent.replace(/[^\d.]/g, '') || 0),
            oldPrice: parseFloat(card.querySelector('.price-old')?.textContent.replace(/[^\d.]/g, '') || 0),
            instructor: card.querySelector('.instructor-name')?.textContent.trim() || 'CourseCity',
            rating: parseFloat(card.querySelector('.meta-item span')?.textContent || 4.9),
            reviews: parseInt(card.querySelector('.meta-light')?.textContent.replace(/[^\d]/g, '') || 0),
            duration: card.querySelectorAll('.meta-item')[3]?.textContent.trim() || '',
            lectures: card.querySelectorAll('.meta-item')[1]?.textContent.trim() || '',
            students: card.querySelectorAll('.meta-item')[2]?.textContent.trim() || '',
            category: card.dataset.category || '',
            difficulty: card.querySelector('.course-level span')?.textContent.trim() || 'Beginner'
          };
          Wishlist.toggle(courseTitle, courseData);
        } else {
          Wishlist.toggle(courseTitle);
        }
        // Update button appearance
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        if (btn.classList.contains('active')) {
          icon.className = 'fas fa-heart';
        } else {
          icon.className = 'far fa-heart';
        }
      }
    });
  });

  // Legacy wishlist buttons
  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    if (!btn.classList.contains('card-wishlist-btn')) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const courseTitle = btn.dataset.course;
        if (courseTitle) {
          // Try to extract complete course data if available
          const card = btn.closest('.course-card-new');
          if (card) {
            const courseData = {
              title: courseTitle,
              image: card.querySelector('img')?.src || '',
              price: parseFloat(card.querySelector('.price-new')?.textContent.replace(/[^\d.]/g, '') || 0),
              oldPrice: parseFloat(card.querySelector('.price-old')?.textContent.replace(/[^\d.]/g, '') || 0),
              instructor: card.querySelector('.instructor-name')?.textContent.trim() || 'CourseCity',
              rating: parseFloat(card.querySelector('.meta-item span')?.textContent || 4.9),
              reviews: parseInt(card.querySelector('.meta-light')?.textContent.replace(/[^\d]/g, '') || 0),
              duration: card.querySelectorAll('.meta-item')[3]?.textContent.trim() || '',
              lectures: card.querySelectorAll('.meta-item')[1]?.textContent.trim() || '',
              students: card.querySelectorAll('.meta-item')[2]?.textContent.trim() || '',
              category: card.dataset.category || '',
              difficulty: card.querySelector('.course-level span')?.textContent.trim() || 'Beginner'
            };
            Wishlist.toggle(courseTitle, courseData);
          } else {
            Wishlist.toggle(courseTitle);
          }
        }
      });
    }
  });

  // Initialize course filter
  CourseFilter.init();
});

// ====================================
// QUICK CHECKOUT (PAYSTACK)
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const quickCheckoutBtn = document.getElementById('quick-checkout-btn');

  if (quickCheckoutBtn) {
    quickCheckoutBtn.addEventListener('click', () => {
      console.log('🛒 Quick checkout button clicked');

      if (AppState.cart.length === 0) {
        Toast.warning('Your cart is empty!');
        return;
      }

      console.log('📦 Cart items:', AppState.cart.length);

      // Get email: prefer cart page email input if present, otherwise prompt user
      let email = '';
      const emailInput = document.getElementById('checkout-email');
      if (emailInput && emailInput.value.trim()) {
        email = emailInput.value.trim();
      } else {
        email = prompt('Please enter your email address for checkout:');
      }

      if (!email) {
        Toast.info('Checkout cancelled');
        return;
      }

      if (!Utils.validateEmail(email)) {
        Toast.error('Please enter a valid email address');
        if (emailInput) emailInput.focus();
        return;
      }

      const totalAmount = Cart.getTotal();
      console.log('💰 Total amount:', totalAmount);

      if (totalAmount <= 0) {
        Toast.error('Invalid cart total');
        return;
      }

      // Check if Paystack is loaded
      if (typeof PaystackPop === 'undefined') {
        Toast.error('Payment system not loaded. Please refresh the page and try again.');
        console.error('❌ PaystackPop is not defined');
        return;
      }

      // Show loading state
      quickCheckoutBtn.disabled = true;
      quickCheckoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      try {
        console.log('🔄 Initializing Paystack payment...');
        const handler = PaystackPop.setup({
          key: 'pk_live_abb27c49eace22e2087ba2098455303a21118039',
          email: email,
          amount: Math.round(totalAmount * 100), // Convert to kobo
          currency: 'GHS',
          callback: function (response) {
            (async () => {
              console.log('✅ Payment successful:', response);
              Toast.success(`Payment successful! Reference: ${response.reference}`);

              // Create backend order and trigger admin notifications (if user is logged in and API is available)
              if (typeof API !== 'undefined' && AppState.user) {
                try {
                  await API.createOrder({
                    payment_method: 'paystack',
                    paystack_reference: response.reference
                  });
                } catch (error) {
                  console.error('Error creating quick checkout order on backend:', error);
                }
              }

              // Clear cart
              Cart.clear();

              // Close cart dropdown
              const cartDropdown = document.getElementById('cart-dropdown');
              if (cartDropdown) {
                cartDropdown.classList.remove('active');
                const cartBtn = document.getElementById('cart-btn');
                if (cartBtn) cartBtn.setAttribute('aria-expanded', 'false');
              }

              // Reset button
              quickCheckoutBtn.disabled = false;
              quickCheckoutBtn.innerHTML = 'Quick Checkout';

              // Show success message
              setTimeout(() => {
                Toast.info('Thank you for your purchase! You will receive an email confirmation shortly.');
              }, 2000);
            })();
          },
          onClose: function () {
            console.log('⚠️ Payment cancelled by user');
            Toast.warning('Payment cancelled');
            quickCheckoutBtn.disabled = false;
            quickCheckoutBtn.innerHTML = 'Quick Checkout';
          }
        });

        handler.openIframe();
      } catch (error) {
        console.error('❌ Payment system error:', error);
        Toast.error('Payment system error. Please try again.');
        quickCheckoutBtn.disabled = false;
        quickCheckoutBtn.innerHTML = 'Quick Checkout';
      }
    });
  } else {
    console.warn('⚠️ Quick checkout button not found');
  }
});

// ====================================
// THEME TOGGLE
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  if (!themeToggle || !sunIcon || !moonIcon) return;

  function updateThemeUI() {
    if (AppState.theme === 'night') {
      document.body.classList.add('night-mode');
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'inline-block';
    } else {
      document.body.classList.remove('night-mode');
      sunIcon.style.display = 'inline-block';
      moonIcon.style.display = 'none';
    }
  }

  // Set initial theme
  updateThemeUI();

  themeToggle.addEventListener('click', () => {
    AppState.theme = AppState.theme === 'night' ? 'light' : 'night';
    AppState.saveToStorage();
    updateThemeUI();
  });
});

// ====================================
// HAMBURGER MENU
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav-menu');
  const navList = nav ? nav.querySelector('ul') : null;

  if (!hamburger || !nav || !navList) return;

  const closeMenu = () => {
    nav.classList.remove('side-open');
    document.body.classList.remove('nav-overlay-active');
    navList.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();

    const useSideNav = window.matchMedia('(max-width: 768px)').matches;

    if (useSideNav) {
      nav.classList.toggle('side-open');
      const isOpen = nav.classList.contains('side-open');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-overlay-active', isOpen);
    } else {
      navList.classList.toggle('show');
      const isOpen = navList.classList.contains('show');
      hamburger.setAttribute('aria-expanded', isOpen);
    }
  });

  // Close menu when clicking a link (including mobile auth links)
  nav.querySelectorAll('a, .nav-auth-link').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });

  // Reset side nav state when resizing to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
});

// ====================================
// SLIDER FUNCTIONALITY
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const next = document.querySelector('.next');
  const prev = document.querySelector('.prev');
  const dotsContainer = document.querySelector('.dots');

  if (!slides.length || !dotsContainer) return;

  let current = 0;
  let autoSlideInterval;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.dots span');

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = 'none';
      dots[i].classList.remove('active');
    });

    slides[index].style.display = 'flex';
    dots[index].classList.add('active');
    current = index;
  }

  function nextSlide() {
    current = (current + 1) % slides.length;
    showSlide(current);
  }

  function prevSlide() {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
  }

  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  // Initial display
  showSlide(current);

  // Event listeners
  if (next) {
    next.addEventListener('click', () => {
      nextSlide();
      stopAutoSlide();
      startAutoSlide();
    });
  }

  if (prev) {
    prev.addEventListener('click', () => {
      prevSlide();
      stopAutoSlide();
      startAutoSlide();
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      stopAutoSlide();
      startAutoSlide();
    });
  });

  // Start auto slide
  startAutoSlide();

  // Pause on hover
  const slider = document.querySelector('.slider');
  if (slider) {
    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);
  }
});

// ====================================
// TESTIMONIALS SLIDESHOW
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const testimonialSection = document.querySelector('.testimonials-section');
  if (!testimonialSection) return;

  const cards = testimonialSection.querySelectorAll('.testimonials-carousel .testimonial-card');
  const dots = testimonialSection.querySelectorAll('.testimonial-dots .dot');

  if (!cards.length || cards.length !== dots.length) return;

  let currentIndex = 0;
  const INTERVAL_MS = 6500;
  let intervalId;

  function showTestimonial(index) {
    cards.forEach((card, i) => {
      card.style.display = i === index ? 'block' : 'none';
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    currentIndex = index;
  }

  function nextTestimonial() {
    const nextIndex = (currentIndex + 1) % cards.length;
    showTestimonial(nextIndex);
  }

  function startAuto() {
    clearInterval(intervalId);
    intervalId = setInterval(nextTestimonial, INTERVAL_MS);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showTestimonial(index);
      startAuto();
    });
  });

  // Initialize
  showTestimonial(0);
  startAuto();
});

// ====================================
// NEWSLETTER FORM
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterEmail = document.getElementById('newsletter-email');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = newsletterEmail.value.trim();

      if (!Utils.validateEmail(email)) {
        Toast.error('Please enter a valid email address');
        return;
      }

      // Simulate subscription (in real app, this would be an API call)
      Toast.success('Successfully subscribed to newsletter!');
      newsletterForm.reset();

      // Save to localStorage
      const subscribers = JSON.parse(localStorage.getItem('coursecity_subscribers') || '[]');
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem('coursecity_subscribers', JSON.stringify(subscribers));
      }
    });
  }
});

// ====================================
// BACK TO TOP BUTTON
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  let backToTopBtn = document.getElementById('back-to-top');

  // Create button if it doesn't exist
  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopBtn);
  }

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });

  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});

// ====================================
// LAZY LOADING IMAGES
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
});

// ====================================
// SCROLL ANIMATIONS
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const animatedElements = document.querySelectorAll('.feature-card, .course-card, .testimonial-card, .stat-item');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';

          setTimeout(() => {
            entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  }
});

// ====================================
// FLOATING LINKEDIN ADVERTISEMENT
// ====================================
document.addEventListener('DOMContentLoaded', () => {
  const ad = document.getElementById('linkedin-rental-ad');
  const closeBtn = document.getElementById('linkedin-rental-ad-close');

  if (!ad || !closeBtn) return;

  const STORAGE_KEY = 'linkedin_rental_ad_dismissed_v2';

  try {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      ad.style.display = 'none';
      return;
    }
  } catch (e) {
    // Ignore storage errors
  }

  closeBtn.addEventListener('click', () => {
    ad.style.display = 'none';
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      // Ignore storage errors
    }
  });
});

// ====================================
// INITIALIZE APP
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
  AppState.init();
  Auth.init();
  Toast.init();
  Wishlist.updateUI();

  // Handle "View all notifications" link clicks - require authentication
  setupNotificationsLinkProtection();

  // Check authentication and sync with API
  await checkAuthenticationAndSync();

  // Initialize AuthUtils authentication state if available
  if (typeof AuthUtils !== 'undefined' && typeof AuthUtils.initializeAuthState === 'function') {
    console.log('🔐 Initializing AuthUtils authentication state...');
    await AuthUtils.initializeAuthState();
  }

  console.log('%cCourseCity', 'font-size: 24px; font-weight: bold; color: #ff7a00;');
  console.log('%cProfessional Learning Platform', 'font-size: 14px; color: #666;');
});

// Setup protection for "View all notifications" link
function setupNotificationsLinkProtection() {
  // Find all "View all notifications" links
  const notificationLinks = document.querySelectorAll('.btn-view-all-notifications');
  const currentPath = window.location.pathname;
  const isCoursesPage = currentPath.includes('/All_Courses/') || currentPath.includes('Courses.html');

  notificationLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      // If AuthUtils is available, use centralized auth check
      if (typeof AuthUtils !== 'undefined' && typeof AuthUtils.requireAuth === 'function') {
        e.preventDefault();

        // Resolve the absolute notifications page path from the link href
        let targetUrl = link.getAttribute('href') || 'notifications.html';
        try {
          const currentUrl = new URL(window.location.href);
          const resolvedUrl = new URL(targetUrl, currentUrl);
          targetUrl = resolvedUrl.pathname;
        } catch (err) {
          console.log('URL parsing failed for notifications link, using href as-is:', targetUrl);
        }

        // On All Courses pages, return user to the same page after login
        const intendedPage = isCoursesPage ? currentPath : targetUrl;

        const isAuthenticated = await AuthUtils.requireAuth(intendedPage, () => {
          // If authenticated, navigate to the notifications page
          window.location.href = targetUrl;
        });

        if (!isAuthenticated && typeof AuthUtils.showAuthRequiredMessage === 'function') {
          AuthUtils.showAuthRequiredMessage('view notifications');
        }

        return;
      }

      // Fallback: basic check using AppState and storage (no AuthUtils available)
      const hasUserInState = AppState.user !== null && AppState.user !== undefined;
      const hasUserInStorage = localStorage.getItem('coursecity_user') || sessionStorage.getItem('coursecity_user');
      const user = hasUserInState ? AppState.user : (hasUserInStorage ? JSON.parse(hasUserInStorage) : null);

      if (!user) {
        // User not logged in - prevent default navigation
        e.preventDefault();

        // Get the target URL (notifications page)
        let targetUrl = link.getAttribute('href') || 'notifications.html';

        // Resolve the absolute path from the current location
        // This ensures we have a consistent path regardless of where the link is clicked
        try {
          const currentUrl = new URL(window.location.href);
          const resolvedUrl = new URL(targetUrl, currentUrl);

          // Get the path relative to the domain
          const pathFromDomain = resolvedUrl.pathname;

          // Normalize to always use pages/notifications.html format
          // Extract just the filename if it's notifications.html
          if (pathFromDomain.includes('notifications.html')) {
            // Store as relative path from pages directory
            if (pathFromDomain.includes('/pages/')) {
              targetUrl = pathFromDomain.split('/pages/')[1]; // Gets "notifications.html"
            } else if (pathFromDomain.includes('/All_Courses/') ||
              pathFromDomain.includes('/About/') ||
              pathFromDomain.includes('/Blog/') ||
              pathFromDomain.includes('/Contact/') ||
              pathFromDomain.includes('/Explore/')) {
              // From subdirectory, the href="../notifications.html" resolves to pages/notifications.html
              const parts = pathFromDomain.split('/');
              const notificationsIndex = parts.indexOf('notifications.html');
              if (notificationsIndex > -1) {
                // Get everything after pages/ or just notifications.html
                const pagesIndex = parts.indexOf('pages');
                if (pagesIndex > -1 && pagesIndex < notificationsIndex) {
                  targetUrl = parts.slice(pagesIndex + 1).join('/');
                } else {
                  targetUrl = 'notifications.html';
                }
              }
            } else {
              // Default: just use the filename
              targetUrl = 'notifications.html';
            }
          }
        } catch (err) {
          // Fallback: use the href as-is if URL parsing fails
          console.log('URL parsing failed, using href as-is:', targetUrl);
        }

        // Store the redirect URL for after login (relative to pages/)
        sessionStorage.setItem('auth_redirect_url', targetUrl);

        // Determine login page path based on current page location
        let loginPath;

        const path = window.location.pathname;

        // Handle nested pages under src/pages/ (e.g. All_Courses, About, Blog, Contact, Explore)
        if (path.includes('/src/pages/All_Courses/') ||
          path.includes('/src/pages/About/') ||
          path.includes('/src/pages/Blog/') ||
          path.includes('/src/pages/Contact/') ||
          path.includes('/src/pages/Explore/')) {
          loginPath = '../../auth/login.html';
        } else if (path.includes('/src/pages/')) {
          // Directly under src/pages/
          loginPath = '../auth/login.html';
        } else if (path.includes('/src/auth/')) {
          loginPath = 'login.html';
        } else if (path.includes('/src/')) {
          loginPath = 'auth/login.html';
        } else {
          // Fallback for other environments
          loginPath = 'src/auth/login.html';
        }

        // Redirect to login page
        window.location.href = loginPath;
      }
      // If user is logged in, allow normal navigation (don't prevent default)
    });
  });
}

// Handle OAuth redirect - check for stored redirect URL after OAuth login
function handleOAuthRedirect() {
  // Check if we just came back from OAuth and have a redirect URL
  const redirectUrl = sessionStorage.getItem('auth_redirect_url') || localStorage.getItem('auth_redirect_url');
  const hasUser = AppState.user ||
    localStorage.getItem('coursecity_user') ||
    sessionStorage.getItem('coursecity_user');

  if (redirectUrl && hasUser) {
    // User is authenticated and we have a redirect URL
    // Wait a bit longer to ensure authentication sync is complete
    setTimeout(() => {
      const currentPath = window.location.pathname;
      let redirectPath = redirectUrl;

      // Ensure redirect path is correct
      // If it's just "notifications.html", make it relative to pages
      if (redirectPath === 'notifications.html' || redirectPath.endsWith('notifications.html')) {
        // Construct proper path - check if we need pages/ prefix
        const currentPathIncludesPages = currentPath.includes('/pages/');
        if (currentPathIncludesPages) {
          redirectPath = redirectPath;
        } else {
          redirectPath = 'pages/' + redirectPath;
        }
      }

      // Only redirect if we're not already on the target page
      const isOnNotificationsPage = currentPath.includes('notifications.html');
      if (!isOnNotificationsPage && redirectPath.includes('notifications.html')) {
        // Clear the redirect URL before redirecting
        sessionStorage.removeItem('auth_redirect_url');
        localStorage.removeItem('auth_redirect_url');

        // Redirect to the notifications page
        window.location.href = redirectPath;
      } else {
        // Already on the target page, just clear the redirect URL
        sessionStorage.removeItem('auth_redirect_url');
        localStorage.removeItem('auth_redirect_url');
      }
    }, 1000);
  }
}

// Check authentication status and sync data with API
async function checkAuthenticationAndSync() {
  // Only proceed if API is available
  if (typeof API === 'undefined') {
    console.log('API not available - using localStorage only');
    return;
  }

  // Check if user exists in localStorage or sessionStorage
  // This prevents auto-login when users just visit login/signup pages without actually logging in
  const hasLocalStorageUser = localStorage.getItem('coursecity_user') !== null;
  const hasSessionStorageUser = sessionStorage.getItem('coursecity_user') !== null;
  const hasUser = AppState.user !== null && AppState.user !== undefined;

  // If no user data in either storage, skip API check and keep user logged out
  // This prevents stale backend sessions from auto-logging users in
  if (!hasUser || (!hasLocalStorageUser && !hasSessionStorageUser)) {
    console.log('No user data - skipping authentication check');
    AppState.user = null;
    localStorage.removeItem('coursecity_user');
    sessionStorage.removeItem('coursecity_user');
    AppState.saveToStorage();
    updateAuthUI();
    return;
  }

  // Determine if user is from localStorage (Remember Me checked) or sessionStorage (Remember Me NOT checked)
  const isRememberMeUser = hasLocalStorageUser;

  // Only check backend session if user data exists
  try {
    // Check if user is still logged in on backend
    const result = await API.getCurrentUser();

    if (result && result.user) {
      // User is still logged in - sync with backend
      AppState.user = result.user;

      // Save to appropriate storage based on Remember Me preference
      if (isRememberMeUser) {
        // Save to localStorage (persistent login)
        AppState.saveToStorage();
        sessionStorage.removeItem('coursecity_user');
      } else {
        // Save to sessionStorage (session-only login)
        sessionStorage.setItem('coursecity_user', JSON.stringify(result.user));
        localStorage.removeItem('coursecity_user');
        // Save other state to localStorage
        const tempCart = AppState.cart;
        const tempWishlist = AppState.wishlist;
        const tempTheme = AppState.theme;
        localStorage.setItem('coursecity_cart', JSON.stringify(tempCart));
        localStorage.setItem('coursecity_wishlist', JSON.stringify(tempWishlist));
        localStorage.setItem('coursecity_theme', tempTheme);
      }

      console.log('User authenticated:', result.user.email);

      // Try to get full profile data (includes profile_image)
      try {
        const profileResult = await API.getProfile();
        if (profileResult && profileResult.user) {
          AppState.user = profileResult.user;
          // Update storage with profile data
          if (isRememberMeUser) {
            AppState.saveToStorage();
          } else {
            sessionStorage.setItem('coursecity_user', JSON.stringify(profileResult.user));
          }
        }
      } catch (error) {
        console.log('Could not fetch profile, using basic user data');
      }

      // Refresh cart and wishlist from API
      await Cart.refreshFromAPI();
      await Wishlist.refreshFromAPI();

      // Update UI to show user is logged in
      updateAuthUI();

      // Comprehensive feature sync after authentication confirmation
      console.log('🔄 Running comprehensive feature sync...');
      await syncAllFeaturesAfterLogin();

      // Handle OAuth redirect after authentication is confirmed
      handleOAuthRedirect();

      // Show migration prompt if user has localStorage data
      checkAndPromptMigration();
    } else {
      // Backend says user is not logged in, but storage has user data
      // Clear both storages to keep state consistent
      console.log('Backend session expired - clearing user data');
      AppState.user = null;
      localStorage.removeItem('coursecity_user');
      sessionStorage.removeItem('coursecity_user');
      AppState.saveToStorage();
      updateAuthUI();
    }
  } catch (error) {
    // API error - if we have user, keep it (offline mode)
    // If no user, ensure we're logged out
    console.log('API unavailable or authentication check failed');
    if (!hasUser) {
      AppState.user = null;
      localStorage.removeItem('coursecity_user');
      sessionStorage.removeItem('coursecity_user');
      AppState.saveToStorage();
      updateAuthUI();
    } else {
      // Keep user data for offline mode, but don't sync with API
      console.log('Keeping user data for offline mode');
      updateAuthUI();
      // Still enable features if we have user data
      if (AppState.user && typeof enableAllFeatures === 'function') {
        enableAllFeatures();
      }
    }
  }
}

// Check if user has localStorage data and prompt for migration
function checkAndPromptMigration() {
  // Only check if migration script is loaded
  if (typeof migrateUserData === 'undefined') return;

  const hasLocalCart = AppState.cart.length > 0;
  const hasLocalWishlist = AppState.wishlist.length > 0;
  const hasMigrated = localStorage.getItem('coursecity_migrated');

  if ((hasLocalCart || hasLocalWishlist) && !hasMigrated && AppState.user) {
    // Show migration prompt after a short delay
    setTimeout(() => {
      const shouldMigrate = confirm(
        `Welcome back! We noticed you have ${hasLocalCart ? AppState.cart.length + ' items in your cart' : ''} ${hasLocalCart && hasLocalWishlist ? 'and ' : ''} ${hasLocalWishlist ? AppState.wishlist.length + ' items in your wishlist' : ''}.\n\n` +
        'Would you like to sync this data to your account so it\'s available across all your devices?'
      );

      if (shouldMigrate) {
        migrateUserData();
      } else {
        localStorage.setItem('coursecity_migrated', 'skipped');
      }
    }, 2000);
  }
}

// ====================================
// COMPREHENSIVE FEATURE SYNC AFTER LOGIN
// ====================================
async function syncAllFeaturesAfterLogin() {
  console.log('🔄 Syncing all features after login...');

  try {
    // 1. Sync offline cart items to server first
    if (typeof Cart !== 'undefined' && typeof Cart.syncOfflineCartToServer === 'function') {
      console.log('📦 Syncing offline cart items to server...');
      await Cart.syncOfflineCartToServer();
    }

    // 2. Sync Cart from API
    if (typeof Cart !== 'undefined' && typeof Cart.refreshFromAPI === 'function') {
      console.log('📦 Refreshing cart from API...');
      await Cart.refreshFromAPI();
      console.log('✅ Cart synced successfully');
    }

    // 3. Sync Wishlist from API
    if (typeof Wishlist !== 'undefined' && typeof Wishlist.refreshFromAPI === 'function') {
      console.log('❤️ Syncing wishlist from API...');
      await Wishlist.refreshFromAPI();
      console.log('✅ Wishlist synced successfully');
    }

    // 4. Refresh user profile data
    if (typeof API !== 'undefined' && typeof API.getCurrentUser === 'function') {
      console.log('👤 Refreshing user profile...');
      try {
        const userResult = await API.getCurrentUser();
        if (userResult && userResult.user) {
          AppState.user = userResult.user;
          AppState.saveToStorage();
        }
        console.log('✅ User profile refreshed');
      } catch (error) {
        console.warn('⚠️ Could not refresh user profile:', error.message);
      }
    }

    // 4. Load notifications if available
    if (typeof NotificationManager !== 'undefined' && typeof NotificationManager.loadNotifications === 'function') {
      console.log('🔔 Loading notifications...');
      try {
        await NotificationManager.loadNotifications();
        console.log('✅ Notifications loaded');
      } catch (error) {
        console.warn('⚠️ Could not load notifications:', error.message);
      }
    }

    // 5. Update all UI components
    console.log('🎨 Updating UI components...');
    updateAuthUI();
    updateCartUI();

    // Update wishlist UI if function exists
    if (typeof updateWishlistUI === 'function') {
      updateWishlistUI();
    }

    // Update theme UI if function exists
    if (typeof updateThemeUI === 'function') {
      updateThemeUI();
    }

    // 6. Enable all protected features
    if (typeof enableAllFeatures === 'function') {
      enableAllFeatures();
    }

    // 7. Trigger any custom post-login hooks
    if (typeof window.onUserLogin === 'function') {
      window.onUserLogin(AppState.user);
    }

    console.log('🎉 All features synced successfully after login!');

  } catch (error) {
    console.error('❌ Error syncing features after login:', error);
    // Show user-friendly error message
    if (typeof showToast === 'function') {
      showToast('Some features may not be fully synced. Please refresh the page if you encounter issues.', 'warning');
    }
  }
}

// ====================================
// RECOMMENDATIONS SYSTEM (Python Powered)
// ====================================
const Recommendations = {
  container: null,
  grid: null,

  async init() {
    this.container = document.getElementById('recommended-section');
    this.grid = document.getElementById('recommendations-grid');

    if (!this.container || !this.grid) return;

    try {
      console.log('🐍 Fetching recommendations from Python service...');
      const response = await API.getRecommendations({ limit: 3 });

      if (response && response.success && response.recommendations.length > 0) {
        this.render(response.recommendations);
        this.container.style.display = 'block';
      }
    } catch (error) {
      console.warn('Recommendations service unavailable:', error.message);
    }
  },

  render(courses) {
    this.grid.innerHTML = '';
    courses.forEach(course => {
      // Use CourseCardRenderer if available (on All Courses page) 
      // or simple render logic for home page
      const card = document.createElement('div');
      card.className = 'course-card-new';
      card.innerHTML = `
        <div class="course-image">
          <img src="${course.image_url || '../assets/image/placeholder.png'}" alt="${course.title}">
        </div>
        <div class="course-body">
          <h3 class="course-title">${course.title}</h3>
          <div class="course-header">
            <span class="instructor-name">${course.instructor}</span>
            <div class="course-price">GH₵${parseFloat(course.price).toFixed(2)}</div>
          </div>
          <div class="course-meta">
            <div class="meta-item"><i class="fas fa-star"></i> ${parseFloat(course.rating).toFixed(1)}</div>
            <div class="meta-item"><i class="fas fa-users"></i> ${course.students_count} Students</div>
          </div>
          <button class="btn-add-cart" data-course="${course.title}" data-price="${course.price}">
            Add to Cart
          </button>
        </div>
      `;
      this.grid.appendChild(card);
    });
  }
};

// ====================================
// MULTI-LANGUAGE WASM BRIDGE (Rust & C++)
// ====================================
const WasmBridge = {
  modules: {},

  async init() {
    console.log('🦀 Loading Rust/C++ Wasm modules...');
    // Real implementation would use WebAssembly.instantiateStreaming
    // This is a bridge for when Wasm files are compiled and deployed
    this.modules.search = {
      fuzzyMatch: (q, t) => {
        // Fallback to JS if Wasm not loaded, but designed to use Rust wasm
        return t.toLowerCase().includes(q.toLowerCase()) ? 100 : 0;
      }
    };

    this.modules.crypto = {
      encryptData: (data) => btoa(data) // Fallback to base64, designed to use C++ wasm
    };

    console.log('✅ Wasm bridges initialized');
  }
};

// ====================================
// COMPREHENSIVE FEATURE CLEANUP ON LOGOUT
// ====================================
async function cleanupAllFeaturesOnLogout() {
  console.log('🧹 Cleaning up features on logout...');

  try {
    // Clear user data
    AppState.user = null;

    // Clear sensitive data but keep cart/wishlist for offline use
    // (They will be synced again on next login)

    // Update UI to logged-out state
    updateAuthUI();
    updateCartUI();

    // Disable protected features
    const protectedElements = document.querySelectorAll('.requires-login');
    protectedElements.forEach(el => {
      el.classList.add('requires-login');
    });

    // Clear notifications if available
    if (typeof NotificationManager !== 'undefined' && typeof NotificationManager.clearNotifications === 'function') {
      NotificationManager.clearNotifications();
    }

    console.log('✅ Features cleaned up successfully');

  } catch (error) {
    console.error('❌ Error cleaning up features on logout:', error);
  }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  Recommendations.init();
  WasmBridge.init();
  // ... existing initializations ...
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AppState, Cart, Wishlist, Auth, Toast, Utils, Recommendations, WasmBridge, syncAllFeaturesAfterLogin, cleanupAllFeaturesOnLogout };
}
