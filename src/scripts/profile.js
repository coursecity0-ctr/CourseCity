// CourseCity Profile Page Script
// Handles profile editing, image upload, and display

'use strict';

let isEditMode = false;
let selectedImageFile = null;
let imagePreviewUrl = null;
let currentProfileData = null;

// Load profile data on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication - check multiple sources
  await checkAuthentication();
  
  // If authentication check passed, load profile data
  await loadProfileData();
  setupEventListeners();
});

// Check if user is authenticated
async function checkAuthentication() {
  // Initialize AppState if available and not yet initialized
  if (typeof AppState !== 'undefined') {
    if (typeof AppState.init === 'function' && !AppState.user) {
      // Try to initialize AppState
      AppState.init();
      // Give it a moment to load from storage
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  // Check localStorage and sessionStorage for user data
  const localStorageUser = localStorage.getItem('coursecity_user');
  const sessionStorageUser = sessionStorage.getItem('coursecity_user');
  
  // Also check AppState if available
  let appStateUser = null;
  if (typeof AppState !== 'undefined' && AppState.user) {
    appStateUser = AppState.user;
  }
  
  // Parse user from storage if not in AppState
  let parsedUser = null;
  if (!appStateUser && localStorageUser) {
    try {
      parsedUser = JSON.parse(localStorageUser);
    } catch (e) {
      console.error('Error parsing localStorage user:', e);
    }
  }
  if (!parsedUser && !appStateUser && sessionStorageUser) {
    try {
      parsedUser = JSON.parse(sessionStorageUser);
    } catch (e) {
      console.error('Error parsing sessionStorage user:', e);
    }
  }
  
  const hasUser = appStateUser || parsedUser || localStorageUser || sessionStorageUser;
  
  if (!hasUser) {
    // No user data found - redirect to login
    console.log('User not authenticated - redirecting to login');
    window.location.href = '../auth/login.html';
    return;
  }
  
  // If API is available, verify authentication with backend (but don't block if API fails)
  if (typeof API !== 'undefined') {
    try {
      const result = await API.getCurrentUser();
      if (result && result.user) {
        // User is authenticated - update AppState and storage
        if (typeof AppState !== 'undefined') {
          AppState.user = result.user;
          // Update storage based on Remember Me preference
          if (localStorageUser) {
            AppState.saveToStorage();
          } else if (sessionStorageUser) {
            sessionStorage.setItem('coursecity_user', JSON.stringify(result.user));
            // Keep other state in localStorage
            const tempCart = AppState.cart || [];
            const tempWishlist = AppState.wishlist || [];
            const tempTheme = AppState.theme || 'light';
            localStorage.setItem('coursecity_cart', JSON.stringify(tempCart));
            localStorage.setItem('coursecity_wishlist', JSON.stringify(tempWishlist));
            localStorage.setItem('coursecity_theme', tempTheme);
          }
        }
      } else {
        // Backend says user is not authenticated, but we have user data in storage
        // This might be a temporary API issue - allow access if we have local data
        console.log('Backend says not authenticated, but user data exists - allowing offline access');
      }
    } catch (error) {
      // API error - allow offline access if we have user data
      console.log('API unavailable or error, but user data exists - allowing offline access');
    }
  }
  
  // Authentication check passed
  console.log('User authenticated - allowing access to profile page');
}

// Load profile data
async function loadProfileData() {
  try {
    // Try API first
    if (typeof API !== 'undefined') {
      try {
        const result = await API.getProfile();
        if (result && result.user) {
          displayProfile(result.user);
          // Update AppState
          if (typeof AppState !== 'undefined') {
            AppState.user = result.user;
            AppState.saveToStorage();
          }
          return;
        }
      } catch (error) {
        console.log('API not available, using localStorage');
      }
    }

    // Fallback to localStorage
    const user = JSON.parse(localStorage.getItem('coursecity_user') || 'null');
    if (user) {
      displayProfile(user);
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    Toast.error('Failed to load profile data');
  }
}

// Display profile data
function displayProfile(user) {
  // Store current profile data
  currentProfileData = user;
  
  const avatarEl = document.getElementById('profile-avatar');
  const nameEl = document.getElementById('profile-name');
  const titleEl = document.getElementById('profile-title');
  const countryEl = document.getElementById('profile-country');
  const countryWrapperEl = document.getElementById('profile-country-wrapper');
  const emailEl = document.getElementById('profile-email');
  const emailDisplayEl = document.getElementById('profile-email-display');
  const fullNameInput = document.getElementById('profile-fullname-input');
  const emailInput = document.getElementById('profile-email-input');
  const memberSinceEl = document.getElementById('member-since-date');

  // Display avatar
  if (avatarEl) {
    updateAvatarDisplay(avatarEl, user);
    // Ensure large size for header avatar
    if (avatarEl.classList.contains('profile-avatar-huge')) {
      avatarEl.style.width = '180px';
      avatarEl.style.height = '180px';
      avatarEl.style.fontSize = '4.5rem';
    }
  }

  // Update preview avatar in edit mode
  const previewAvatar = document.getElementById('avatar-preview');
  if (previewAvatar) {
    updateAvatarDisplay(previewAvatar, user);
  }

  // Display name
  const displayName = user.full_name || user.name || 'User';
  if (nameEl) nameEl.textContent = displayName;
  if (fullNameInput) fullNameInput.value = displayName;

  // Display user title/role
  // Priority: user.role > user.user_role > user.title > default "Student"
  const userRole = user.role || user.user_role || user.title || 'Student';
  if (titleEl) {
    // Capitalize first letter and format
    const formattedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).replace(/_/g, ' ');
    titleEl.textContent = formattedRole;
  }

  // Display country with flag
  const userCountry = user.country || '';
  const flagEl = document.getElementById('profile-flag');
  
  if (countryEl && countryWrapperEl) {
    if (userCountry) {
      countryEl.textContent = userCountry;
      countryWrapperEl.style.display = 'inline-flex';
      
      // Set country flag emoji
      if (flagEl) {
        flagEl.textContent = getCountryFlag(userCountry);
      }
    } else {
      // Hide separator and country if no country data
      countryWrapperEl.style.display = 'none';
      const separator = document.querySelector('.profile-header-title-separator');
      if (separator) separator.style.display = 'none';
    }
  }
  
  // Also update legacy country display if exists
  const legacyCountryEl = document.getElementById('profile-country');
  if (legacyCountryEl && userCountry) {
    legacyCountryEl.textContent = userCountry;
  }

  // Display email (if email element exists in header)
  if (emailEl) {
    emailEl.textContent = user.email || 'user@example.com';
  }
  if (emailDisplayEl) emailDisplayEl.textContent = user.email || 'user@example.com';
  if (emailInput) {
    emailInput.value = user.email || '';
    // Make email readonly if from OAuth
    emailInput.readOnly = user.auth_provider !== 'local';
  }

  // Display member since
  if (memberSinceEl && user.created_at) {
    const date = new Date(user.created_at);
    memberSinceEl.textContent = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }
}

// Update avatar display (supports both image and initials)
function updateAvatarDisplay(element, user) {
  if (!element || !user) return;
  
  const imageUrl = user.profile_image || user.avatar;
  const name = user.full_name || user.name || user.email || 'User';
  
  // Clear existing content
  element.innerHTML = '';
  
  if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
    // Display image
    const img = document.createElement('img');
    // Handle relative URLs from backend
    if (imageUrl.startsWith('/')) {
      const hostname = window.location.hostname;
      const port = hostname === 'localhost' || hostname === '127.0.0.1' ? ':5000' : '';
      img.src = `http://${hostname}${port}${imageUrl}`;
    } else {
      img.src = imageUrl;
    }
    img.alt = name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    
    // Fallback to initials if image fails to load
    img.onerror = () => {
      displayInitials(element, user);
    };
    
    element.appendChild(img);
  } else {
    // Display initials
    displayInitials(element, user);
  }
}

// Display initials fallback
function displayInitials(element, user) {
  const name = user.full_name || user.name || user.email || 'User';
  const initials = getInitials(name);
  element.textContent = initials;
}

// Get initials from name
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Get country flag emoji based on country name
function getCountryFlag(countryName) {
  if (!countryName) return '';
  
  // Country name to flag emoji mapping
  const countryFlags = {
    'ghana': '🇬🇭',
    'nigeria': '🇳🇬',
    'kenya': '🇰🇪',
    'south africa': '🇿🇦',
    'egypt': '🇪🇬',
    'morocco': '🇲🇦',
    'tunisia': '🇹🇳',
    'algeria': '🇩🇿',
    'ethiopia': '🇪🇹',
    'tanzania': '🇹🇿',
    'uganda': '🇺🇬',
    'cameroon': '🇨🇲',
    'ivory coast': '🇨🇮',
    'senegal': '🇸🇳',
    'zimbabwe': '🇿🇼',
    'malawi': '🇲🇼',
    'zambia': '🇿🇲',
    'mozambique': '🇲🇿',
    'madagascar': '🇲🇬',
    'angola': '🇦🇴',
    'united states': '🇺🇸',
    'usa': '🇺🇸',
    'united kingdom': '🇬🇧',
    'uk': '🇬🇧',
    'canada': '🇨🇦',
    'australia': '🇦🇺',
    'india': '🇮🇳',
    'china': '🇨🇳',
    'japan': '🇯🇵',
    'south korea': '🇰🇷',
    'france': '🇫🇷',
    'germany': '🇩🇪',
    'italy': '🇮🇹',
    'spain': '🇪🇸',
    'brazil': '🇧🇷',
    'mexico': '🇲🇽',
    'argentina': '🇦🇷'
  };
  
  // Try to match country name (case insensitive)
  const countryKey = countryName.toLowerCase().trim();
  
  // Direct match
  if (countryFlags[countryKey]) {
    return countryFlags[countryKey];
  }
  
  // Partial match (e.g., "United States of America" -> "United States")
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (countryKey.includes(key) || key.includes(countryKey)) {
      return flag;
    }
  }
  
  // If no match found, return a generic globe emoji
  return '🌍';
}

