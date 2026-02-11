/**
 * Admin Header Functionality
 * Handles search, notifications, messages, and user dropdown
 */

// Set up event listeners IMMEDIATELY (before DOMContentLoaded)
// This ensures they're ready when events are dispatched

/**
 * Listen for storage changes (for cross-tab updates)
 * Note: Storage events only fire in OTHER tabs, not the same tab
 */
window.addEventListener('storage', (e) => {
  if (e.key === 'admin_user' && e.newValue) {
    try {
      // Update sessionStorage from the event
      sessionStorage.setItem('admin_user', e.newValue);
      if (typeof window.updateUserInfo === 'function') {
        window.updateUserInfo();
      }
    } catch (error) {
      console.error('Error handling storage event:', error);
    }
  }
});

/**
 * Listen for custom events (for same-tab updates)
 * This is the primary mechanism for same-tab/page updates
 */
window.addEventListener('adminUserUpdated', (e) => {
  if (e.detail && e.detail.user) {
    // Update sessionStorage with the new user data
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('admin_user', JSON.stringify(e.detail.user));
    }
    // Update localStorage too
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify(e.detail.user));
    }
    // Update the display
    if (typeof window.updateUserInfo === 'function') {
      window.updateUserInfo();
    }
  }
});

// Also listen for focus events to refresh user info when tab regains focus
window.addEventListener('focus', () => {
  // Refresh user info when tab regains focus (in case it was updated in another tab)
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('admin_user')) {
    if (typeof window.updateUserInfo === 'function') {
      window.updateUserInfo();
    }
  }
});

