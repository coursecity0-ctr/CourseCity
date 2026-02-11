// CourseCity API Service
// Handles all communication with the backend server

// CourseCity API Service
// Handles all communication with the backend server

// API Configuration - Auto-detects development vs production
// For production: Set API_BASE_URL in Netlify environment variables
// Or update the production URL below with your backend URL

// Check if we're in production (not localhost)
const isProduction = typeof window !== 'undefined' &&
  window.location &&
  !window.location.hostname.includes('localhost') &&
  !window.location.hostname.includes('127.0.0.1');

// Get API URL
let API_BASE_URL;

if (isProduction) {
  // Production: Use environment variable from window if available,
  // otherwise default to the current domain's /api endpoint
  // This is more flexible than a hardcoded URL
  API_BASE_URL = window.API_BASE_URL || `${window.location.origin}/api`;

  if (!window.API_BASE_URL) {
    console.info('ℹ️ API_BASE_URL not explicitly set, defaulting to internal /api endpoint. To override, set window.API_BASE_URL.');
  }
} else {
  // Development: Use localhost
  // Check if we are being accessed via 127.0.0.1 or localhost
  const __API_HOST__ = (window.location.hostname === '127.0.0.1') ? '127.0.0.1' : 'localhost';
  API_BASE_URL = `http://${__API_HOST__}:5000/api`;
}

