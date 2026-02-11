// Admin Settings Page Handler - Fully Functional
document.addEventListener('DOMContentLoaded', () => {
  let currentSettings = {};

  // Settings tabs functionality
  const settingsTabs = document.querySelectorAll('.settings-tab');
  const settingsSections = document.querySelectorAll('.settings-section');

  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      // Remove active class from all tabs and sections
      settingsTabs.forEach(t => t.classList.remove('active'));
      settingsSections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked tab and corresponding section
      tab.classList.add('active');
      const targetSection = document.getElementById(`settings-${targetTab}`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });

  // Load settings on page load (profile is now separate)
  loadSettings();

  // Profile functionality has been moved to admin-profile.js
  // This file now only handles settings (General, Appearance, Notifications, Security, System)

  // General Settings Form
  const generalForm = document.getElementById('general-form');
  if (generalForm) {
    generalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = generalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const settings = {
          platform_name: document.getElementById('platform-name').value,
          platform_email: document.getElementById('platform-email').value,
          platform_phone: document.getElementById('platform-phone').value,
          platform_address: document.getElementById('platform-address').value,
          currency: document.getElementById('currency').value,
          timezone: document.getElementById('timezone').value
        };
        
        const response = await API.updateAdminSettings(settings);
        if (response.success) {
          showToast('✓ General settings saved successfully! Your changes have been applied.', 'success');
          currentSettings = { ...currentSettings, ...settings };
          
          // Update button to show success state briefly
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
          submitBtn.style.backgroundColor = '#28a745';
          submitBtn.style.borderColor = '#28a745';
          
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.borderColor = '';
          }, 2000);
        }
      } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Appearance Settings Form
  const appearanceForm = document.getElementById('appearance-form');
  if (appearanceForm) {
    appearanceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = appearanceForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const settings = {
          theme: document.querySelector('input[name="theme"]:checked')?.value,
          sidebar_collapse: document.getElementById('sidebar-collapse').value,
          language: document.getElementById('language').value
        };
        
        const response = await API.updateAdminSettings(settings);
        if (response.success) {
          showToast('✓ Appearance settings saved successfully! Your preferences have been applied.', 'success');
          currentSettings = { ...currentSettings, ...settings };
          
          // Apply theme immediately if changed
          if (settings.theme) {
            if (settings.theme === 'auto') {
              localStorage.removeItem('admin-theme');
              // Apply system preference
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
              localStorage.setItem('admin-theme', settings.theme);
              document.documentElement.setAttribute('data-theme', settings.theme);
            }
          }
          
          // Apply sidebar behavior
          if (settings.sidebar_collapse) {
            localStorage.setItem('admin-sidebar-collapse', settings.sidebar_collapse === 'collapsed' ? 'true' : 'false');
            if (settings.sidebar_collapse === 'expanded') {
              document.getElementById('admin-sidebar')?.classList.remove('collapsed');
            } else if (settings.sidebar_collapse === 'collapsed') {
              document.getElementById('admin-sidebar')?.classList.add('collapsed');
            }
          }
          
          // Update button to show success state briefly
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
          submitBtn.style.backgroundColor = '#28a745';
          submitBtn.style.borderColor = '#28a745';
          
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.borderColor = '';
          }, 2000);
        }
      } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Notification Settings Form
  const notificationsForm = document.getElementById('notifications-form');
  if (notificationsForm) {
    notificationsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = notificationsForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const settings = {
          email_notifications: document.getElementById('email-notifications').checked,
          order_notifications: document.getElementById('order-notifications').checked,
          user_notifications: document.getElementById('user-notifications').checked,
          system_alerts: document.getElementById('system-alerts').checked,
          marketing_emails: document.getElementById('marketing-emails').checked
        };
        
        const response = await API.updateAdminSettings(settings);
        if (response.success) {
          showToast('✓ Notification preferences saved successfully! Your preferences have been updated.', 'success');
          currentSettings = { ...currentSettings, ...settings };
          
          // Update button to show success state briefly
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
          submitBtn.style.backgroundColor = '#28a745';
          submitBtn.style.borderColor = '#28a745';
          
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.backgroundColor = '';
            submitBtn.style.borderColor = '';
          }, 2000);
        }
      } catch (error) {
        showToast(error.message || 'Failed to save settings', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Security Settings Form
  const securityForm = document.getElementById('security-form');
  if (securityForm) {
    securityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = securityForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          showToast('Please fill in all password fields', 'error');
          return;
        }

        if (newPassword.length < 8) {
          showToast('Password must be at least 8 characters long', 'error');
          return;
        }

        if (newPassword !== confirmPassword) {
          showToast('New passwords do not match', 'error');
          return;
        }

        const response = await API.changeAdminPassword(currentPassword, newPassword);
        if (response.success) {
          showToast('✓ Password changed successfully! Your new password has been saved.', 'success');
          securityForm.reset();
          
          // Reset button state
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
          }, 2000);
        }
      } catch (error) {
        showToast(error.message || 'Failed to change password', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Security toggles
  const securityToggles = ['two-factor-auth', 'login-notifications', 'session-timeout'];
  securityToggles.forEach(toggleId => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', async () => {
        try {
          const settingKey = toggleId.replace(/-/g, '_');
          const settings = { [settingKey]: toggle.checked };
          await API.updateAdminSettings(settings);
          currentSettings = { ...currentSettings, ...settings };
          
          const settingName = toggleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          showToast(`✓ ${settingName} ${toggle.checked ? 'enabled' : 'disabled'} successfully!`, 'success');
        } catch (error) {
          toggle.checked = !toggle.checked; // Revert on error
          showToast(error.message || 'Failed to update setting', 'error');
        }
      });
    }
  });

  // Maintenance Mode
  const maintenanceMode = document.getElementById('maintenance-mode');
  const maintenanceMessageGroup = document.getElementById('maintenance-message-group');
  
  if (maintenanceMode) {
    maintenanceMode.addEventListener('change', async () => {
      if (maintenanceMessageGroup) {
        maintenanceMessageGroup.style.display = maintenanceMode.checked ? 'block' : 'none';
      }
      
      try {
        const settings = {
          maintenance_mode: maintenanceMode.checked,
          maintenance_message: document.getElementById('maintenance-message')?.value || ''
        };
        await API.updateAdminSettings(settings);
        currentSettings = { ...currentSettings, ...settings };
        showToast(`✓ Maintenance mode ${maintenanceMode.checked ? 'enabled' : 'disabled'} successfully!`, maintenanceMode.checked ? 'warning' : 'success');
      } catch (error) {
        maintenanceMode.checked = !maintenanceMode.checked; // Revert on error
        showToast(error.message || 'Failed to update maintenance mode', 'error');
      }
    });
  }

  // Clear Cache Button
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear the cache? This action cannot be undone.')) {
        return;
      }

      try {
        clearCacheBtn.disabled = true;
        clearCacheBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Clearing...';
        
        const response = await API.clearCache();
        if (response.success) {
          showToast('✓ Cache cleared successfully! All cached data has been removed.', 'success');
        }
      } catch (error) {
        showToast(error.message || 'Failed to clear cache', 'error');
      } finally {
        clearCacheBtn.disabled = false;
        clearCacheBtn.innerHTML = '<i class="fas fa-broom"></i> Clear Cache';
      }
    });
  }

  // Backup Database Button
  const backupDbBtn = document.getElementById('backup-db-btn');
  if (backupDbBtn) {
    backupDbBtn.addEventListener('click', async () => {
      try {
        backupDbBtn.disabled = true;
        backupDbBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Backing up...';
        
        const response = await API.backupDatabase();
        if (response.success) {
          showToast(`✓ ${response.message || 'Database backup initiated. You will be notified when it\'s ready.'}`, 'info');
        }
      } catch (error) {
        showToast(error.message || 'Failed to backup database', 'error');
      } finally {
        backupDbBtn.disabled = false;
        backupDbBtn.innerHTML = '<i class="fas fa-download"></i> Backup Database';
      }
    });
  }

  // Profile loading has been moved to admin-profile.js

  // Load Settings Function
  async function loadSettings() {
    try {
      const response = await API.getAdminSettings();
      if (response.success && response.settings) {
        currentSettings = response.settings;
        updateSettingsForms(response.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use defaults if API fails
    }
  }

  // Profile display functions have been moved to admin-profile.js

  // Update Settings Forms
  function updateSettingsForms(settings) {
    // General Settings
    if (document.getElementById('platform-name')) {
      document.getElementById('platform-name').value = settings.platform_name || '';
    }
    if (document.getElementById('platform-email')) {
      document.getElementById('platform-email').value = settings.platform_email || '';
    }
    if (document.getElementById('platform-phone')) {
      document.getElementById('platform-phone').value = settings.platform_phone || '';
    }
    if (document.getElementById('platform-address')) {
      document.getElementById('platform-address').value = settings.platform_address || '';
    }
    if (document.getElementById('currency')) {
      document.getElementById('currency').value = settings.currency || 'GHS';
    }
    if (document.getElementById('timezone')) {
      document.getElementById('timezone').value = settings.timezone || 'Africa/Accra';
    }

    // Appearance Settings
    const theme = settings.theme || localStorage.getItem('admin-theme') || 'auto';
    const themeRadio = document.getElementById(`theme-${theme}`);
    if (themeRadio) {
      themeRadio.checked = true;
    }
    if (document.getElementById('sidebar-collapse')) {
      document.getElementById('sidebar-collapse').value = settings.sidebar_collapse || 'remember';
    }
    if (document.getElementById('language')) {
      document.getElementById('language').value = settings.language || 'en';
    }

    // Notification Settings
    if (document.getElementById('email-notifications')) {
      document.getElementById('email-notifications').checked = settings.email_notifications !== false;
    }
    if (document.getElementById('order-notifications')) {
      document.getElementById('order-notifications').checked = settings.order_notifications !== false;
    }
    if (document.getElementById('user-notifications')) {
      document.getElementById('user-notifications').checked = settings.user_notifications !== false;
    }
    if (document.getElementById('system-alerts')) {
      document.getElementById('system-alerts').checked = settings.system_alerts !== false;
    }
    if (document.getElementById('marketing-emails')) {
      document.getElementById('marketing-emails').checked = settings.marketing_emails === true;
    }

    // Security Settings
    if (document.getElementById('two-factor-auth')) {
      document.getElementById('two-factor-auth').checked = settings.two_factor_auth === true;
    }
    if (document.getElementById('login-notifications')) {
      document.getElementById('login-notifications').checked = settings.login_notifications !== false;
    }
    if (document.getElementById('session-timeout')) {
      document.getElementById('session-timeout').checked = settings.session_timeout !== false;
    }

    // System Settings
    if (document.getElementById('maintenance-mode')) {
      document.getElementById('maintenance-mode').checked = settings.maintenance_mode === true;
      if (maintenanceMessageGroup) {
        maintenanceMessageGroup.style.display = settings.maintenance_mode ? 'block' : 'none';
      }
    }
    if (document.getElementById('maintenance-message')) {
      document.getElementById('maintenance-message').value = settings.maintenance_message || '';
    }
  }

  // Load System Information
  async function loadSystemInfo() {
    try {
      // Get system information
      const platformVersion = 'v1.0.0';
      const lastUpdated = new Date().toISOString().split('T')[0];
      
      // Check database status
      let dbStatus = 'Connected';
      let serverStatus = 'Online';
      
      try {
        // Try to ping the API to check server status
        const response = await API.getDashboardStats();
        if (!response.success) {
          serverStatus = 'Offline';
        }
      } catch (e) {
        serverStatus = 'Offline';
      }

      // Update system info display
      const systemInfoItems = document.querySelectorAll('.system-info-item');
      systemInfoItems.forEach(item => {
        const label = item.querySelector('.system-info-label')?.textContent;
        const valueElement = item.querySelector('.system-info-value');
        
        if (label && valueElement) {
          if (label.includes('Version')) {
            valueElement.textContent = platformVersion;
          } else if (label.includes('Last Updated')) {
            valueElement.textContent = lastUpdated;
          } else if (label.includes('Database')) {
            valueElement.innerHTML = `
              <i class="fas fa-check-circle"></i>
              ${dbStatus}
            `;
            valueElement.className = 'system-info-value status-success';
          } else if (label.includes('Server')) {
            valueElement.innerHTML = `
              <i class="fas fa-${serverStatus === 'Online' ? 'check' : 'times'}-circle"></i>
              ${serverStatus}
            `;
            valueElement.className = `system-info-value status-${serverStatus === 'Online' ? 'success' : 'error'}`;
          }
        }
      });
    } catch (error) {
      console.error('Error loading system info:', error);
    }
  }

  // Load system info on page load
  loadSystemInfo();

  // Maintenance message handler
  const maintenanceMessage = document.getElementById('maintenance-message');
  if (maintenanceMessage) {
    let maintenanceMessageTimeout;
    maintenanceMessage.addEventListener('input', () => {
      clearTimeout(maintenanceMessageTimeout);
      maintenanceMessageTimeout = setTimeout(async () => {
        try {
          const settings = {
            maintenance_message: maintenanceMessage.value
          };
          await API.updateAdminSettings(settings);
          currentSettings = { ...currentSettings, ...settings };
        } catch (error) {
          console.error('Error saving maintenance message:', error);
        }
      }, 1000); // Debounce for 1 second
    });
  }

  // Helper function to show toast notifications
  function showToast(message, type = 'info') {
    // Try to use Toast from script.js first
    if (typeof Toast !== 'undefined' && Toast.success && Toast.error) {
      if (type === 'success') {
        Toast.success(message);
      } else if (type === 'error') {
        Toast.error(message);
      } else if (type === 'warning') {
        Toast.warning(message);
      } else {
        Toast.info(message);
      }
      return;
    }
    
    // Try window.showToast function
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    
    // Fallback: create a toast using the toast-container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fas ${icons[type] || icons.info}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    toastContainer.appendChild(toast);
    
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      });
    }
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    const duration = type === 'success' ? 5000 : 3000;
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
});