// Listen for storageChange events (custom event for same-tab updates)
window.addEventListener('storageChange', (e) => {
  if (e.detail && e.detail.key === 'admin_user' && e.detail.newValue) {
    try {
      const user = JSON.parse(e.detail.newValue);
      if (typeof window.updateUserInfo === 'function') {
        window.updateUserInfo();
      }
    } catch (error) {
      console.error('Error parsing storageChange event:', error);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Initialize header functionality
  initHeaderSearch();
  initNotificationsDropdown();
  initMessagesDropdown();
  initUserDropdown();
  initHeaderLogout();

  // Update user info on page load
  updateUserInfo();

  // Also try to load from localStorage if sessionStorage is empty
  if (!sessionStorage.getItem('admin_user') && typeof localStorage !== 'undefined') {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        sessionStorage.setItem('admin_user', storedUser);
        updateUserInfo();
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
      }
    }
  }

  // Poll for profile updates every 500ms (as a fallback mechanism)
  // This ensures the header updates even if events are missed
  // Check for changes in sessionStorage timestamp
  let lastUpdateTime = sessionStorage.getItem('admin_user_updated') || '0';
  let lastProfileImage = null;

  setInterval(() => {
    const currentUpdateTime = sessionStorage.getItem('admin_user_updated') || '0';
    const storedUser = sessionStorage.getItem('admin_user');

    // Check if profile was updated (timestamp changed) or image changed
    if (storedUser && (currentUpdateTime !== lastUpdateTime)) {
      try {
        const user = JSON.parse(storedUser);
        const currentImage = user.profile_image || null;

        // Update if timestamp changed OR image changed
        if (currentUpdateTime !== lastUpdateTime || currentImage !== lastProfileImage) {
          lastUpdateTime = currentUpdateTime;
          lastProfileImage = currentImage;
          updateUserInfo();
        }
      } catch (e) {
        // Ignore parse errors
      }
    } else if (storedUser) {
      // Also check if image changed even if timestamp didn't
      try {
        const user = JSON.parse(storedUser);
        const currentImage = user.profile_image || null;
        if (currentImage !== lastProfileImage) {
          lastProfileImage = currentImage;
          updateUserInfo();
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, 500);

  // Load and refresh notifications
  loadNotifications();
  // Refresh notifications every 30 seconds
  setInterval(loadNotifications, 30000);
});

/**
 * Initialize header search functionality
 */
function initHeaderSearch() {
  const searchInput = document.getElementById('admin-header-search');

  if (!searchInput) return;

  // Handle search input
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length === 0) {
      // Clear search results if query is empty
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  // Handle Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = e.target.value.trim();
      if (query.length > 0) {
        performSearch(query);
      }
    }
  });
}

/**
 * Perform search across admin pages
 */
function performSearch(query) {
  const currentPage = window.location.pathname.split('/').pop();

  // Simple search logic - can be enhanced with API calls
  console.log('Searching for:', query);

  // Show toast notification
  if (typeof Toast !== 'undefined') {
    Toast.info(`Searching for: ${query}`);
  }

  // Here you can add actual search functionality:
  // - Search courses
  // - Search users
  // - Search orders
  // - etc.
}

// Notification storage
let notificationCache = {
  notifications: [],
  lastCheck: null,
  readIds: new Set()
};

// Load read notifications from localStorage
function loadReadNotifications() {
  try {
    const stored = localStorage.getItem('admin_read_notifications');
    if (stored) {
      notificationCache.readIds = new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error('Error loading read notifications:', e);
  }
}

// Save read notifications to localStorage
function saveReadNotifications() {
  try {
    localStorage.setItem('admin_read_notifications', JSON.stringify([...notificationCache.readIds]));
  } catch (e) {
    console.error('Error saving read notifications:', e);
  }
}

/**
 * Load notifications from API
 */
async function loadNotifications() {
  try {
    // Load dashboard stats to get recent orders and users
    const statsData = await API.getDashboardStats();
    if (!statsData || !statsData.stats) return;

    const stats = statsData.stats;
    const notifications = [];

    // Get recent orders (last 24 hours)
    const recentOrders = (stats.recentOrders || []).filter(order => {
      const orderDate = new Date(order.created_at);
      const hoursAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });

    // Create notifications for recent orders
    recentOrders.slice(0, 5).forEach(order => {
      const orderDate = new Date(order.created_at);
      const timeAgo = getTimeAgo(orderDate);
      const amount = parseFloat(order.total_amount || 0);

      notifications.push({
        id: `order-${order.id}`,
        type: 'order',
        icon: 'fa-shopping-cart',
        title: 'New Order Received',
        message: `Order #${order.id} for ₵${amount.toFixed(2)} from ${order.full_name || order.email || 'Customer'}`,
        time: timeAgo,
        timestamp: orderDate.getTime(),
        link: `orders.html?order=${order.id}`
      });
    });

    // Get recent users (last 24 hours)
    const recentUsers = (stats.recentUsers || []).filter(user => {
      const userDate = new Date(user.created_at);
      const hoursAgo = (Date.now() - userDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    });

    // Create notifications for new users
    recentUsers.slice(0, 3).forEach(user => {
      const userDate = new Date(user.created_at);
      const timeAgo = getTimeAgo(userDate);

      notifications.push({
        id: `user-${user.id}`,
        type: 'user',
        icon: 'fa-user-plus',
        title: 'New User Registered',
        message: `${user.full_name || user.username || user.email} just joined`,
        time: timeAgo,
        timestamp: userDate.getTime(),
        link: `users.html?user=${user.id}`
      });
    });

    // Check for low stock courses (if data available)
    const activeCourses = stats.courses?.active || 0;
    const totalCourses = stats.courses?.total || 0;
    if (activeCourses < totalCourses * 0.1 && totalCourses > 0) {
      notifications.push({
        id: 'low-stock-alert',
        type: 'warning',
        icon: 'fa-exclamation-triangle',
        title: 'Low Active Courses',
        message: `Only ${activeCourses} of ${totalCourses} courses are active`,
        time: 'Just now',
        timestamp: Date.now(),
        link: 'courses.html'
      });
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    // Update cache
    notificationCache.notifications = notifications;
    notificationCache.lastCheck = Date.now();

    // Render notifications
    renderNotifications();

  } catch (error) {
    console.error('Error loading notifications:', error);
    // Show empty state on error
    renderNotificationsError();
  }
}

/**
 * Render notifications to the UI
 */
function renderNotifications() {
  const notificationsList = document.getElementById('admin-notifications-list');
  if (!notificationsList) return;

  const notifications = notificationCache.notifications;

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<div class="dropdown-empty">No new notifications</div>';
    updateNotificationsBadge();
    return;
  }

  // Load read notifications
  loadReadNotifications();

  notificationsList.innerHTML = notifications.map(notif => {
    const isRead = notificationCache.readIds.has(notif.id);
    const readClass = isRead ? '' : 'unread';

    const onClickAttr = notif.link ? `onclick="window.location.href='${notif.link}'" style="cursor: pointer;"` : '';

    return `
      <div class="dropdown-item ${readClass}" data-notification-id="${notif.id}" ${onClickAttr}>
        <div class="dropdown-item-icon notification ${notif.type}">
          <i class="fas ${notif.icon}"></i>
        </div>
        <div class="dropdown-item-content">
          <p class="dropdown-item-title">${notif.title}</p>
          <p class="dropdown-item-text">${notif.message}</p>
          <p class="dropdown-item-time">${notif.time}</p>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers to mark as read
  notificationsList.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
      const notificationId = this.getAttribute('data-notification-id');
      if (notificationId) {
        markNotificationAsRead(notificationId);
      }
    });
  });

  updateNotificationsBadge();
}

/**
 * Render error state
 */
function renderNotificationsError() {
  const notificationsList = document.getElementById('admin-notifications-list');
  if (!notificationsList) return;

  notificationsList.innerHTML = '<div class="dropdown-empty">Unable to load notifications</div>';
  updateNotificationsBadge();
}

/**
 * Mark a single notification as read
 */
function markNotificationAsRead(notificationId) {
  notificationCache.readIds.add(notificationId);
  saveReadNotifications();

  const item = document.querySelector(`[data-notification-id="${notificationId}"]`);
  if (item) {
    item.classList.remove('unread');
  }

  updateNotificationsBadge();
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Initialize notifications dropdown
 */
function initNotificationsDropdown() {
  const notificationsBtn = document.getElementById('admin-notifications-btn');
  const notificationsDropdown = document.getElementById('admin-notifications-dropdown');
  const markAllReadBtn = document.getElementById('mark-all-notifications-read');
  const notificationsList = document.getElementById('admin-notifications-list');
  const notificationsBadge = document.getElementById('admin-notifications-badge');

  if (!notificationsBtn || !notificationsDropdown) return;

  // Load read notifications
  loadReadNotifications();

  // Toggle dropdown
  notificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    notificationsDropdown.classList.toggle('active');

    // Refresh notifications when opened
    if (notificationsDropdown.classList.contains('active')) {
      loadNotifications();
    }
  });

  // Mark all as read
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotificationsRead();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!notificationsBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
      notificationsDropdown.classList.remove('active');
    }
  });

  // Update badge count
  updateNotificationsBadge();
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsRead() {
  const notificationsList = document.getElementById('admin-notifications-list');
  const notificationsBadge = document.getElementById('admin-notifications-badge');

  if (!notificationsList) return;

  // Mark all notifications as read in cache
  notificationCache.notifications.forEach(notif => {
    notificationCache.readIds.add(notif.id);
  });
  saveReadNotifications();

  // Mark all items as read (remove unread styling)
  const items = notificationsList.querySelectorAll('.dropdown-item');
  items.forEach(item => {
    item.classList.remove('unread');
  });

  // Update badge
  if (notificationsBadge) {
    notificationsBadge.textContent = '0';
    notificationsBadge.style.display = 'none';
  }

  // Show toast
  if (typeof Toast !== 'undefined') {
    Toast.success('All notifications marked as read');
  }
}

/**
 * Update notifications badge count
 */
function updateNotificationsBadge() {
  const notificationsList = document.getElementById('admin-notifications-list');
  const notificationsBadge = document.getElementById('admin-notifications-badge');

  if (!notificationsBadge) return;

  // Count unread notifications
  let unreadCount = 0;

  if (notificationsList) {
    // Count from DOM if available
    unreadCount = notificationsList.querySelectorAll('.dropdown-item.unread').length;
  } else {
    // Count from cache
    loadReadNotifications();
    unreadCount = notificationCache.notifications.filter(
      notif => !notificationCache.readIds.has(notif.id)
    ).length;
  }

  if (unreadCount > 0) {
    notificationsBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    notificationsBadge.style.display = 'flex';
  } else {
    notificationsBadge.style.display = 'none';
  }
}

/**
 * Initialize messages dropdown
 */
function initMessagesDropdown() {
  const messagesBtn = document.getElementById('admin-messages-btn');
  const messagesDropdown = document.getElementById('admin-messages-dropdown');
  const markAllReadBtn = document.getElementById('mark-all-messages-read');
  const messagesList = document.getElementById('admin-messages-list');
  const messagesBadge = document.getElementById('admin-messages-badge');

  if (!messagesBtn || !messagesDropdown) return;

  // Toggle dropdown
  messagesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    messagesDropdown.classList.toggle('active');

    // Update badge count when opened
    if (messagesDropdown.classList.contains('active')) {
      updateMessagesBadge();
    }
  });

  // Mark all as read
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllMessagesRead();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!messagesBtn.contains(e.target) && !messagesDropdown.contains(e.target)) {
      messagesDropdown.classList.remove('active');
    }
  });

  // Update badge count
  updateMessagesBadge();
}

/**
 * Mark all messages as read
 */
function markAllMessagesRead() {
  const messagesList = document.getElementById('admin-messages-list');
  const messagesBadge = document.getElementById('admin-messages-badge');

  if (!messagesList) return;

  // Mark all items as read
  const items = messagesList.querySelectorAll('.dropdown-item');
  items.forEach(item => {
    item.classList.remove('unread');
  });

  // Update badge
  if (messagesBadge) {
    messagesBadge.textContent = '0';
    messagesBadge.style.display = 'none';
  }

  // Show toast
  if (typeof Toast !== 'undefined') {
    Toast.success('All messages marked as read');
  }
}

/**
 * Update messages badge count
 */
function updateMessagesBadge() {
  const messagesList = document.getElementById('admin-messages-list');
  const messagesBadge = document.getElementById('admin-messages-badge');

  if (!messagesList || !messagesBadge) return;

  const unreadCount = messagesList.querySelectorAll('.dropdown-item.unread').length ||
    messagesList.querySelectorAll('.dropdown-item').length;

  if (unreadCount > 0) {
    messagesBadge.textContent = unreadCount;
    messagesBadge.style.display = 'flex';
  } else {
    messagesBadge.style.display = 'none';
  }
}

/**
 * Initialize user dropdown
 */
function initUserDropdown() {
  const userDropdown = document.getElementById('admin-user-dropdown');
  const userMenu = document.getElementById('admin-user-menu');
  const profileLink = document.getElementById('admin-profile-link');

  if (!userDropdown || !userMenu) return;

  // Toggle dropdown
  userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    userMenu.classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userMenu.contains(e.target)) {
      userMenu.classList.remove('active');
    }
  });

  // Profile link now navigates to settings page (handled by href)
  // No need for JavaScript handler - the link works naturally
}

/**
 * Update user info in header
 * Make this function globally accessible
 */
window.updateUserInfo = function updateUserInfo() {
  try {
    const adminUser = JSON.parse(sessionStorage.getItem('admin_user'));

    if (adminUser) {
      // Update avatar
      const avatar = document.getElementById('header-user-avatar');
      if (avatar) {
        if (adminUser.profile_image) {
          // Construct full image URL
          let imageUrl = adminUser.profile_image;
          if (!imageUrl.startsWith('http')) {
            // Get API base URL
            const isProduction = typeof window !== 'undefined' &&
              window.location &&
              !window.location.hostname.includes('localhost') &&
              !window.location.hostname.includes('127.0.0.1');
            const apiBase = isProduction
              ? (window.API_BASE_URL || window.location.origin)
              : `http://${window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:5000`;

            const imagePath = imageUrl.startsWith('/')
              ? imageUrl
              : `/uploads/profile-images/${imageUrl}`;
            imageUrl = `${apiBase}${imagePath}`;
          }

          // Add cache-busting parameter to ensure fresh image loads
          // Use timestamp from profile update if available, otherwise use current time
          const updateTime = sessionStorage.getItem('admin_user_updated') || Date.now();
          const separator = imageUrl.includes('?') ? '&' : '?';
          imageUrl = `${imageUrl}${separator}t=${updateTime}`;

          // Set image as background
          // Clear any existing content first
          avatar.textContent = '';
          avatar.style.backgroundImage = `url(${imageUrl})`;
          avatar.style.backgroundSize = 'cover';
          avatar.style.backgroundPosition = 'center';
          avatar.style.backgroundRepeat = 'no-repeat';
          // Ensure avatar is visible and properly sized
          avatar.style.display = 'flex';
          avatar.style.alignItems = 'center';
          avatar.style.justifyContent = 'center';
        } else if (adminUser.full_name) {
          // Fallback to initials - clear image and show initials
          const initials = adminUser.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
          avatar.textContent = initials;
          avatar.style.backgroundImage = '';
          avatar.style.backgroundSize = '';
          avatar.style.backgroundPosition = '';
          avatar.style.backgroundRepeat = '';
        } else {
          // No name or image - show default
          avatar.textContent = 'AU';
          avatar.style.backgroundImage = '';
          avatar.style.backgroundSize = '';
          avatar.style.backgroundPosition = '';
          avatar.style.backgroundRepeat = '';
        }
      }

      // Update name
      const name = document.getElementById('header-user-name');
      if (name && adminUser.full_name) {
        name.textContent = adminUser.full_name;
      }

      // Update role
      const role = document.getElementById('header-user-role');
      if (role) {
        role.textContent = adminUser.role === 'admin' ? 'Super Admin' : 'Admin';
      }
    }
  } catch (error) {
    console.error('Error updating user info:', error);
  }
}

