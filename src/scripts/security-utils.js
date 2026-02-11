/**
 * Security Utilities for CourseCity
 * Provides XSS protection and input sanitization
 */

// HTML entity map for escaping
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML-safe text
 */
function escapeHtml(text) {
  if (text == null || text === undefined) {
    return '';
  }
  return String(text).replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize text for use in HTML attributes
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function escapeHtmlAttribute(text) {
  if (text == null || text === undefined) {
    return '';
  }
  return escapeHtml(text).replace(/\s+/g, ' ');
}

/**
 * Safely set innerHTML with escaped content
 * @param {HTMLElement} element - Element to set innerHTML on
 * @param {string} html - HTML string to set (will be escaped)
 */
function setSafeInnerHTML(element, html) {
  if (!element) return;
  element.innerHTML = escapeHtml(html);
}

/**
 * Safely create HTML from template with escaped values
 * @param {string} template - Template string with ${placeholders}
 * @param {Object} values - Values to escape and insert
 * @returns {string} - Safe HTML string
 */
function safeHtmlTemplate(template, values) {
  let result = template;
  for (const [key, value] of Object.entries(values || {})) {
    const escaped = escapeHtml(value);
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escaped);
  }
  return result;
}

/**
 * Validate and sanitize user input
 * @param {string} input - User input
 * @param {Object} options - Validation options
 * @returns {Object} - {valid: boolean, sanitized: string, error: string}
 */
function validateInput(input, options = {}) {
  const {
    maxLength = 1000,
    minLength = 0,
    allowHtml = false,
    trim = true,
    required = false
  } = options;

  if (input == null || input === undefined) {
    return {
      valid: !required,
      sanitized: '',
      error: required ? 'This field is required' : null
    };
  }

  let sanitized = String(input);
  if (trim) sanitized = sanitized.trim();

  if (required && sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'This field is required'
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, maxLength),
      error: `Input must be no more than ${maxLength} characters`
    };
  }

  if (sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `Input must be at least ${minLength} characters`
    };
  }

  if (!allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return {
    valid: true,
    sanitized,
    error: null
  };
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRe.test(email.trim());
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - {valid: boolean, strength: string, errors: string[]}
 */
function validatePassword(password) {
  const errors = [];
  let strength = 'weak';

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
    return { valid: false, strength: 'weak', errors };
  }

  if (password.length >= 12) strength = 'strong';
  else if (password.length >= 8) strength = 'medium';

  if (!/[A-Z]/.test(password)) {
    errors.push('Add uppercase letters for better security');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Add lowercase letters for better security');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Add numbers for better security');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Add special characters for better security');
  }

  return {
    valid: errors.length === 0 || password.length >= 6,
    strength,
    errors
  };
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.SecurityUtils = {
    escapeHtml,
    escapeHtmlAttribute,
    setSafeInnerHTML,
    safeHtmlTemplate,
    validateInput,
    validateEmail,
    validatePassword
  };
}

