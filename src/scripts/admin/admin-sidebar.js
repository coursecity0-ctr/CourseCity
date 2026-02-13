// Admin Sidebar Script
// Handles sidebar toggle and user info display

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle functionality
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Load collapsed state from localStorage
  const savedState = localStorage.getItem('admin-sidebar-collapsed');
  if (savedState === 'true' && window.innerWidth >= 1025) {
    sidebar.classList.add('collapsed');
    const toggleIcon = sidebarToggle?.querySelector('i');
    if (toggleIcon) {
      toggleIcon.className = 'fas fa-chevron-right';
    }
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();

      if (window.innerWidth < 992) {
        // Mobile/Tablet overlay toggle
        sidebar.classList.toggle('open');
        const isOpen = sidebar.classList.contains('open');
        if (sidebarOverlay) {
          sidebarOverlay.classList.toggle('active', isOpen);
        }
        document.body.style.overflow = isOpen ? 'hidden' : '';
      } else {
        // Desktop collapse toggle
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('admin-sidebar-collapsed', isCollapsed);

        const toggleIcon = sidebarToggle.querySelector('i');
        if (toggleIcon) {
          toggleIcon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-bars';
        }
      }
    });
  }

  // Close expanded sidebar when clicking outside on mobile/tablet
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 992) {
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('open');
          if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
          }
          document.body.style.overflow = '';
        }
      }
    }
  });

  // Handle overlay click to close expanded sidebar
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (window.innerWidth < 992 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Handle window resize - REMOVED

  // Handle Escape key to collapse sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  // Update user info in sidebar and header
  // Use the global updateUserInfo from admin-header.js if available
  // This ensures profile images are properly displayed across all pages
  // Wait for admin-header.js to load first (it sets window.updateUserInfo)
  setTimeout(() => {
    if (typeof window.updateUserInfo === 'function') {
      window.updateUserInfo();
    }
  }, 100);
});


