// Admin Dashboard Script
// Handles dashboard statistics and data loading

// Check admin access on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize admin page with authentication check
  const adminUser = await initAdminPage();
  
  if (!adminUser) {
    // Access denied - initAdminPage already handled the redirect/error display
    return;
  }

  // Update last updated date
  updateLastUpdatedDate();

  // Load dashboard data
  await loadDashboardStats();
});

// Update last updated date
function updateLastUpdatedDate() {
  const dateEl = document.getElementById('last-updated-date');
  if (dateEl) {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const year = now.getFullYear();
    dateEl.textContent = `${month}/${day}/${year}`;
  }
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const statsData = await API.getDashboardStats();
    const stats = statsData.stats;

    // Update stat cards with percentage changes
    updateStatCard('total-users', formatNumber(stats.users.total));
    updateStatChange('users-change', calculatePercentageChange(stats.users.total, stats.users.previousMonth || stats.users.total));
    
    updateStatCard('total-courses', formatNumber(stats.courses.total));
    updateStatChange('courses-change', calculatePercentageChange(stats.courses.total, stats.courses.previousMonth || stats.courses.total));
    
    updateStatCard('total-orders', formatNumber(stats.orders.total));
    updateStatChange('orders-change', calculatePercentageChange(stats.orders.total, stats.orders.previousMonth || stats.orders.total));
    
    // Format revenue - match image format
    const revenue = parseFloat(stats.revenue.total || 0);
    let revenueFormatted;
    if (revenue >= 1000000) {
      revenueFormatted = `₵${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      revenueFormatted = `₵${(revenue / 1000).toFixed(1)}K`;
    } else {
      revenueFormatted = `₵${revenue.toFixed(2)}`;
    }
    updateStatCard('total-revenue', revenueFormatted);
    updateStatChange('revenue-change', calculatePercentageChange(revenue, stats.revenue.previousMonth || revenue));

    // Load recent orders (new format)
    loadRecentOrdersList(stats.recentOrders || []);

    // Load top performing courses
    loadTopPerformingCourses(stats.topCourses || []);

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    showToast('Failed to load dashboard statistics.', 'error');
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change);
}

// Update stat change display
function updateStatChange(id, percentage) {
  const element = document.getElementById(id);
  if (element) {
    const changeEl = element.querySelector('span');
    if (changeEl) {
      changeEl.textContent = `+${percentage}% vs last month`;
    }
  }
}

// Update stat card value
function updateStatCard(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Load recent orders list (new format)
function loadRecentOrdersList(orders) {
  const container = document.getElementById('recent-orders-list');
  if (!container) return;

  if (!orders || orders.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 2rem; color: #999;">No recent orders</div>';
    return;
  }

  // Take first 4 orders
  const recentOrders = orders.slice(0, 4);

  container.innerHTML = recentOrders.map(order => {
    const statusClass = getStatusClass(order.status);
    const date = new Date(order.created_at).toLocaleDateString();
    const amount = parseFloat(order.total_amount || 0);
    const amountFormatted = amount >= 1000 ? `₵${(amount / 1000).toFixed(1)}K` : `₵${amount.toFixed(2)}`;
    
    // Get course name from order items or use default
    const courseName = order.course_title || order.course_name || 'Course';
    const customerName = order.full_name || order.email || 'Customer';
    
    return `
      <div class="recent-order-item">
        <div class="order-id">#ORD-${String(order.id).padStart(3, '0')}</div>
        <div class="order-status-badge ${statusClass}">${order.status}</div>
        <div class="order-customer">${customerName}</div>
        <div class="order-course">${courseName}</div>
        <div class="order-amount">${amountFormatted}</div>
        <div class="order-date">${date}</div>
      </div>
    `;
  }).join('');
}

// Load top performing courses
async function loadTopPerformingCourses(topCourses) {
  const container = document.getElementById('top-courses-list');
  if (!container) return;

  // If no top courses provided, try to fetch courses and calculate top performers
  if (!topCourses || topCourses.length === 0) {
    try {
      const coursesData = await API.getCourses();
      if (coursesData && coursesData.courses) {
        // Sort by students or revenue (if available)
        const sortedCourses = coursesData.courses
          .sort((a, b) => (b.students_count || 0) - (a.students_count || 0))
          .slice(0, 4);
        
        renderTopCourses(sortedCourses);
        return;
      }
    } catch (error) {
      console.error('Error fetching courses for top performers:', error);
    }
  }

  if (!topCourses || topCourses.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 2rem; color: #999;">No course data available</div>';
    return;
  }

  renderTopCourses(topCourses.slice(0, 4));
}

// Render top courses
function renderTopCourses(courses) {
  const container = document.getElementById('top-courses-list');
  if (!container) return;

  container.innerHTML = courses.map(course => {
    const students = course.students_count || course.students || 0;
    const rating = course.rating || 4.5;
    const revenue = parseFloat(course.revenue || course.total_revenue || 0);
    const revenueFormatted = revenue >= 1000 
      ? `₵${(revenue / 1000).toFixed(1)}K` 
      : revenue > 0 
        ? `₵${revenue.toFixed(2)}` 
        : '₵0.00';
    
    return `
      <div class="top-course-item">
        <div class="course-name">${course.title || course.name || 'Course'}</div>
        <div class="course-metric">
          <i class="fas fa-user"></i>
          <span>${students} students</span>
        </div>
        <div class="course-metric">
          <i class="fas fa-star"></i>
          <span>${rating.toFixed(1)}</span>
        </div>
        <div class="course-revenue">
          <i class="fas fa-eye" style="margin-right: 0.5rem; color: #999;"></i>
          ${revenueFormatted}
        </div>
      </div>
    `;
  }).join('');
}

// Get status badge class
function getStatusClass(status) {
  const statusMap = {
    'pending': 'status-pending',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled',
    'free': 'status-free'
  };
  const normalizedStatus = (status || '').toLowerCase();
  return statusMap[normalizedStatus] || 'status-pending';
}

// Toast notification function
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
