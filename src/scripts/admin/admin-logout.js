/**
 * Admin Logout Handler
 * Handles logout specifically for admin sessions
 */

// Logout modal functions
function showLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function hideLogoutModal() {
  const modal = document.getElementById('logout-modal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// Perform actual logout
async function performLogout() {
  try {
    // Clear admin session
    sessionStorage.removeItem('admin_user');
    
    // Logout from backend
    await API.logout();
    
    // Clear AppState if available
    if (typeof AppState !== 'undefined') {
      AppState.user = null;
      AppState.saveToStorage();
    }

    // Redirect to admin login
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    // Still redirect even if logout fails
    sessionStorage.removeItem('admin_user');
    window.location.href = 'login.html';
  }
}

// Add logout handler to admin logout button
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('admin-logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const cancelBtn = document.getElementById('logout-cancel-btn');
  const confirmBtn = document.getElementById('logout-confirm-btn');
  
  // Show modal when logout button is clicked
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutModal();
    });
  }

  // Hide modal when cancel is clicked
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideLogoutModal();
    });
  }

  // Perform logout when confirm is clicked
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      performLogout();
    });
  }

  // Hide modal when clicking outside the modal
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) {
        hideLogoutModal();
      }
    });
  }

  // Hide modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('logout-modal');
      if (modal && modal.classList.contains('show')) {
        hideLogoutModal();
      }
    }
  });
});

