// Admin Orders Management Script

let currentPage = 1;
let currentFilters = {};
let currentOrderId = null;

// Check admin access on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize admin page with authentication check
  const adminUser = await initAdminPage();
  
  if (!adminUser) {
    // Access denied - initAdminPage already handled the redirect/error display
    return;
  }

  const adminUsernameEl = document.getElementById('admin-username');
  if (adminUsernameEl) {
    adminUsernameEl.textContent = adminUser.full_name || adminUser.username || 'Admin';
  }

  // Load orders
  await loadOrders();

  // Setup search handler
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadOrders();
  });
});

// Load orders with filters
async function loadOrders(page = 1) {
  try {
    currentPage = page;
    
    const search = document.getElementById('search-input').value.trim();
    const status = document.getElementById('status-filter').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    currentFilters = {
      page,
      limit: 20
    };

    if (search) currentFilters.search = search;
    if (status) currentFilters.status = status;
    if (startDate) currentFilters.startDate = startDate;
    if (endDate) currentFilters.endDate = endDate;

    const data = await API.getAdminOrders(currentFilters);
    
    const countEl = document.getElementById('orders-count');
    if (countEl) {
      countEl.textContent = `${data.count} of ${data.total} orders`;
    }

    renderOrdersTable(data.orders);
    renderPagination(data.page, data.totalPages);
  } catch (error) {
    console.error('Error loading orders:', error);
    showToast('Failed to load orders.', 'error');
    document.getElementById('orders-table').innerHTML = 
      '<tr><td colspan="7" class="text-center">Error loading orders</td></tr>';
  }
}

// Render orders table
function renderOrdersTable(orders) {
  const tableBody = document.getElementById('orders-table');
  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found</td></tr>';
    return;
  }

  tableBody.innerHTML = orders.map(order => {
    const statusClass = getStatusClass(order.status);
    const date = new Date(order.created_at).toLocaleDateString();
    const amount = parseFloat(order.total_amount).toFixed(2);
    const customer = order.full_name || order.username || order.email || 'N/A';

    return `
      <tr>
        <td>#${order.id}</td>
        <td>${customer}</td>
        <td>₵${amount}</td>
        <td><span class="status-badge ${statusClass}">${order.status}</span></td>
        <td>${order.payment_method || 'N/A'}</td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn-view" onclick="viewOrderDetails(${order.id})" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render pagination
function renderPagination(currentPage, totalPages) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  paginationHTML += `
    <button onclick="loadOrders(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `
        <button class="${i === currentPage ? 'active' : ''}" onclick="loadOrders(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += `<span>...</span>`;
    }
  }

  paginationHTML += `
    <button onclick="loadOrders(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationEl.innerHTML = paginationHTML;
}

// View order details
async function viewOrderDetails(orderId) {
  try {
    currentOrderId = orderId;
    document.getElementById('order-id-display').textContent = orderId;
    document.getElementById('order-details').innerHTML = '<p class="loading">Loading order details...</p>';
    document.getElementById('order-status-group').style.display = 'none';
    document.getElementById('order-actions').style.display = 'none';

    const orderData = await API.getAdminOrder(orderId);
    const order = orderData.order;

    // Render order details
    let detailsHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Customer Information</h3>
        <p><strong>Name:</strong> ${order.full_name || order.username || 'N/A'}</p>
        <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin-bottom: 1rem;">Order Information</h3>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Total Amount:</strong> ₵${parseFloat(order.total_amount).toFixed(2)}</p>
        <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></p>
        <p><strong>Payment Method:</strong> ${order.payment_method || 'N/A'}</p>
        <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Updated:</strong> ${new Date(order.updated_at).toLocaleString()}</p>
      </div>
      <div>
        <h3 style="margin-bottom: 1rem;">Order Items</h3>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
    `;

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const subtotal = parseFloat(item.price) * (item.quantity || 1);
        detailsHTML += `
          <tr>
            <td>${item.title || 'N/A'}</td>
            <td>₵${parseFloat(item.price).toFixed(2)}</td>
            <td>${item.quantity || 1}</td>
            <td>₵${subtotal.toFixed(2)}</td>
          </tr>
        `;
      });
    } else {
      detailsHTML += '<tr><td colspan="4" class="text-center">No items found</td></tr>';
    }

    detailsHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('order-details').innerHTML = detailsHTML;
    document.getElementById('order-status-select').value = order.status;
    document.getElementById('order-status-group').style.display = 'block';
    document.getElementById('order-actions').style.display = 'flex';
    document.getElementById('order-modal').classList.add('show');
  } catch (error) {
    console.error('Error loading order details:', error);
    showToast('Failed to load order details.', 'error');
    document.getElementById('order-details').innerHTML = '<p class="text-center">Error loading order details</p>';
  }
}

// Close order modal
function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('show');
  currentOrderId = null;
}

// Update order status
async function updateOrderStatus() {
  if (!currentOrderId) return;

  try {
    const newStatus = document.getElementById('order-status-select').value;
    await API.updateOrderStatus(currentOrderId, newStatus);
    showToast('Order status updated successfully!', 'success');
    closeOrderModal();
    await loadOrders(currentPage);
  } catch (error) {
    console.error('Error updating order status:', error);
    showToast(error.message || 'Failed to update order status.', 'error');
  }
}

// Get status badge class
function getStatusClass(status) {
  const statusMap = {
    'pending': 'status-pending',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return statusMap[status?.toLowerCase()] || 'status-default';
}

// Toast notification function
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