class API {
  /**
   * Make an API request
   * @param {string} endpoint - API endpoint path
   * @param {object} options - Fetch options
   * @returns {Promise} - Response data
   */
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include', // Important for cookies/sessions
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Check if response has JSON content
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          throw new Error('Invalid response from server');
        }
      } else {
        // Non-JSON response, get text instead
        const text = await response.text();
        throw new Error(text || 'Server returned an invalid response');
      }

      if (!response.ok) {
        // Handle rate limiting (429 Too Many Requests)
        if (response.status === 429) {
          const errorMessage = data.error || data.message || 'Too many requests, please try again later';
          throw new Error(errorMessage);
        }
        throw new Error(data.error || data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);

      // Provide more user-friendly error messages for common issues
      if (error instanceof TypeError) {
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
        }
        if (error.message.includes('CORS')) {
          throw new Error('CORS error. Please check backend CORS configuration.');
        }
      }

      // If error already has a message, use it; otherwise create a generic one
      if (!error.message || error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection and ensure the backend server is running.');
      }

      throw error;
    }
  }

  // ========================================
  // AUTHENTICATION
  // ========================================

  /**
   * Register a new user
   */
  static register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Login with email and password
   */
  static login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  /**
   * Logout current user
   */
  static logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  /**
   * Get current logged-in user
   */
  static getCurrentUser() {
    return this.request('/auth/me');
  }

  /**
   * Login with Google
   */
  static loginWithGoogle() {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  /**
   * Login with Facebook
   */
  static loginWithFacebook() {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  }

  /**
   * Delete user account
   */
  static deleteAccount(password, confirmation) {
    return this.request('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmation })
    });
  }

  // ========================================
  // COURSES
  // ========================================

  /**
   * Get all courses with optional filters
   */
  static getCourses(filters = {}) {
    const params = new URLSearchParams(filters);
  /**
   * Get personalized course recommendations (Python service)
   */
  static getRecommendations(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/recommend?${params}`);
  }

  /**
   * Get a single course by ID
   */
  static getCourse(id) {
    return this.request(`/courses/${id}`);
  }

  /**
   * Create a new course (admin only)
   */
  static createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  /**
   * Update a course (admin only)
   */
  static updateCourse(id, courseData) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  /**
   * Delete a course (admin only)
   */
  static deleteCourse(id) {
    return this.request(`/courses/${id}`, { method: 'DELETE' });
  }

  // ========================================
  // CART
  // ========================================

  /**
   * Get user's cart
   */
  static getCart() {
    return this.request('/cart');
  }

  /**
   * Add a course to cart
   */
  static addToCart(courseId, quantity = 1) {
    return this.request('/cart', {
      method: 'POST',
      body: JSON.stringify({ courseId, quantity })
    });
  }

  /**
   * Update cart item quantity
   */
  static updateCartItem(itemId, quantity) {
    return this.request(`/cart/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  }

  /**
   * Remove item from cart
   */
  static removeFromCart(itemId) {
    return this.request(`/cart/${itemId}`, { method: 'DELETE' });
  }

  /**
   * Clear entire cart
   */
  static clearCart() {
    return this.request('/cart', { method: 'DELETE' });
  }

  // ========================================
  // WISHLIST
  // ========================================

  /**
   * Get user's wishlist
   */
  static getWishlist() {
    return this.request('/wishlist');
  }

  /**
   * Add a course to wishlist
   */
  static addToWishlist(courseId) {
    return this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ courseId })
    });
  }

  /**
   * Remove a course from wishlist
   */
  static removeFromWishlist(courseId) {
    return this.request(`/wishlist/${courseId}`, { method: 'DELETE' });
  }

  // ========================================
  // ORDERS
  // ========================================

  /**
   * Get user's orders
   */
  static getOrders() {
    return this.request('/orders');
  }

  /**
   * Get a single order
   */
  static getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  /**
   * Create an order (checkout)
   */
  static createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // ========================================
  // PROFILE
  // ========================================

  /**
   * Get user's profile
   */
  static getProfile() {
    return this.request('/profile');
  }

  /**
   * Update profile attributes
   */
  static updateProfile(profileData) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Upload profile picture
   */
  static async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append('avatar', imageFile);

    try {
      console.log('Uploading profile image:', imageFile.name, imageFile.size, 'bytes');

      const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('Upload response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('Upload response data:', data);

      if (!response.ok) {
        const errorMsg = data.error || data.message || 'Upload failed';
        console.error('Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Delete profile picture
   */
  static deleteProfileImage() {
    return this.request('/profile/avatar', { method: 'DELETE' });
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Check if backend is reachable
   */
  static async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/test`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Test database connection
   */
  static testDatabase() {
    return this.request('/test-db');
  }

  // ========================================
  // ADMIN FUNCTIONS
  // ========================================

  /**
   * Verify admin access
   */
  static verifyAdminAccess() {
    return this.request('/admin/verify');
  }

  /**
   * Get admin dashboard statistics
   */
  static getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  /**
   * Get system health check
   */
  static getSystemHealth() {
    return this.request('/admin/dashboard/health');
  }

  // ========================================
  // ADMIN USER MANAGEMENT
  // ========================================

  /**
   * Get all users (admin only)
   */
  static getUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/users?${params}`);
  }

  /**
   * Get single user by ID (admin only)
   */
  static getUser(id) {
    return this.request(`/admin/users/${id}`);
  }

  /**
   * Update user (admin only)
   */
  static updateUser(id, userData) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Delete user (admin only)
   */
  static deleteUser(id) {
    return this.request(`/admin/users/${id}`, { method: 'DELETE' });
  }

  /**
   * Toggle user status (activate/deactivate)
   */
  static toggleUserStatus(id, isActive) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    });
  }

  // ========================================
  // ADMIN COURSE MANAGEMENT
  // ========================================

  /**
   * Get all courses (admin view - includes inactive)
   */
  static getAdminCourses(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/courses?${params}`);
  }

  /**
   * Create course (admin only)
   */
  static createAdminCourse(courseData) {
    return this.request('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  /**
   * Update course (admin only)
   */
  static updateAdminCourse(id, courseData) {
    return this.request(`/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  /**
   * Delete course (admin only)
   */
  static deleteAdminCourse(id) {
    return this.request(`/admin/courses/${id}`, { method: 'DELETE' });
  }

  /**
   * Get course analytics (admin only)
   */
  static getCourseAnalytics(id) {
    return this.request(`/admin/courses/${id}/analytics`);
  }

  /**
   * Bulk update courses (activate/deactivate)
   */
  static bulkUpdateCourses(courseIds, isActive) {
    return this.request('/admin/courses/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ courseIds, is_active: isActive })
    });
  }

  // ========================================
  // ADMIN ORDER MANAGEMENT
  // ========================================

  /**
   * Get all orders (admin only)
   */
  static getAdminOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/orders?${params}`);
  }

  /**
   * Get single order by ID (admin only)
   */
  static getAdminOrder(id) {
    return this.request(`/admin/orders/${id}`);
  }

  /**
   * Update order status (admin only)
   */
  static updateOrderStatus(id, status) {
    return this.request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  /**
   * Get order analytics (admin only)
   */
  static getOrderAnalytics() {
    return this.request('/admin/orders/analytics');
  }

  // ========================================
  // ADMIN SETTINGS
  // ========================================

  /**
   * Get admin profile
   */
  static getAdminProfile() {
    return this.request('/admin/settings/profile');
  }

  /**
   * Update admin profile
   */
  static updateAdminProfile(profileData) {
    return this.request('/admin/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Change admin password
   */
  static changeAdminPassword(currentPassword, newPassword) {
    return this.request('/admin/settings/password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
  }

  /**
   * Get admin settings
   */
  static getAdminSettings() {
    return this.request('/admin/settings');
  }

  /**
   * Update admin settings
   */
  static updateAdminSettings(settings) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  /**
   * Clear cache
   */
  static clearCache() {
    return this.request('/admin/settings/clear-cache', {
      method: 'POST'
    });
  }

  /**
   * Backup database
   */
  static backupDatabase() {
    return this.request('/admin/settings/backup-database', {
      method: 'POST'
    });
  }

  // Contact & Messages
  static async submitContactForm(data) {
    return this.request('/messages/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static async getAdminMessages() {
    return this.request('/messages/admin/messages');
  }

  static async updateMessageStatus(id, status) {
    return this.request(`/messages/admin/messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  static async deleteMessage(id) {
    return this.request(`/messages/admin/messages/${id}`, {
      method: 'DELETE'
    });
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}

