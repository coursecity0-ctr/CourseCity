// Admin Analytics Script
// Handles analytics data loading and visualization

let revenueChart = null;
let usersChart = null;

// Check admin access on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize admin page with authentication check
  const adminUser = await initAdminPage();

  if (!adminUser) {
    // Access denied - initAdminPage already handled the redirect/error display
    return;
  }

  // Initialize analytics
  await loadAnalyticsData();

  // Setup event listeners
  document.getElementById('time-period-select').addEventListener('change', async (e) => {
    await loadAnalyticsData(e.target.value);
  });

  document.getElementById('export-report-btn').addEventListener('click', exportReport);
});

// Load analytics data
async function loadAnalyticsData(days = 30) {
  try {
    // Show loading state
    showLoadingState();

    let stats = null;
    let orderAnalytics = null;
    let courses = [];

    // Load dashboard stats for KPI data
    try {
      const statsData = await API.getDashboardStats();
      stats = statsData.stats || statsData;
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      showToast('Failed to load dashboard statistics.', 'error');
    }

    // Load order analytics
    try {
      orderAnalytics = await API.getOrderAnalytics();
      console.log('Order analytics response:', orderAnalytics);

      // Ensure we have the expected structure
      if (!orderAnalytics.analytics && orderAnalytics.success !== undefined) {
        // Response might have analytics at root level
        orderAnalytics = { analytics: orderAnalytics };
      }

      // If still no analytics property, try to extract from response
      if (!orderAnalytics.analytics) {
        console.warn('Unexpected analytics response structure:', orderAnalytics);
        // Try to use the response directly if it has the expected properties
        if (orderAnalytics.revenue || orderAnalytics.revenueByMonth) {
          orderAnalytics = { analytics: orderAnalytics };
        }
      }
    } catch (error) {
      console.error('Error loading order analytics:', error);
      const errorMsg = error.message || 'Unknown error';
      console.error('Full error object:', error);
      showToast(`Failed to load order analytics: ${errorMsg}`, 'error');
      // Create empty analytics object if API fails
      orderAnalytics = { analytics: {} };
    }

    // Load courses for enrollments
    try {
      const coursesData = await API.getCourses();
      courses = coursesData.courses || [];
    } catch (error) {
      console.error('Error loading courses:', error);
      // Continue without courses data
    }

    // Only proceed if we have at least some data
    if (!stats && !orderAnalytics) {
      showToast('Unable to load analytics data. Please check your connection and try again.', 'error');
      return;
    }

    // Calculate metrics with fallback values
    updateKPICards(stats || {}, orderAnalytics || {}, courses);
    updateCharts(orderAnalytics || {}, stats || {});
    updateTopPerformingCourses(orderAnalytics || {});
    updateAdditionalMetrics(stats || {}, orderAnalytics || {});

  } catch (error) {
    console.error('Error loading analytics data:', error);
    showToast('Failed to load analytics data. Please try refreshing the page.', 'error');
  }
}

// Update KPI cards
function updateKPICards(stats, orderAnalytics, courses) {
  // Total Revenue
  const analyticsData = orderAnalytics.analytics || orderAnalytics || {};
  const revenueData = analyticsData.revenue || {};
  const totalRevenue = parseFloat(revenueData.total || analyticsData.totalRevenue || stats.revenue?.total || 0);
  const monthlyRevenue = parseFloat(revenueData.monthly || analyticsData.monthlyRevenue || stats.revenue?.monthly || 0);
  const previousMonthRevenue = calculatePreviousMonthRevenue(orderAnalytics);

  const revenueFormatted = totalRevenue >= 1000000
    ? `₵${(totalRevenue / 1000000).toFixed(1)}M`
    : totalRevenue >= 1000
      ? `₵${(totalRevenue / 1000).toFixed(1)}K`
      : `₵${totalRevenue.toFixed(2)}`;

  document.getElementById('total-revenue-kpi').textContent = revenueFormatted;
  updateChangeIndicator('revenue-change-kpi', monthlyRevenue, previousMonthRevenue, true);

  // Total Users
  const totalUsers = stats.users?.total || 0;
  const previousMonthUsers = calculatePreviousMonthUsers(stats);
  document.getElementById('total-users-kpi').textContent = formatNumber(totalUsers);
  updateChangeIndicator('users-change-kpi', totalUsers, previousMonthUsers, true);

  // Course Enrollments (total orders)
  const enrollments = stats.orders?.total || 0;
  const previousMonthEnrollments = calculatePreviousMonthEnrollments(stats);
  document.getElementById('course-enrollments-kpi').textContent = formatNumber(enrollments);
  updateChangeIndicator('enrollments-change-kpi', enrollments, previousMonthEnrollments, true);

  // Conversion Rate (simplified calculation)
  const totalVisitors = Math.max(totalUsers * 10, 1); // Estimate visitors (TODO: Implement real visitor tracking)
  const conversionRate = enrollments > 0 ? ((enrollments / totalVisitors) * 100).toFixed(1) : "0.0";
  document.getElementById('conversion-rate-kpi').textContent = `${conversionRate}%`;
  updateChangeIndicator('conversion-change-kpi', parseFloat(conversionRate), 0, false);
}