// Share profile functionality
function shareProfile() {
  try {
    const profileUrl = window.location.href;
    
    // Check if Web Share API is available (mobile browsers)
    if (navigator.share) {
      navigator.share({
        title: `${currentProfileData?.full_name || 'My'} - CourseCity Profile`,
        text: `Check out my profile on CourseCity!`,
        url: profileUrl
      }).catch((error) => {
        console.log('Share cancelled or error:', error);
        // Fallback to copy
        copyProfileLink(profileUrl);
      });
    } else {
      // Fallback: Copy to clipboard
      copyProfileLink(profileUrl);
    }
  } catch (error) {
    console.error('Share error:', error);
    // Fallback to copy
    copyProfileLink(window.location.href);
  }
}

// Copy profile link to clipboard
function copyProfileLink(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      if (typeof Toast !== 'undefined') {
        Toast.success('Profile link copied to clipboard!');
      } else {
        alert('Profile link copied to clipboard!');
      }
    }).catch((error) => {
      console.error('Failed to copy:', error);
      // Fallback method
      fallbackCopyTextToClipboard(url);
    });
  } else {
    fallbackCopyTextToClipboard(url);
  }
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      if (typeof Toast !== 'undefined') {
        Toast.success('Profile link copied to clipboard!');
      } else {
        alert('Profile link copied to clipboard!');
      }
    } else {
      if (typeof Toast !== 'undefined') {
        Toast.error('Failed to copy link. Please copy manually.');
      } else {
        alert('Please copy this link manually: ' + text);
      }
    }
  } catch (error) {
    console.error('Fallback copy failed:', error);
    if (typeof Toast !== 'undefined') {
      Toast.error('Failed to copy link. Please copy manually.');
    } else {
      alert('Please copy this link manually: ' + text);
    }
  }
  
  document.body.removeChild(textArea);
}

