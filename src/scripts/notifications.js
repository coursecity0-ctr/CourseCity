// ====================================
// NOTIFICATIONS MANAGEMENT SYSTEM
// ====================================

const NotificationManager = {
  storageKey: 'coursecity_notifications',
  initialized: false,

  // Initialize the notification system
  init() {
    if (this.initialized) return;
    
    this.loadNotifications();
    this.updateUI();
    this.attachEventListeners();
    this.initialized = true;
  },

  // Load notifications from localStorage or use sample data
  loadNotifications() {
    const stored = localStorage.getItem(this.storageKey);
    
    if (stored) {
      try {
        this.notifications = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing notifications:', e);
        this.notifications = [...SAMPLE_NOTIFICATIONS];
        this.saveNotifications();
      }
    } else {
      // First time - use sample data
      this.notifications = [...SAMPLE_NOTIFICATIONS];
      this.saveNotifications();
    }
  },

  // Save notifications to localStorage
  saveNotifications() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  },

  // Get all notifications
  getAll() {
    return this.notifications || [];
  },

  // Get unread notifications
  getUnread() {
    return this.getAll().filter(n => !n.read);
  },

  // Get notifications by type
  getByType(type) {
    return this.getAll().filter(n => n.type === type);
  },

  // Get unread count
  getUnreadCount() {
    return this.getUnread().length;
  },

  // Add a new notification
  add(notification) {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      priority: 'medium',
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.updateUI();
    this.animateBellIcon();
    
    // Show toast notification
    if (typeof showToast === 'function') {
      showToast(notification.title, 'info');
    }

    return newNotification;
  },

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.updateUI();
    }
  },

  // Mark notification as unread
  markAsUnread(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = false;
      this.saveNotifications();
      this.updateUI();
    }
  },

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.updateUI();
    
    if (typeof showToast === 'function') {
      showToast('All notifications marked as read', 'success');
    }
  },

  // Delete a notification
  delete(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.updateUI();
  },

  // Clear all notifications
  clearAll() {
    if (confirm('Are you sure you want to clear all notifications?')) {
      this.notifications = [];
      this.saveNotifications();
      this.updateUI();
      
      if (typeof showToast === 'function') {
        showToast('All notifications cleared', 'success');
      }
    }
  },

  // Format timestamp to relative time
  formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return `${months} month${months > 1 ? 's' : ''} ago`;
  },

  // Update UI (badge count and dropdown)
  updateUI() {
    this.updateBadge();
    this.updateDropdown();
    
    // Update full page if it exists
    if (document.getElementById('notifications-list-full')) {
      this.renderFullPage();
    }
  },

  // Update notification badge count
  updateBadge() {
    const badge = document.getElementById('notification-count');
    const unreadCount = this.getUnreadCount();
    
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  },

  // Update notification dropdown
  updateDropdown() {
    const dropdownList = document.getElementById('notification-dropdown-list');
    if (!dropdownList) return;

    const notifications = this.getAll().slice(0, 5); // Show only 5 most recent

    if (notifications.length === 0) {
      dropdownList.innerHTML = `
        <div class="notification-empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    dropdownList.innerHTML = notifications.map(notif => `
      <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
        <div class="notification-icon ${notif.type}">
          <i class="fas ${notif.icon}"></i>
        </div>
        <div class="notification-content">
          <h4>${notif.title}</h4>
          <p>${notif.message}</p>
          <span class="notification-time">${this.formatTimestamp(notif.timestamp)}</span>
        </div>
        <div class="notification-actions">
          ${!notif.read ? '<button class="btn-mark-read" title="Mark as read"><i class="fas fa-check"></i></button>' : ''}
          <button class="btn-delete-notif" title="Delete"><i class="fas fa-times"></i></button>
        </div>
      </div>
    `).join('');
  },

  // Render full notifications page
  renderFullPage(filter = 'all') {
    const container = document.getElementById('notifications-list-full');
    if (!container) return;

    let notifications = this.getAll();

    // Apply filter
    if (filter === 'unread') {
      notifications = notifications.filter(n => !n.read);
    } else if (filter !== 'all') {
      notifications = notifications.filter(n => n.type === filter);
    }

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="notification-empty-state-full">
          <i class="fas fa-bell-slash"></i>
          <h3>No notifications found</h3>
          <p>You're all caught up! Check back later for updates.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications.map(notif => `
      <div class="notification-card ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
        <div class="notification-card-icon ${notif.type}">
          <i class="fas ${notif.icon}"></i>
        </div>
        <div class="notification-card-content">
          <div class="notification-card-header">
            <h3>${notif.title}</h3>
            <span class="notification-badge ${notif.type}">${notif.type}</span>
          </div>
          <p>${notif.message}</p>
          <div class="notification-card-footer">
            <span class="notification-timestamp">
              <i class="far fa-clock"></i>
              ${this.formatTimestamp(notif.timestamp)}
            </span>
            <div class="notification-card-actions">
              <button class="btn-toggle-read" data-id="${notif.id}">
                <i class="fas ${notif.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                ${notif.read ? 'Mark unread' : 'Mark read'}
              </button>
              <button class="btn-delete-single" data-id="${notif.id}">
                <i class="fas fa-trash"></i>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  // Animate bell icon when new notification arrives
  animateBellIcon() {
    const bellIcon = document.getElementById('notification-bell-icon');
    if (bellIcon) {
      bellIcon.classList.add('shake');
      setTimeout(() => bellIcon.classList.remove('shake'), 1000);
    }
    
    const badge = document.getElementById('notification-count');
    if (badge) {
      badge.classList.add('pulse');
      setTimeout(() => badge.classList.remove('pulse'), 1000);
    }
  },

  // Attach event listeners
  attachEventListeners() {
    // Notification bell click - toggle dropdown
    const bellBtn = document.getElementById('notification-bell-btn');
    const dropdown = document.getElementById('notification-dropdown');
    
    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    }

    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read-btn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-notif-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAll();
      });
    }

    // Dropdown notification actions (event delegation)
    const dropdownList = document.getElementById('notification-dropdown-list');
    if (dropdownList) {
      dropdownList.addEventListener('click', (e) => {
        const notifItem = e.target.closest('.notification-item');
        if (!notifItem) return;

        const notifId = notifItem.dataset.id;

        // Mark as read button
        if (e.target.closest('.btn-mark-read')) {
          e.stopPropagation();
          this.markAsRead(notifId);
        }
        // Delete button
        else if (e.target.closest('.btn-delete-notif')) {
          e.stopPropagation();
          this.delete(notifId);
        }
        // Click on notification - mark as read and navigate
        else {
          const notification = this.notifications.find(n => n.id === notifId);
          this.markAsRead(notifId);
          if (notification && notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
        }
      });
    }

    // Full page filter tabs
    const filterTabs = document.querySelectorAll('.notification-filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        this.renderFullPage(filter);
      });
    });

    // Full page actions (event delegation)
    const fullPageList = document.getElementById('notifications-list-full');
    if (fullPageList) {
      fullPageList.addEventListener('click', (e) => {
        const notifCard = e.target.closest('.notification-card');
        if (!notifCard) return;

        const notifId = notifCard.dataset.id;

        // Toggle read/unread
        if (e.target.closest('.btn-toggle-read')) {
          e.stopPropagation();
          const notification = this.notifications.find(n => n.id === notifId);
          if (notification) {
            if (notification.read) {
              this.markAsUnread(notifId);
            } else {
              this.markAsRead(notifId);
            }
            // Re-render with current filter
            const activeTab = document.querySelector('.notification-filter-tab.active');
            const filter = activeTab ? activeTab.dataset.filter : 'all';
            this.renderFullPage(filter);
          }
        }
        // Delete single notification
        else if (e.target.closest('.btn-delete-single')) {
          e.stopPropagation();
          this.delete(notifId);
          const activeTab = document.querySelector('.notification-filter-tab.active');
          const filter = activeTab ? activeTab.dataset.filter : 'all';
          this.renderFullPage(filter);
        }
      });
    }

    // Mark all as read on full page
    const markAllReadFullBtn = document.getElementById('mark-all-read-full-btn');
    if (markAllReadFullBtn) {
      markAllReadFullBtn.addEventListener('click', () => {
        this.markAllAsRead();
        const activeTab = document.querySelector('.notification-filter-tab.active');
        const filter = activeTab ? activeTab.dataset.filter : 'all';
        this.renderFullPage(filter);
      });
    }

    // Clear all on full page
    const clearAllFullBtn = document.getElementById('clear-all-full-btn');
    if (clearAllFullBtn) {
      clearAllFullBtn.addEventListener('click', () => {
        this.clearAll();
        this.renderFullPage('all');
      });
    }

    // Listen for storage events (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.loadNotifications();
        this.updateUI();
      }
    });
  },

  // Helper method to create notifications for specific events
  notifyCartAdd(itemName) {
    this.add({
      type: 'purchase',
      title: 'Added to Cart',
      message: `${itemName} has been added to your cart.`,
      icon: 'fa-shopping-cart',
      priority: 'low',
      actionUrl: '../pages/cart.html'
    });
  },

  notifyWishlistAdd(itemName) {
    this.add({
      type: 'course',
      title: 'Added to Wishlist',
      message: `${itemName} has been added to your wishlist.`,
      icon: 'fa-heart',
      priority: 'low',
      actionUrl: '../pages/wishlist.html'
    });
  },

  notifyPurchaseSuccess(amount) {
    this.add({
      type: 'purchase',
      title: 'Payment Successful!',
      message: `Your payment of ₦${amount.toLocaleString()} has been processed successfully.`,
      icon: 'fa-check-circle',
      priority: 'high',
      actionUrl: '../pages/cart.html'
    });
  },

  notifyWelcome(userName) {
    this.add({
      type: 'account',
      title: `Welcome, ${userName}!`,
      message: 'Your account has been successfully created. Start exploring thousands of courses.',
      icon: 'fa-user-circle',
      priority: 'high',
      actionUrl: '../pages/index.html'
    });
  },

  notifyDiscountApplied(discount) {
    this.add({
      type: 'purchase',
      title: 'Discount Applied!',
      message: `You saved ₦${discount.toLocaleString()} with your discount code.`,
      icon: 'fa-tag',
      priority: 'medium',
      actionUrl: '../pages/cart.html'
    });
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize notifications system (works for both authenticated and non-authenticated users)
  // The system will show notifications if user is logged in, otherwise shows empty state
  NotificationManager.init();
});