// Update charts
function updateCharts(orderAnalytics, stats) {
  // Revenue Trend Chart
  const analyticsData = orderAnalytics.analytics || orderAnalytics || {};
  const revenueData = analyticsData.revenueByMonth || [];
  createRevenueChart(revenueData);

  // User Growth Chart
  const userGrowthData = calculateUserGrowthData(stats);
  createUsersChart(userGrowthData);
}

// Create Revenue Chart
function createRevenueChart(revenueData) {
  const ctx = document.getElementById('revenue-chart');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (revenueChart) {
    revenueChart.destroy();
  }

  // Prepare data (last 6 months)
  const months = [];
  const revenue = [];
  const sortedData = revenueData.slice(0, 6).reverse();

  sortedData.forEach(item => {
    const date = new Date(item.month + '-01');
    months.push(date.toLocaleDateString('en-US', { month: 'short' }));
    revenue.push(parseFloat(item.revenue || 0));
  });

  // If no data, use placeholder
  if (months.length === 0) {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
      revenue.push(0);
    }
  }

  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue',
        data: revenue,
        backgroundColor: '#ff7a00',
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Revenue: ₵${formatNumber(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value >= 1000 ? `₵${(value / 1000).toFixed(1)}K` : `₵${value}`;
            }
          }
        }
      }
    }
  });
}

// Create Users Chart
function createUsersChart(userGrowthData) {
  const ctx = document.getElementById('users-chart');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (usersChart) {
    usersChart.destroy();
  }

  // Prepare data
  const months = [];
  const users = [];

  userGrowthData.forEach(item => {
    months.push(item.month);
    users.push(item.users);
  });

  usersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Users',
        data: users,
        backgroundColor: '#4a90e2',
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Users: ${formatNumber(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatNumber(value);
            }
          }
        }
      }
    }
  });
}

// Update Top Performing Courses
function updateTopPerformingCourses(orderAnalytics) {
  const container = document.getElementById('top-performing-courses');
  if (!container) return;

  const analyticsData = orderAnalytics.analytics || orderAnalytics || {};
  const topCourses = analyticsData.topCourses || [];

  if (topCourses.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 2rem; color: #999;">No course data available</div>';
    return;
  }

  container.innerHTML = topCourses.slice(0, 4).map(course => {
    const enrollments = course.totalSold || 0;
    const revenue = parseFloat(course.revenue || 0);
    const revenueFormatted = revenue >= 1000000
      ? `₵${(revenue / 1000000).toFixed(1)}M`
      : revenue >= 1000
        ? `₵${(revenue / 1000).toFixed(1)}K`
        : `₵${revenue.toFixed(2)}`;

    // Calculate completion rate (TODO: Implement real completion tracking)
    const completionRate = 0;
    const rating = "N/A";

    return `
      <div class="top-course-item">
        <div class="course-name">${course.title || 'Course'}</div>
        <div class="course-metric">
          <i class="fas fa-user"></i>
          <span>${enrollments} enrollments</span>
        </div>
        <div class="course-metric">
          <i class="fas fa-star"></i>
          <span>${rating}</span>
        </div>
        <div class="course-metric">
          <i class="fas fa-check-circle"></i>
          <span>${completionRate}% completion</span>
        </div>
        <div class="course-revenue">
          <i class="fas fa-coins"></i>
          ${revenueFormatted}
        </div>
      </div>
    `;
  }).join('');
}