// Setup event listeners
function setupEventListeners() {
  const editBtn = document.getElementById('edit-profile-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const saveBtn = document.getElementById('save-profile-btn');
  const avatarUploadInput = document.getElementById('avatar-upload-input');
  const avatarUploadBtn = document.getElementById('upload-avatar-btn');
  const removeAvatarBtn = document.getElementById('remove-avatar-btn');
  const avatarPreview = document.getElementById('avatar-preview');

  // Edit mode toggle
  const editProfileBtn = document.getElementById('edit-profile-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      toggleEditMode(true);
    });
  }

  // Share profile button
  const shareProfileBtn = document.getElementById('share-profile-btn');
  if (shareProfileBtn) {
    shareProfileBtn.addEventListener('click', () => {
      shareProfile();
    });
  }

  // Old edit button (if exists)
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      toggleEditMode(true);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      toggleEditMode(false);
      // Reset form
      loadProfileData();
      resetImageSelection();
    });
  }

  // Save profile
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSaveProfile);
  }

  // Avatar upload
  if (avatarUploadInput) {
    avatarUploadInput.addEventListener('change', handleImageSelect);
  }

  if (avatarUploadBtn) {
    avatarUploadBtn.addEventListener('click', handleUploadAvatar);
  }

  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', handleRemoveAvatar);
  }

  // Delete account button
  const deleteAccountBtn = document.getElementById('delete-account-profile-btn');
  const deleteModal = document.getElementById('delete-account-modal');
  const closeDeleteModal = document.getElementById('close-delete-modal');
  const cancelDeleteBtn = document.getElementById('cancel-delete-account-btn');
  const deleteAccountForm = document.getElementById('delete-account-form');
  const deleteErrorDiv = document.getElementById('delete-account-error');
  const deletePasswordGroup = document.getElementById('delete-password-group');
  const deletePasswordInput = document.getElementById('delete-account-password');
  const deleteConfirmationInput = document.getElementById('delete-account-confirmation');
  const confirmDeleteBtn = document.getElementById('confirm-delete-account-btn');
  
  if (deleteAccountBtn && deleteModal) {
    // Open modal when delete button is clicked
    deleteAccountBtn.addEventListener('click', () => {
      // Check if user is logged in via OAuth (no password needed)
      // Use currentProfileData first, then fall back to AppState or storage
      let user = currentProfileData;
      if (!user && typeof AppState !== 'undefined' && AppState.user) {
        user = AppState.user;
      }
      if (!user) {
        user = JSON.parse(localStorage.getItem('coursecity_user') || sessionStorage.getItem('coursecity_user') || 'null');
      }
      
      if (user && user.auth_provider && user.auth_provider !== 'local') {
        // OAuth user - hide password field
        if (deletePasswordGroup) {
          deletePasswordGroup.style.display = 'none';
        }
        if (deletePasswordInput) {
          deletePasswordInput.removeAttribute('required');
        }
      } else {
        // Local account - show password field
        if (deletePasswordGroup) {
          deletePasswordGroup.style.display = 'block';
        }
        if (deletePasswordInput) {
          deletePasswordInput.setAttribute('required', 'required');
        }
      }
      
      // Clear form and errors
      if (deleteAccountForm) {
        deleteAccountForm.reset();
      }
      if (deleteErrorDiv) {
        deleteErrorDiv.style.display = 'none';
        deleteErrorDiv.textContent = '';
      }
      
      // Show modal
      deleteModal.style.display = 'flex';
    });
    
    // Close modal handlers
    const closeModal = () => {
      deleteModal.style.display = 'none';
      if (deleteAccountForm) {
        deleteAccountForm.reset();
      }
      if (deleteErrorDiv) {
        deleteErrorDiv.style.display = 'none';
        deleteErrorDiv.textContent = '';
      }
    };
    
    if (closeDeleteModal) {
      closeDeleteModal.addEventListener('click', closeModal);
    }
    
    if (cancelDeleteBtn) {
      cancelDeleteBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) {
        closeModal();
      }
    });
    
    // Handle form submission
    if (deleteAccountForm) {
      deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Hide error message
        if (deleteErrorDiv) {
          deleteErrorDiv.style.display = 'none';
        }
        
        // Get form values
        const password = deletePasswordInput ? deletePasswordInput.value : '';
        const confirmation = deleteConfirmationInput ? deleteConfirmationInput.value.trim() : '';
        
        // Validate confirmation
        if (confirmation.toLowerCase() !== 'delete') {
          if (deleteErrorDiv) {
            deleteErrorDiv.textContent = 'Please type "DELETE" exactly to confirm';
            deleteErrorDiv.style.display = 'block';
          }
          return;
        }
        
        // Disable submit button
        if (confirmDeleteBtn) {
          confirmDeleteBtn.disabled = true;
          confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
        }
        
        try {
          // Check if API is available
          if (typeof API === 'undefined') {
            throw new Error('API is not available. Please refresh the page.');
          }
          
          // Call delete account API
          const response = await API.deleteAccount(password, confirmation);
          
          if (response && response.success) {
            // Account deleted successfully
            // Clear all local data
            localStorage.clear();
            sessionStorage.clear();
            
            // Show success message
            if (typeof Toast !== 'undefined') {
              Toast.success('Your account has been deleted successfully.');
            } else {
              alert('Your account has been deleted successfully.');
            }
            
            // Redirect to homepage after short delay
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 1500);
          } else {
            throw new Error(response?.error || response?.message || 'Failed to delete account');
          }
        } catch (error) {
          // Show error message
          if (deleteErrorDiv) {
            deleteErrorDiv.textContent = error.message || 'Failed to delete account. Please try again.';
            deleteErrorDiv.style.display = 'block';
          }
          
          // Re-enable submit button
          if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Account';
          }
        }
      });
    }
  }
}