// Check if user is authenticated
async function checkAuthentication() {
  // Check localStorage and sessionStorage for user data
  const localStorageUser = localStorage.getItem('coursecity_user');
  const sessionStorageUser = sessionStorage.getItem('coursecity_user');
  const hasUser = localStorageUser || sessionStorageUser;
  
  if (!hasUser) {
    // No user data found - redirect to login
    console.log('User not authenticated - redirecting to login');
    window.location.href = '../auth/login.html';
    return;
  }
  
  // If API is available, verify authentication with backend
  if (typeof API !== 'undefined') {
    try {
      const result = await API.getCurrentUser();
      if (!result || !result.user) {
        // Backend says user is not authenticated - redirect to login
        console.log('Backend authentication failed - redirecting to login');
        localStorage.removeItem('coursecity_user');
        sessionStorage.removeItem('coursecity_user');
        window.location.href = '../auth/login.html';
        return;
      }
      // User is authenticated - update AppState if available
      if (typeof AppState !== 'undefined') {
        AppState.user = result.user;
      }
    } catch (error) {
      // API error - allow offline access if we have user data
      // This handles cases where backend is temporarily unavailable
      console.log('API unavailable but user data exists - allowing offline access');
    }
  }
  
  // Authentication check passed
  console.log('User authenticated - allowing access to notifications page');
}

// Make it globally accessible
window.NotificationManager = NotificationManager;

