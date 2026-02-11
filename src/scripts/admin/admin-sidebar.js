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
    // Toggle collapse/expand on all screen sizes
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (window.innerWidth <= 1024) {
        // Mobile/Tablet: Toggle between collapsed (80px) and expanded (280px)
        sidebar.classList.toggle('open');
        if (sidebar.classList.contains('open')) {
          // Show overlay when expanded
          if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
          }
        } else {
          // Hide overlay when collapsed
          if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
          }
        }
      } else {
        // Desktop: Toggle collapsed/expanded
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('admin-sidebar-collapsed', isCollapsed);
        
        // Update toggle icon
        const toggleIcon = sidebarToggle.querySelector('i');
        if (toggleIcon) {
          toggleIcon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-bars';
        }
      }
    });
  }

  // Close expanded sidebar when clicking outside on mobile/tablet (only if expanded)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 1024) {
      if (sidebar && sidebar.classList.contains('open')) {
        // Only close if clicking outside the sidebar and toggle button
        if (!sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('open');
          if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
          }
        }
      }
    }
  });
  
  // Handle overlay click to close expanded sidebar on mobile/tablet
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      if (window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      }
    });
  }

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth > 1024) {
        // Desktop: Remove mobile 'open' state, keep collapsed state
        sidebar.classList.remove('open');
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
        
        // Restore collapsed state from localStorage if applicable
        const savedState = localStorage.getItem('admin-sidebar-collapsed');
        if (savedState === 'true') {
          sidebar.classList.add('collapsed');
          const toggleIcon = sidebarToggle?.querySelector('i');
          if (toggleIcon) {
            toggleIcon.className = 'fas fa-chevron-right';
          }
        }
      } else {
        // Mobile/Tablet: Default to collapsed (80px) state, not hidden
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('open'); // Start collapsed (80px width)
        if (sidebarOverlay) {
          sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
      }
    }, 250);
  });

  // Handle Escape key to collapse sidebar on mobile/tablet
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.innerWidth <= 1024) {
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