// Toggle edit mode
function toggleEditMode(enabled) {
  isEditMode = enabled;
  const viewMode = document.getElementById('profile-view-mode');
  const editMode = document.getElementById('profile-edit-mode');
  const editBtn = document.getElementById('edit-profile-btn');
  const shareBtn = document.getElementById('share-profile-btn');

  if (viewMode) viewMode.style.display = enabled ? 'none' : 'block';
  if (editMode) editMode.style.display = enabled ? 'block' : 'none';
  // Hide action buttons in edit mode
  if (editBtn) editBtn.style.display = enabled ? 'none' : 'inline-flex';
  if (shareBtn) shareBtn.style.display = enabled ? 'none' : 'inline-flex';
}

// Handle image selection
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    Toast.error('Please select an image file');
    return;
  }

  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    Toast.error('Image size must be less than 2MB');
    return;
  }

  selectedImageFile = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreviewUrl = e.target.result;
    const avatarPreview = document.getElementById('avatar-preview');
    const previewImg = document.getElementById('preview-avatar-img');
    
    if (previewImg) {
      previewImg.src = imagePreviewUrl;
      previewImg.style.display = 'block';
    } else if (avatarPreview) {
      avatarPreview.innerHTML = `<img id="preview-avatar-img" src="${imagePreviewUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
  };
  reader.readAsDataURL(file);
}

// Reset image selection
function resetImageSelection() {
  selectedImageFile = null;
  imagePreviewUrl = null;
  const avatarUploadInput = document.getElementById('avatar-upload-input');
  const previewImg = document.getElementById('preview-avatar-img');
  if (avatarUploadInput) avatarUploadInput.value = '';
  if (previewImg) {
    previewImg.style.display = 'none';
    previewImg.src = '';
  }
}

// Handle avatar upload
async function handleUploadAvatar() {
  if (!selectedImageFile) {
    Toast.warning('Please select an image first');
    return;
  }

  const uploadBtn = document.getElementById('upload-avatar-btn');
  const originalText = uploadBtn.innerHTML;
  
  try {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    if (typeof API !== 'undefined') {
      const result = await API.uploadProfileImage(selectedImageFile);
      
      console.log('Upload result:', result);
      
      if (result && result.success && result.user) {
        Toast.success(result.message || 'Profile picture uploaded successfully');
        
        console.log('Profile image URL:', result.user.profile_image);
        
        // Update current profile data
        currentProfileData = result.user;
        
        // Display updated profile
        displayProfile(result.user);
        
        // Update AppState
        if (typeof AppState !== 'undefined') {
          AppState.user = { ...AppState.user, ...result.user };
          AppState.saveToStorage();
          
          // Update header avatar directly - check all pages
          const headerAvatar = document.getElementById('user-avatar');
          if (headerAvatar) {
            if (typeof updateAvatarDisplay === 'function') {
              updateAvatarDisplay(headerAvatar, result.user);
            } else {
              // Fallback: directly update avatar
              const imageUrl = result.user.profile_image || result.user.avatar;
              console.log('Updating header avatar with URL:', imageUrl);
              if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
                headerAvatar.innerHTML = '';
                const img = document.createElement('img');
                if (imageUrl.startsWith('/')) {
                  const hostname = window.location.hostname;
                  const port = hostname === 'localhost' || hostname === '127.0.0.1' ? ':5000' : '';
                  img.src = `http://${hostname}${port}${imageUrl}`;
                  console.log('Setting image src to:', img.src);
                } else {
                  img.src = imageUrl;
                }
                img.alt = result.user.full_name || result.user.name || 'User';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                img.onerror = () => {
                  console.error('Failed to load avatar image:', img.src);
                  const name = result.user.full_name || result.user.name || result.user.email || 'User';
                  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  headerAvatar.textContent = initials;
                };
                img.onload = () => {
                  console.log('Avatar image loaded successfully');
                };
                headerAvatar.appendChild(img);
              } else {
                // Fallback to initials
                const name = result.user.full_name || result.user.name || result.user.email || 'User';
                const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                headerAvatar.textContent = initials;
              }
            }
          }
          
          // Also trigger updateAuthUI if available (for other pages)
          if (typeof updateAuthUI === 'function') {
            updateAuthUI();
          }
        }
        
        resetImageSelection();
      } else {
        console.error('Upload failed - result:', result);
        Toast.error(result?.error || 'Failed to upload profile picture');
      }
    } else {
      Toast.error('API not available');
    }
  } catch (error) {
    console.error('Upload error:', error);
    Toast.error(error.message || 'Failed to upload image');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalText;
  }
}

