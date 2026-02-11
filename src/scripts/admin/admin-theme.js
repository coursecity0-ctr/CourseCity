// Admin Theme Toggle Handler
document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = themeToggleBtn?.querySelector('i');
  
  // Get saved theme from localStorage or default to 'light'
  const getSavedTheme = () => {
    return localStorage.getItem('admin-theme') || 'light';
  };
  
  // Apply theme to document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (themeIcon) {
        themeIcon.className = 'fas fa-sun';
      }
      if (themeToggleBtn) {
        themeToggleBtn.classList.add('active');
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) {
        themeIcon.className = 'fas fa-moon';
      }
      if (themeToggleBtn) {
        themeToggleBtn.classList.remove('active');
      }
    }
    // Save to localStorage
    localStorage.setItem('admin-theme', theme);
  };
  
  // Toggle theme
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  };
  
  // Initialize theme on page load
  if (themeToggleBtn) {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);
    
    // Add click event listener
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
});







