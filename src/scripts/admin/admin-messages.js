/**
 * Admin Messages Page
 * Handles message display, filtering, and management
 */

document.addEventListener('DOMContentLoaded', () => {
  let allMessages = [];
  let filteredMessages = [];

  // Load messages on page load
  loadMessages();

  // Filter and search handlers
  const searchInput = document.getElementById('messages-search');
  const statusFilter = document.getElementById('messages-status-filter');
  const sortSelect = document.getElementById('messages-sort');
  const markAllReadBtn = document.getElementById('mark-all-read-btn');

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterAndRenderMessages();
      }, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', filterAndRenderMessages);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', filterAndRenderMessages);
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllMessagesRead);
  }

  /**
   * Load messages from API
   */
  async function loadMessages() {
    const messagesList = document.getElementById('messages-list');
    const messagesCount = document.getElementById('messages-count');

    try {
      // Show loading state
      if (messagesList) {
        messagesList.innerHTML = `
          <div class="text-center" style="padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--admin-text-secondary);"></i>
            <p style="margin-top: 1rem; color: var(--admin-text-secondary);">Loading messages...</p>
          </div>
        `;
      }

      // In production, we fetch from the API. 
      let messages = [];

      try {
        // Attempt to fetch real messages from API
        const data = await API.getAdminMessages();
        messages = data.messages || [];
      } catch (e) {
        console.warn('API getAdminMessages failed:', e.message);
        messages = []; // Default to empty if API fails
      }

      allMessages = Array.isArray(messages) ? messages : [];
      filteredMessages = [...allMessages];

      // Update count
      if (messagesCount) {
        messagesCount.textContent = `${allMessages.length} message${allMessages.length !== 1 ? 's' : ''}`;
      }

      // Render messages
      renderMessages();
    } catch (error) {
      console.error('Error loading messages:', error);
      if (messagesList) {
        messagesList.innerHTML = `
          <div class="text-center" style="padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; color: var(--admin-text-secondary);"></i>
            <p style="margin-top: 1rem; color: var(--admin-text-secondary);">Failed to load messages. Please try again.</p>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 1rem;">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        `;
      }
    }
  }

  /**
   * Filter and render messages
   */
  function filterAndRenderMessages() {
    const searchTerm = searchInput?.value.toLowerCase().trim() || '';
    const statusFilterValue = statusFilter?.value || 'all';
    const sortValue = sortSelect?.value || 'newest';

    // Filter messages
    filteredMessages = allMessages.filter(msg => {
      // Search filter
      const matchesSearch = !searchTerm ||
        msg.sender.toLowerCase().includes(searchTerm) ||
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.content.toLowerCase().includes(searchTerm);

      // Status filter
      const matchesStatus = statusFilterValue === 'all' ||
        (statusFilterValue === 'unread' && !msg.isRead) ||
        (statusFilterValue === 'read' && msg.isRead);

      return matchesSearch && matchesStatus;
    });

    // Sort messages
    filteredMessages.sort((a, b) => {
      if (sortValue === 'newest') {
        return b.timestamp - a.timestamp;
      } else if (sortValue === 'oldest') {
        return a.timestamp - b.timestamp;
      } else if (sortValue === 'sender') {
        return a.sender.localeCompare(b.sender);
      }
      return 0;
    });

    // Update count
    const messagesCount = document.getElementById('messages-count');
    if (messagesCount) {
      messagesCount.textContent = `${filteredMessages.length} message${filteredMessages.length !== 1 ? 's' : ''}`;
    }

    // Render
    renderMessages();
  }

  /**
   * Render messages to the UI
   */
  function renderMessages() {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;

    if (filteredMessages.length === 0) {
      messagesList.innerHTML = `
        <div class="text-center" style="padding: 3rem;">
          <i class="fas fa-inbox" style="font-size: 3rem; color: var(--admin-text-tertiary); margin-bottom: 1rem;"></i>
          <p style="color: var(--admin-text-secondary); font-size: 1.1rem;">No messages found</p>
          <p style="color: var(--admin-text-tertiary); font-size: 0.9rem; margin-top: 0.5rem;">Try adjusting your search or filters</p>
        </div>
      `;
      return;
    }

    messagesList.innerHTML = filteredMessages.map(msg => {
      const isUnread = !msg.isRead;
      const timeAgo = getTimeAgo(msg.timestamp);

      return `
        <div class="message-item ${isUnread ? 'unread' : ''}" data-message-id="${msg.id}">
          <div class="message-item-icon">
            <i class="fas fa-user"></i>
          </div>
          <div class="message-item-content">
            <div class="message-item-header">
              <div>
                <span class="message-sender">${msg.sender}</span>
                ${isUnread ? '<span class="message-unread-badge"></span>' : ''}
              </div>
              <span class="message-time">${timeAgo}</span>
            </div>
            <div class="message-subject">${msg.subject}</div>
            <div class="message-preview">${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}</div>
            <div class="message-email">${msg.email}</div>
          </div>
          <div class="message-item-actions">
            <button class="message-action-btn" onclick="markAsRead('${msg.id}')" title="Mark as read">
              <i class="fas fa-check"></i>
            </button>
            <button class="message-action-btn" onclick="replyToMessage('${msg.id}')" title="Reply">
              <i class="fas fa-reply"></i>
            </button>
            <button class="message-action-btn delete" onclick="deleteMessage('${msg.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Add click handler to mark as read
    messagesList.querySelectorAll('.message-item').forEach(item => {
      item.addEventListener('click', function (e) {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.message-item-actions')) {
          const messageId = this.getAttribute('data-message-id');
          if (messageId) {
            markAsRead(messageId);
          }
        }
      });
    });
  }

  /**
   * Mark a message as read
   */
  window.markAsRead = async function (id) {
    try {
      await API.updateMessageStatus(id, 'read');

      const message = allMessages.find(msg => msg.id === id);
      if (message) {
        message.status = 'read';
        message.isRead = true;
        filterAndRenderMessages(); // Re-filter and render to update UI
        updateUnreadBadge();
        showToast('Message marked as read', 'success');
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      showToast('Failed to mark message as read', 'error');
    }
  };

  /**
   * Reply to a message
   */
  window.replyToMessage = function (messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (message) {
      // Open email client or show reply modal
      window.location.href = `mailto:${message.email}?subject=Re: ${message.subject}`;

      showToast(`Opening email client to reply to ${message.sender}`, 'info');
    }
  };

  /**
   * Delete a message
   */
  window.deleteMessage = async function (id) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await API.deleteMessage(id);

      allMessages = allMessages.filter(msg => msg.id !== id);
      filterAndRenderMessages();
      updateUnreadBadge();
      showToast('Message deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message', 'error');
    }
  };

  /**
   * Mark all messages as read
   */
  async function markAllMessagesRead() {
    try {
      // In a real app, you'd have an API for this
      // For now, we'll mark them one by one if no bulk API exists
      const unreadMessages = allMessages.filter(m => m.status === 'unread');

      for (const msg of unreadMessages) {
        await API.updateMessageStatus(msg.id, 'read');
        msg.status = 'read';
        msg.isRead = true;
      }

      filterAndRenderMessages();
      updateUnreadBadge();
      showToast('All messages marked as read', 'success');
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      showToast('Failed to mark all messages as read', 'error');
    }
  }

  /**
   * Update messages badge in header
   */
  function updateUnreadBadge() {
    const unreadCount = allMessages.filter(m => m.status === 'unread' || !m.isRead).length;
    const messagesBadge = document.getElementById('admin-messages-badge');

    if (messagesBadge) {
      if (unreadCount > 0) {
        messagesBadge.textContent = unreadCount;
        messagesBadge.style.display = 'flex';
      } else {
        messagesBadge.style.display = 'none';
      }
    }
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') {
      Toast[type](message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Initial badge update
  updateUnreadBadge();
});







