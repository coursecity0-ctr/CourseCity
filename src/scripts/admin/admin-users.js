// Admin Users Management Script

let currentPage = 1;
let currentFilters = {};

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

  // Load users
  await loadUsers();

  // Setup form handlers
  document.getElementById('edit-user-form').addEventListener('submit', handleEditUser);
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadUsers();
  });
});

// Load users with filters
async function loadUsers(page = 1) {
  try {
    currentPage = page;
    
    // Get filter values
    const search = document.getElementById('search-input').value.trim();
    const role = document.getElementById('role-filter').value;
    const isActive = document.getElementById('status-filter').value;

    currentFilters = {
      page,
      limit: 20
    };

    if (search) currentFilters.search = search;
    if (role) currentFilters.role = role;
    if (isActive !== '') currentFilters.is_active = isActive;

    const data = await API.getUsers(currentFilters);
    
    // Update count
    const countEl = document.getElementById('users-count');
    if (countEl) {
      countEl.textContent = `${data.count} of ${data.total} users`;
    }

    // Render users table
    renderUsersTable(data.users);

    // Render pagination
    renderPagination(data.page, data.totalPages);
  } catch (error) {
    console.error('Error loading users:', error);
    showToast('Failed to load users.', 'error');
    document.getElementById('users-table').innerHTML = 
      '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
  }
}

// Render users table
function renderUsersTable(users) {
  const tableBody = document.getElementById('users-table');
  if (!tableBody) return;

  if (!users || users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
    return;
  }

  tableBody.innerHTML = users.map(user => {
    const roleClass = getRoleClass(user.role);
    const statusClass = user.is_active ? 'status-completed' : 'status-cancelled';
    const statusText = user.is_active ? 'Active' : 'Inactive';
    const date = new Date(user.created_at).toLocaleDateString();

    return `
      <tr>
        <td>${user.id}</td>
        <td>${user.full_name || user.username || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td><span class="role-badge ${roleClass}">${user.role || 'user'}</span></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn-edit" onclick="openEditModal(${user.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn action-btn-delete" onclick="confirmDeleteUser(${user.id})" title="Delete">
              <i class="fas fa-trash"></i>
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

  // Previous button
  paginationHTML += `
    <button onclick="loadUsers(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `
        <button class="${i === currentPage ? 'active' : ''}" onclick="loadUsers(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += `<span>...</span>`;
    }
  }

  // Next button
  paginationHTML += `
    <button onclick="loadUsers(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationEl.innerHTML = paginationHTML;
}

// Open edit modal
async function openEditModal(userId) {
  try {
    const userData = await API.getUser(userId);
    const user = userData.user;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-full-name').value = user.full_name || '';
    document.getElementById('edit-role').value = user.role || 'user';
    document.getElementById('edit-is-active').value = user.is_active ? 'true' : 'false';

    document.getElementById('edit-user-modal').classList.add('show');
  } catch (error) {
    console.error('Error loading user:', error);
    showToast('Failed to load user details.', 'error');
  }
}

// Close edit modal
function closeEditModal() {
  document.getElementById('edit-user-modal').classList.remove('show');
  document.getElementById('edit-user-form').reset();
}

// Handle edit user form submission
async function handleEditUser(e) {
  e.preventDefault();

  try {
    const userId = document.getElementById('edit-user-id').value;
    const userData = {
      username: document.getElementById('edit-username').value,
      email: document.getElementById('edit-email').value,
      full_name: document.getElementById('edit-full-name').value,
      role: document.getElementById('edit-role').value,
      is_active: document.getElementById('edit-is-active').value === 'true'
    };

    await API.updateUser(userId, userData);
    showToast('User updated successfully!', 'success');
    closeEditModal();
    await loadUsers(currentPage);
  } catch (error) {
    console.error('Error updating user:', error);
    showToast(error.message || 'Failed to update user.', 'error');
  }
}

// Confirm and delete user
async function confirmDeleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  try {
    await API.deleteUser(userId);
    showToast('User deleted successfully!', 'success');
    await loadUsers(currentPage);
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast(error.message || 'Failed to delete user.', 'error');
  }
}

// Get role badge class
function getRoleClass(role) {
  const roleMap = {
    'admin': 'role-admin',
    'moderator': 'role-moderator',
    'user': 'role-user'
  };
  return roleMap[role?.toLowerCase()] || 'role-user';
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

