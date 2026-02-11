// Contact Page Script
// Form validation and submission

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('.contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      const topic = document.getElementById('topic')?.value;
      const message = document.getElementById('message')?.value.trim();
      const consent = document.querySelector('input[name="consent"]')?.checked;

      // Validate
      if (!name) {
        showError('Please enter your name');
        return;
      }

      if (!email || !validateEmail(email)) {
        showError('Please enter a valid email address');
        return;
      }

      if (!topic) {
        showError('Please select a topic');
        return;
      }

      if (!message) {
        showError('Please enter your message');
        return;
      }

      if (!consent) {
        showError('Please accept the privacy policy');
        return;
      }

      // Show loading state
      const submitBtn = contactForm.querySelector('.btn');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';

      // Real API call
      try {
        const formData = {
          name,
          email,
          phone,
          subject: topic, // topic maps to subject in backend
          message
        };

        const response = await API.submitContactForm(formData);

        if (response.success) {
          // Reset form
          contactForm.reset();

          // Show success message
          if (typeof Toast !== 'undefined') {
            Toast.success(response.message || 'Message sent successfully! We\'ll get back to you soon.');
          } else {
            alert(response.message || 'Message sent successfully! We\'ll get back to you soon.');
          }
        }
      } catch (error) {
        console.error('Error submitting contact form:', error);
        showError(error.message || 'Failed to send message. Please try again later.');
      } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showError(message) {
    if (typeof Toast !== 'undefined') {
      Toast.error(message);
    } else {
      alert(message);
    }
  }

  console.log('%cContact Page Loaded', 'color: #ff7a00; font-weight: bold;');
});