// Update Additional Metrics
function updateAdditionalMetrics(stats, orderAnalytics) {
  // Course Views (TODO: Implement real view tracking)
  const courseViews = 0;
  document.getElementById('course-views-kpi').textContent = formatNumber(courseViews);
  updateChangeIndicator('views-change-kpi', courseViews, 0, true);

  // Cart Abandonment (TODO: Implement real abandonment tracking)
  const abandonmentRate = 0;
  document.getElementById('cart-abandonment-kpi').textContent = `${abandonmentRate}%`;
  updateChangeIndicator('abandonment-change-kpi', abandonmentRate, 0, false);

  // Avg. Session (TODO: Implement real session tracking)
  const avgSessionMinutes = 0;
  const avgSessionSeconds = 0;
  document.getElementById('avg-session-kpi').textContent = `${avgSessionMinutes}m ${avgSessionSeconds}s`;
  updateChangeIndicator('session-change-kpi', 0, 0, true, 's');
}

// Update change indicator
function updateChangeIndicator(elementId, current, previous, isPositive, suffix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  const change = current - previous;
  const percentChange = previous > 0 ? ((change / previous) * 100) : 0;
  const changeValue = Math.abs(percentChange).toFixed(1);

  const icon = percentChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  const isIncrease = percentChange >= 0;

  // Remove negative class if present
  element.classList.remove('negative');

  // Add negative class if it's a decrease
  if (!isIncrease && !isPositive) {
    element.classList.add('negative');
  }

  const changeText = suffix ? `+${changeValue}${suffix}` : `${isIncrease ? '+' : ''}${changeValue}%`;
  const vsText = suffix ? ' vs last month' : '% vs last month';

  element.innerHTML = `<i class="fas ${icon}"></i><span>${changeText}${vsText}</span>`;

  // Update color
  if (isIncrease && isPositive) {
    element.style.color = '#28a745';
  } else if (!isIncrease && !isPositive) {
    element.style.color = '#dc3545';
  } else {
    element.style.color = '#28a745';
  }
}

// Helper functions
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function calculatePreviousMonthRevenue(orderAnalytics) {
  const analyticsData = orderAnalytics.analytics || orderAnalytics || {};
  const revenueByMonth = analyticsData.revenueByMonth || [];
  if (revenueByMonth.length < 2) {
    // Fallback: estimate 15% less than current month
    const revenueData = analyticsData.revenue || {};
    const monthlyRevenue = parseFloat(revenueData.monthly || 0);
    return monthlyRevenue * 0.85;
  }
  // Get second month's revenue (previous month)
  return parseFloat(revenueByMonth[1].revenue || 0);
}

function calculatePreviousMonthUsers(stats) {
  return 0; // TODO: Implement historical user tracking
}

function calculatePreviousMonthEnrollments(stats) {
  return 0; // TODO: Implement historical enrollment tracking
}

function calculateUserGrowthData(stats) {
  const totalUsers = stats.users?.total || 0;
  const now = new Date();
  const data = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    // Show only the current month's real users, zero for historical estimates
    const users = i === 0 ? totalUsers : 0;
    data.push({ month: monthName, users });
  }

  return data;
}

function showLoadingState() {
  // Show loading indicators
  const kpis = ['total-revenue-kpi', 'total-users-kpi', 'course-enrollments-kpi', 'conversion-rate-kpi'];
  kpis.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '...';
  });
}

// Export report
function exportReport() {
  try {
    // Create CSV content
    const csvContent = generateCSVReport();

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showToast('Report exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting report:', error);
    showToast('Failed to export report.', 'error');
  }
}

// Generate CSV report
function generateCSVReport() {
  const headers = ['Metric', 'Value', 'Change'];
  const rows = [
    ['Total Revenue', document.getElementById('total-revenue-kpi').textContent, ''],
    ['Total Users', document.getElementById('total-users-kpi').textContent, ''],
    ['Course Enrollments', document.getElementById('course-enrollments-kpi').textContent, ''],
    ['Conversion Rate', document.getElementById('conversion-rate-kpi').textContent, ''],
  ];

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  return csv;
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

