// Admin Profile Page Handler
document.addEventListener('DOMContentLoaded', () => {
  let currentProfile = {};

  // Load profile on page load
  loadProfile();

  // Profile Form
  const profileForm = document.getElementById('profile-form');
  const saveProfileBtn = profileForm ? profileForm.querySelector('button[type="submit"]') : null;

  if (profileForm && saveProfileBtn) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const fullName = document.getElementById('profile-fullname')?.value.trim() || '';
      const phone = document.getElementById('profile-phone')?.value.trim() || '';
      const bio = document.getElementById('profile-bio')?.value.trim() || '';

      // Validation - only validate required fields
      if (!fullName) {
        showToast('Please enter your full name', 'error');
        document.getElementById('profile-fullname')?.focus();
        return;
      }

      // Note: Email is read-only and managed separately, so we don't validate or update it here

      // Save original button state
      const originalText = saveProfileBtn.innerHTML;
      const originalDisabled = saveProfileBtn.disabled;

      try {
        // Update button to loading state
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Changes...';
        saveProfileBtn.style.opacity = '0.7';
        saveProfileBtn.style.cursor = 'not-allowed';

        // Prepare form data (exclude email as it's disabled and managed separately)
        const formData = {
          full_name: fullName,
          phone: phone || null,
          bio: bio || null
        };

        // Note: Email is not included as it's typically managed separately
        // and the field is disabled in the form

        // Call API to update profile
        const response = await API.updateAdminProfile(formData);

        if (response.success && response.user) {
          // Update current profile
          currentProfile = response.user;

          // Update localStorage FIRST (for persistence)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('admin_user', JSON.stringify(response.user));
          }

          // Update session storage with timestamp
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('admin_user', JSON.stringify(response.user));
            sessionStorage.setItem('admin_user_updated', Date.now().toString());
          }

          // Update header display
          updateProfileDisplay();

          // Dispatch custom events for cross-page updates
          window.dispatchEvent(new CustomEvent('adminUserUpdated', {
            detail: { user: response.user }
          }));

          window.dispatchEvent(new CustomEvent('storageChange', {
            detail: { key: 'admin_user', newValue: JSON.stringify(response.user) }
          }));

          // Call updateUserInfo() directly
          if (typeof window.updateUserInfo === 'function') {
            window.updateUserInfo();
          }

          // Dispatch again after delays to catch any pages that might have missed it
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('adminUserUpdated', {
              detail: { user: response.user }
            }));
            window.dispatchEvent(new CustomEvent('storageChange', {
              detail: { key: 'admin_user', newValue: JSON.stringify(response.user) }
            }));
            if (typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 100);

          setTimeout(() => {
            if (typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 500);

          // Show success confirmation message
          showToast('✓ Profile changes saved successfully! Your updates have been applied.', 'success');

          // Update button to show success state briefly
          saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
          saveProfileBtn.style.backgroundColor = '#28a745';
          saveProfileBtn.style.borderColor = '#28a745';

          // Reset button after 2 seconds
          setTimeout(() => {
            saveProfileBtn.innerHTML = originalText;
            saveProfileBtn.style.backgroundColor = '';
            saveProfileBtn.style.borderColor = '';
            saveProfileBtn.disabled = false;
            saveProfileBtn.style.opacity = '1';
            saveProfileBtn.style.cursor = 'pointer';
          }, 2000);

        } else {
          throw new Error(response.error || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Profile update error:', error);

        // Show error message
        showToast(`Failed to save changes: ${error.message || 'An error occurred. Please try again.'}`, 'error');

        // Reset button to original state
        saveProfileBtn.disabled = originalDisabled;
        saveProfileBtn.innerHTML = originalText;
        saveProfileBtn.style.opacity = '1';
        saveProfileBtn.style.cursor = 'pointer';
      }
    });
  }

  // Profile Avatar Upload
  const avatarUpload = document.getElementById('profile-avatar-upload');
  const avatarPreview = document.getElementById('profile-avatar-preview');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');

  // Get API_BASE_URL for file uploads
  const getAPIBaseURL = () => {
    const isProduction = typeof window !== 'undefined' &&
      window.location &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1');
    return isProduction
      ? (window.API_BASE_URL || window.location.origin)
      : `http://${window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:5000`;
  };

  // Avatar upload handler
  if (avatarUpload) {
    avatarUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        avatarUpload.value = '';
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        avatarUpload.value = '';
        return;
      }

      // Show loading state
      const originalPreview = avatarPreview.innerHTML;
      avatarPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      avatarUpload.disabled = true;

      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await fetch(`${getAPIBaseURL()}/api/profile/avatar`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        if (data.success && data.user) {
          // Update current profile
          currentProfile = data.user;

          // Construct image URL
          let imageUrl;
          if (data.user.profile_image) {
            if (data.user.profile_image.startsWith('http')) {
              imageUrl = data.user.profile_image;
            } else {
              // Handle relative path
              const imagePath = data.user.profile_image.startsWith('/')
                ? data.user.profile_image
                : `/uploads/profile-images/${data.user.profile_image}`;
              imageUrl = `${getAPIBaseURL()}${imagePath}`;
            }

            // Update preview with image
            avatarPreview.innerHTML = `<img src="${imageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
          } else {
            avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
          }

          // Update session storage FIRST for cross-page consistency
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('admin_user', JSON.stringify(data.user));
          }

          // Also update localStorage for persistence
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('admin_user', JSON.stringify(data.user));
          }

          // Update current profile object
          currentProfile = data.user;

          // Update localStorage FIRST (for persistence across sessions)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('admin_user', JSON.stringify(data.user));
          }

          // Update session storage - this persists across page navigations
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('admin_user', JSON.stringify(data.user));
            // Set a timestamp to indicate when the profile was last updated
            sessionStorage.setItem('admin_user_updated', Date.now().toString());
          }

          // Update header avatar on current page immediately
          updateProfileDisplay();

          // IMPORTANT: Dispatch custom event IMMEDIATELY - listeners are set up early
          window.dispatchEvent(new CustomEvent('adminUserUpdated', {
            detail: { user: data.user }
          }));

          // Also dispatch storageChange event for the custom setItem override
          window.dispatchEvent(new CustomEvent('storageChange', {
            detail: { key: 'admin_user', newValue: JSON.stringify(data.user) }
          }));

          // Also call updateUserInfo() directly as a fallback
          if (typeof window.updateUserInfo === 'function') {
            window.updateUserInfo();
          }

          // Use multiple attempts to ensure all pages receive the update
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('adminUserUpdated', {
              detail: { user: data.user }
            }));
            window.dispatchEvent(new CustomEvent('storageChange', {
              detail: { key: 'admin_user', newValue: JSON.stringify(data.user) }
            }));
            if (typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 100);

          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('adminUserUpdated', {
              detail: { user: data.user }
            }));
            if (typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 500);

          // Reload profile to get latest data
          await loadProfile();

          showToast('Profile picture updated successfully!', 'success');
        } else {
          throw new Error(data.error || 'Failed to upload image');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        avatarPreview.innerHTML = originalPreview;
        showToast(error.message || 'Failed to upload image', 'error');
      } finally {
        avatarUpload.disabled = false;
        avatarUpload.value = '';
      }
    });
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', async () => {
      try {
        const response = await API.request('/profile/avatar', { method: 'DELETE' });
        if (response.success) {
          avatarPreview.innerHTML = '<i class="fas fa-user"></i>';

          // Update profile to remove image
          if (currentProfile) {
            currentProfile.profile_image = null;
          }

          // Update localStorage FIRST
          if (typeof localStorage !== 'undefined' && currentProfile) {
            localStorage.setItem('admin_user', JSON.stringify(currentProfile));
          }

          // Update session storage with timestamp
          if (typeof sessionStorage !== 'undefined' && currentProfile) {
            sessionStorage.setItem('admin_user', JSON.stringify(currentProfile));
            sessionStorage.setItem('admin_user_updated', Date.now().toString());
          }

          // Update display
          updateProfileDisplay();

          // Dispatch custom event IMMEDIATELY
          if (currentProfile) {
            window.dispatchEvent(new CustomEvent('adminUserUpdated', {
              detail: { user: currentProfile }
            }));
          }

          // Also dispatch storageChange event
          if (currentProfile) {
            window.dispatchEvent(new CustomEvent('storageChange', {
              detail: { key: 'admin_user', newValue: JSON.stringify(currentProfile) }
            }));
          }

          // Also call updateUserInfo() directly
          if (typeof window.updateUserInfo === 'function') {
            window.updateUserInfo();
          }

          // Dispatch again after delays to catch any pages that might have missed it
          setTimeout(() => {
            if (currentProfile) {
              window.dispatchEvent(new CustomEvent('adminUserUpdated', {
                detail: { user: currentProfile }
              }));
              window.dispatchEvent(new CustomEvent('storageChange', {
                detail: { key: 'admin_user', newValue: JSON.stringify(currentProfile) }
              }));
            }
            if (typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 100);

          setTimeout(() => {
            if (currentProfile && typeof window.updateUserInfo === 'function') {
              window.updateUserInfo();
            }
          }, 500);

          showToast('Profile picture removed successfully!', 'success');
          loadProfile();
        }
      } catch (error) {
        showToast(error.message || 'Failed to remove image', 'error');
      }
    });
  }

  // Load Profile Function
  async function loadProfile() {
    try {
      const response = await API.getAdminProfile();
      if (response.success && response.user) {
        currentProfile = response.user;
        updateProfileForm(response.user);
        updateProfileDisplay();

        // Also update session storage for other pages
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('admin_user', JSON.stringify(response.user));
          // Don't update timestamp on load - only on actual changes
        }

        // Also update localStorage for persistence
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('admin_user', JSON.stringify(response.user));
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (currentProfile && Object.keys(currentProfile).length > 0) {
        showToast('Failed to refresh profile', 'error');
      }
    }
  }

  // Initialize the last update time for polling
  let lastKnownUpdateTime = sessionStorage.getItem('admin_user_updated') || '0';

  // Poll for profile updates every 500ms (fallback mechanism)
  setInterval(() => {
    const currentUpdateTime = sessionStorage.getItem('admin_user_updated') || '0';
    if (currentUpdateTime !== lastKnownUpdateTime) {
      lastKnownUpdateTime = currentUpdateTime;
      // Profile was updated, reload it
      loadProfile();
    }
  }, 500);

  // Listen for storage changes from other tabs/pages
  window.addEventListener('storage', (e) => {
    if (e.key === 'admin_user' && e.newValue) {
      try {
        const updatedUser = JSON.parse(e.newValue);
        currentProfile = updatedUser;
        updateProfileForm(updatedUser);
        updateProfileDisplay();
      } catch (error) {
        console.error('Error parsing storage event:', error);
      }
    }
  });

  // Also listen for custom storage events (for same-tab updates)
  // This is important for the profile page itself
  window.addEventListener('adminUserUpdated', (e) => {
    if (e.detail && e.detail.user) {
      currentProfile = e.detail.user;
      updateProfileForm(e.detail.user);
      updateProfileDisplay();
    }
  });

  // Also set up a flag in sessionStorage to trigger updates on other pages
  // This works even if events don't propagate
  const originalSetItem = sessionStorage.setItem;
  sessionStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'admin_user') {
      // Trigger a custom event that other pages can listen to
      window.dispatchEvent(new CustomEvent('storageChange', {
        detail: { key, newValue: value }
      }));
    }
  };

  // Update Profile Form
  function updateProfileForm(profile) {
    if (document.getElementById('profile-fullname')) {
      document.getElementById('profile-fullname').value = profile.full_name || '';
    }
    if (document.getElementById('profile-email')) {
      document.getElementById('profile-email').value = profile.email || '';
    }
    if (document.getElementById('profile-phone')) {
      document.getElementById('profile-phone').value = profile.phone || '';
    }
    if (document.getElementById('profile-bio')) {
      document.getElementById('profile-bio').value = profile.bio || '';
    }

    // Update avatar preview
    if (avatarPreview) {
      if (profile.profile_image) {
        // Construct full image URL
        let imageUrl = profile.profile_image;
        if (!imageUrl.startsWith('http')) {
          // Handle relative path
          const imagePath = imageUrl.startsWith('/')
            ? imageUrl
            : `/uploads/profile-images/${imageUrl}`;
          imageUrl = `${getAPIBaseURL()}${imagePath}`;
        }
        avatarPreview.innerHTML = `<img src="${imageUrl}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
      }
    }
  }

  // Update Profile Display in Header
  function updateProfileDisplay() {
    // Update header name
    if (currentProfile.full_name && document.getElementById('header-user-name')) {
      document.getElementById('header-user-name').textContent = currentProfile.full_name;
    }

    // Update header avatar - use the same logic as admin-header.js
    const headerAvatar = document.getElementById('header-user-avatar');
    if (headerAvatar) {
      if (currentProfile.profile_image) {
        // Construct full image URL using the same method as updateUserInfo()
        let imageUrl = currentProfile.profile_image;
        if (!imageUrl.startsWith('http')) {
          // Get API base URL (same logic as admin-header.js)
          const isProduction = typeof window !== 'undefined' &&
            window.location &&
            !window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1');
          const apiBase = isProduction
            ? (window.API_BASE_URL || window.location.origin)
            : `http://${window.location.hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:5000`;

          const imagePath = imageUrl.startsWith('/')
            ? imageUrl
            : `/uploads/profile-images/${imageUrl}`;
          imageUrl = `${apiBase}${imagePath}`;
        }

        // Update avatar with image
        headerAvatar.textContent = '';
        headerAvatar.style.backgroundImage = `url(${imageUrl})`;
        headerAvatar.style.backgroundSize = 'cover';
        headerAvatar.style.backgroundPosition = 'center';
        headerAvatar.style.backgroundRepeat = 'no-repeat';
      } else if (currentProfile.full_name) {
        // Fallback to initials if no image
        const initials = currentProfile.full_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2);
        headerAvatar.textContent = initials;
        headerAvatar.style.backgroundImage = '';
        headerAvatar.style.backgroundSize = '';
        headerAvatar.style.backgroundPosition = '';
        headerAvatar.style.backgroundRepeat = '';
      }
    }

    // Also trigger the header's updateUserInfo function if it exists
    // Use window.updateUserInfo to access the global function from admin-header.js
    if (typeof window.updateUserInfo === 'function') {
      window.updateUserInfo();
    }
  }

  // Helper function to show toast notifications
  function showToast(message, type = 'info') {
    // Try to use Toast from script.js first (if available)
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
      // Create container if it doesn't exist
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Add icon based on type
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

    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      });
    }

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after duration (longer for success messages)
    const duration = type === 'success' ? 5000 : 3000;
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
});