// Handle remove avatar
async function handleRemoveAvatar() {
  if (!confirm('Are you sure you want to remove your profile picture?')) {
    return;
  }

  const removeBtn = document.getElementById('remove-avatar-btn');
  const originalText = removeBtn.innerHTML;
  
  try {
    removeBtn.disabled = true;
    removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing...';

    if (typeof API !== 'undefined') {
      const result = await API.deleteProfileImage();
      
      if (result && result.user) {
        Toast.success('Profile picture removed successfully');
        displayProfile(result.user);
        
        // Update AppState
        if (typeof AppState !== 'undefined') {
          AppState.user = result.user;
          AppState.saveToStorage();
          // Update header avatar
          if (typeof updateAuthUI === 'function') {
            updateAuthUI();
          }
        }
        
        resetImageSelection();
      }
    } else {
      Toast.error('API not available');
    }
  } catch (error) {
    console.error('Remove error:', error);
    Toast.error(error.message || 'Failed to remove image');
  } finally {
    removeBtn.disabled = false;
    removeBtn.innerHTML = originalText;
  }
}

// Handle save profile
async function handleSaveProfile() {
  const fullNameInput = document.getElementById('profile-fullname-input');
  const emailInput = document.getElementById('profile-email-input');
  const saveBtn = document.getElementById('save-profile-btn');
  const originalText = saveBtn.innerHTML;

  const profileData = {
    full_name: fullNameInput ? fullNameInput.value.trim() : null,
    email: emailInput && !emailInput.readOnly ? emailInput.value.trim() : undefined
  };

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    if (typeof API !== 'undefined') {
      const result = await API.updateProfile(profileData);
      
      if (result && result.user) {
        Toast.success('Profile updated successfully');
        displayProfile(result.user);
        
        // Update AppState
        if (typeof AppState !== 'undefined') {
          AppState.user = result.user;
          AppState.saveToStorage();
          // Update header avatar
          if (typeof updateAuthUI === 'function') {
            updateAuthUI();
          }
        }
        
        toggleEditMode(false);
      }
    } else {
      // Fallback to localStorage
      const user = JSON.parse(localStorage.getItem('coursecity_user') || 'null');
      if (user) {
        if (profileData.full_name) user.full_name = profileData.full_name;
        if (profileData.email) user.email = profileData.email;
        localStorage.setItem('coursecity_user', JSON.stringify(user));
        displayProfile(user);
        Toast.success('Profile updated (local storage only)');
        toggleEditMode(false);
      }
    }
  } catch (error) {
    console.error('Save error:', error);
    Toast.error(error.message || 'Failed to update profile');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

