// Notifications Data Structure and Sample Data

// Notification Schema:
// {
//   id: unique identifier (timestamp + random)
//   type: 'course' | 'account' | 'purchase' | 'system'
//   title: notification title
//   message: notification message
//   timestamp: Date timestamp
//   read: boolean
//   icon: FontAwesome icon class
//   priority: 'low' | 'medium' | 'high'
//   actionUrl: optional URL to navigate to
// }

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif_001',
    type: 'account',
    title: 'Welcome to CourseCity!',
    message: 'Your account has been successfully created. Start exploring thousands of courses.',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    read: false,
    icon: 'fa-user-circle',
    priority: 'high',
    actionUrl: '../pages/index.html'
  },
  {
    id: 'notif_002',
    type: 'course',
    title: 'New Course Available: Advanced JavaScript',
    message: 'A new course matching your interests has been added. Check it out now!',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    read: false,
    icon: 'fa-book',
    priority: 'medium',
    actionUrl: 'index.html#courses'
  },
  {
    id: 'notif_003',
    type: 'purchase',
    title: 'Special Discount Available!',
    message: 'Get 30% off on all Web Development courses. Use code: WEB30',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    read: false,
    icon: 'fa-tag',
    priority: 'high',
    actionUrl: 'index.html#courses'
  },
  {
    id: 'notif_004',
    type: 'course',
    title: 'Course Update: Python for Beginners',
    message: 'New lessons and exercises have been added to your enrolled course.',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    read: true,
    icon: 'fa-book-open',
    priority: 'low',
    actionUrl: '../pages/index.html'
  },
  {
    id: 'notif_005',
    type: 'system',
    title: 'Platform Maintenance Complete',
    message: 'All systems are now operational. Thank you for your patience.',
    timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    read: true,
    icon: 'fa-tools',
    priority: 'low',
    actionUrl: null
  },
  {
    id: 'notif_006',
    type: 'account',
    title: 'Profile Update Reminder',
    message: 'Complete your profile to get personalized course recommendations.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    read: true,
    icon: 'fa-user-edit',
    priority: 'medium',
    actionUrl: '../pages/profile.html'
  },
  {
    id: 'notif_007',
    type: 'course',
    title: 'Price Drop Alert!',
    message: 'The React Masterclass course is now 50% off. Limited time offer!',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    read: true,
    icon: 'fa-fire',
    priority: 'high',
    actionUrl: 'index.html#courses'
  },
  {
    id: 'notif_008',
    type: 'purchase',
    title: 'Payment Successful',
    message: 'Your payment of ₦45,000 has been processed successfully.',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    read: true,
    icon: 'fa-check-circle',
    priority: 'medium',
    actionUrl: '../pages/cart.html'
  }
];

// Notification icon mapping based on type
const NOTIFICATION_ICONS = {
  course: 'fa-graduation-cap',
  account: 'fa-user-circle',
  purchase: 'fa-shopping-cart',
  system: 'fa-bell'
};

// Notification color mapping based on type
const NOTIFICATION_COLORS = {
  course: '#FF6636',
  account: '#1E3A8A',
  purchase: '#10B981',
  system: '#6B7280'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SAMPLE_NOTIFICATIONS,
    NOTIFICATION_ICONS,
    NOTIFICATION_COLORS
  };
}