/**
 * Refresh user info from API (call this after profile updates)
 * Make this function globally accessible
 */
window.refreshUserInfo = async function refreshUserInfo() {
  try {
    // Try to get admin profile first, fallback to getCurrentUser
    let response;
    if (typeof API.getAdminProfile === 'function') {
      response = await API.getAdminProfile();
    } else if (typeof API.getCurrentUser === 'function') {
      response = await API.getCurrentUser();
    } else {
      // If no API method, just update from sessionStorage
      updateUserInfo();
      return;
    }

    if (response.success && response.user) {
      // Store in session storage
      sessionStorage.setItem('admin_user', JSON.stringify(response.user));

      // Also update localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('admin_user', JSON.stringify(response.user));
      }

      // Trigger storage event for other tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'admin_user',
        newValue: JSON.stringify(response.user),
        storageArea: sessionStorage
      }));

      // Update display
      updateUserInfo();
    }
  } catch (error) {
    console.error('Error refreshing user info:', error);
    // Fallback to sessionStorage if API fails
    updateUserInfo();
  }
}

// Event listeners are now set up at the top of the file (before DOMContentLoaded)

/**
 * Initialize header logout button
 */
function initHeaderLogout() {
  const headerLogoutBtn = document.getElementById('admin-header-logout-btn');

  if (!headerLogoutBtn) return;

  headerLogoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // Use the logout modal if available
    if (typeof showLogoutModal === 'function') {
      showLogoutModal();
    } else {
      // Fallback to direct logout
      if (confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    }
  });
}

/**
 * Perform logout (fallback function)
 */
async function performLogout() {
  try {
    sessionStorage.removeItem('admin_user');
    await API.logout();

    if (typeof AppState !== 'undefined') {
      AppState.user = null;
      AppState.saveToStorage();
    }

    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.removeItem('admin_user');
    window.location.href = 'login.html';
  }
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll('.header-dropdown.active');
  dropdowns.forEach(dropdown => {
    dropdown.classList.remove('active');
  });
}

// Close dropdowns on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllDropdowns();
  }
});

