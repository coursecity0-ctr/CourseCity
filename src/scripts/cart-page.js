// ====================================
// CART PAGE - SPECIFIC FUNCTIONALITY
// ====================================

'use strict';

const CartPage = {
  discountCode: null,
  discountAmount: 0,
  discountPercentage: 0,
  
  // Available discount codes
  discountCodes: {
    'WELCOME10': { type: 'percentage', value: 10 },
    'SAVE20': { type: 'percentage', value: 20 },
    'FIRST50': { type: 'fixed', value: 50 }
  },
  
  init() {
    this.renderCartItems();
    this.updateOrderSummary();
    this.setupEventListeners();
    this.loadRecommendedCourses();
    this.checkCartEmpty();
    this.populateUserEmail();
  },
  
  populateUserEmail() {
    // Auto-populate email if user is logged in
    const emailInput = document.getElementById('checkout-email');
    if (emailInput && typeof AppState !== 'undefined' && AppState.user && AppState.user.email) {
      emailInput.value = AppState.user.email;
    }
  },
  
  setupEventListeners() {
    // Apply coupon
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    if (applyCouponBtn) {
      applyCouponBtn.addEventListener('click', () => this.applyCoupon());
    }
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.handleCheckout());
    }
    
    // Listen for cart updates
    window.addEventListener('cart-updated', () => {
      this.renderCartItems();
      this.updateOrderSummary();
      this.checkCartEmpty();
    });
  },
  
  checkCartEmpty() {
    const emptyState = document.getElementById('empty-cart-state');
    const cartItemsList = document.getElementById('cart-items-list');
    const orderSummary = document.getElementById('order-summary-section');
    const continueShopping = document.getElementById('continue-shopping');
    const recommendedSection = document.getElementById('recommended-courses-section');
    
    if (AppState.cart.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (cartItemsList) cartItemsList.style.display = 'none';
      if (orderSummary) orderSummary.style.display = 'none';
      if (continueShopping) continueShopping.style.display = 'none';
      if (recommendedSection) recommendedSection.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (cartItemsList) cartItemsList.style.display = 'block';
      if (orderSummary) orderSummary.style.display = 'block';
      if (continueShopping) continueShopping.style.display = 'block';
      if (recommendedSection) recommendedSection.style.display = 'block';
    }
  },
  
  renderCartItems() {
    const cartItemsList = document.getElementById('cart-items-list');
    const totalItemsCount = document.getElementById('total-items-count');
    
    if (!cartItemsList) return;
    
    const totalItems = Cart.getTotalItems();
    if (totalItemsCount) {
      totalItemsCount.textContent = totalItems;
    }
    
    cartItemsList.innerHTML = '';
    
    if (AppState.cart.length === 0) {
      return;
    }
    
    AppState.cart.forEach((item, index) => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item-card';
      
      const itemTotal = item.price * item.quantity;
      
      cartItem.innerHTML = `
        <div class="cart-item-image">
          <img src="${item.image || '../assets/image/ExcelR.png'}" alt="${item.title}" loading="lazy">
        </div>
        <div class="cart-item-details">
          <h3 class="cart-item-title">${item.title}</h3>
          <p class="cart-item-meta">
            <span class="meta-badge"><i class="fas fa-clock"></i> Lifetime Access</span>
            <span class="meta-badge"><i class="fas fa-certificate"></i> Certificate</span>
          </p>
          <div class="cart-item-actions-mobile">
            <div class="quantity-controls">
              <button class="qty-btn" onclick="CartPage.updateQuantity(${index}, -1)" aria-label="Decrease quantity">
                <i class="fas fa-minus"></i>
              </button>
              <span class="quantity">${item.quantity}</span>
              <button class="qty-btn" onclick="CartPage.updateQuantity(${index}, 1)" aria-label="Increase quantity">
                <i class="fas fa-plus"></i>
              </button>
            </div>
            <button class="remove-item-btn" onclick="CartPage.removeItem(${index})" aria-label="Remove item">
              <i class="fas fa-trash-alt"></i>
              Remove
            </button>
          </div>
        </div>
        <div class="cart-item-quantity">
          <label>Quantity</label>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="CartPage.updateQuantity(${index}, -1)" aria-label="Decrease quantity">
              <i class="fas fa-minus"></i>
            </button>
            <span class="quantity">${item.quantity}</span>
            <button class="qty-btn" onclick="CartPage.updateQuantity(${index}, 1)" aria-label="Increase quantity">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="cart-item-price">
          <label>Price</label>
          <span class="price">GH₵${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-total">
          <label>Subtotal</label>
          <span class="total">GH₵${itemTotal.toFixed(2)}</span>
        </div>
        <div class="cart-item-remove">
          <button class="remove-item-btn" onclick="CartPage.removeItem(${index})" aria-label="Remove item">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      
      cartItemsList.appendChild(cartItem);
    });
  },
  
  updateQuantity(index, delta) {
    if (!AppState.cart[index]) return;
    
    AppState.cart[index].quantity += delta;
    
    if (AppState.cart[index].quantity <= 0) {
      this.removeItem(index);
    } else {
      AppState.saveToStorage();
      this.renderCartItems();
      this.updateOrderSummary();
      updateCartUI(); // Update header cart
      
      // Dispatch custom event
      window.dispatchEvent(new Event('cart-updated'));
    }
  },
  
  removeItem(index) {
    const item = AppState.cart[index];
    AppState.cart.splice(index, 1);
    AppState.saveToStorage();
    
    this.renderCartItems();
    this.updateOrderSummary();
    this.checkCartEmpty();
    updateCartUI(); // Update header cart
    
    Toast.info(`${item.title} removed from cart`);
    
    // Dispatch custom event
    window.dispatchEvent(new Event('cart-updated'));
  },
  
  getSubtotal() {
    return AppState.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  calculateDiscount(subtotal) {
    if (!this.discountCode) return 0;
    
    const discount = this.discountCodes[this.discountCode];
    if (!discount) return 0;
    
    if (discount.type === 'percentage') {
      return (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      return Math.min(discount.value, subtotal);
    }
    
    return 0;
  },
  
  updateOrderSummary() {
    const subtotal = this.getSubtotal();
    const discount = this.calculateDiscount(subtotal);
    const total = subtotal - discount;
    
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryDiscount = document.getElementById('summary-discount');
    const summaryTotal = document.getElementById('summary-total');
    
    if (summarySubtotal) {
      summarySubtotal.textContent = `GH₵${subtotal.toFixed(2)}`;
    }
    
    if (summaryDiscount) {
      summaryDiscount.textContent = discount > 0 ? `-GH₵${discount.toFixed(2)}` : 'GH₵0.00';
      summaryDiscount.style.color = discount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)';
    }
    
    if (summaryTotal) {
      summaryTotal.textContent = `GH₵${total.toFixed(2)}`;
    }
  },
  
  applyCoupon() {
    const couponInput = document.getElementById('coupon-code');
    const applyBtn = document.getElementById('apply-coupon-btn');
    
    if (!couponInput) return;
    
    const code = couponInput.value.trim().toUpperCase();
    
    if (!code) {
      Toast.error('Please enter a coupon code');
      return;
    }
    
    if (this.discountCodes[code]) {
      this.discountCode = code;
      const subtotal = this.getSubtotal();
      const discountAmount = this.calculateDiscount(subtotal);
      this.updateOrderSummary();
      Toast.success(`Coupon "${code}" applied successfully!`);
      
      // Add notification
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.notifyDiscountApplied(discountAmount);
      }
      
      couponInput.value = '';
      couponInput.disabled = true;
      if (applyBtn) {
        applyBtn.textContent = 'Applied';
        applyBtn.disabled = true;
        applyBtn.style.background = 'var(--color-success)';
      }
    } else {
      Toast.error('Invalid coupon code');
    }
  },
  
  handleCheckout() {
    if (AppState.cart.length === 0) {
      Toast.warning('Your cart is empty!');
      return;
    }
    
    const emailInput = document.getElementById('checkout-email');
    const email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
      Toast.error('Please enter your email address');
      if (emailInput) emailInput.focus();
      return;
    }
    
    if (!Utils.validateEmail(email)) {
      Toast.error('Please enter a valid email address');
      if (emailInput) emailInput.focus();
      return;
    }
    
    // Delegate to existing quick checkout Paystack flow
    const quickCheckoutBtn = document.getElementById('quick-checkout-btn');
    if (quickCheckoutBtn) {
      quickCheckoutBtn.click();
    } else {
      Toast.error('Quick checkout is not available at the moment. Please try again later.');
    }
  },
  
  loadRecommendedCourses() {
    const recommendedGrid = document.getElementById('recommended-courses-grid');
    if (!recommendedGrid) return;
    
    // Sample recommended courses (in a real app, this would come from an API)
    const recommendedCourses = [
      {
        title: 'Python for Data Analytics',
        image: '../assets/image/PythonR.png',
        instructor: 'Kwame Boateng',
        price: 20.00,
        oldPrice: 100.00,
        rating: 4.8,
        students: 1234,
        category: 'data-science'
      },
      {
        title: 'SQL for Data Professionals',
        image: '../assets/image/SQLR.png',
        instructor: 'Ama Mensah',
        price: 20.00,
        oldPrice: 100.00,
        rating: 4.7,
        students: 987,
        category: 'data-science'
      },
      {
        title: 'Power BI Beginner to Advanced',
        image: '../assets/image/Power Bi.png',
        instructor: 'Yaw Owusu',
        price: 20.00,
        rating: 4.9,
        students: 1567,
        category: 'data-science'
      },
      {
        title: 'Cybersecurity & Digital Defense',
        image: '../assets/image/CyberSecurity.png',
        instructor: 'Kofi Asare',
        price: 50.00,
        oldPrice: 250.00,
        rating: 4.6,
        students: 654,
        category: 'development'
      }
    ];
    
    recommendedGrid.innerHTML = '';
    
    recommendedCourses.slice(0, 4).forEach(course => {
      const courseCard = document.createElement('div');
      courseCard.className = 'recommended-course-card';
      
      courseCard.innerHTML = `
        <div class="course-image">
          <img src="${course.image}" alt="${course.title}" loading="lazy">
        </div>
        <div class="course-body">
          <div class="course-meta-small">
            <span class="instructor-name"><i class="fas fa-user"></i> ${course.instructor}</span>
            <span class="rating"><i class="fas fa-star"></i> ${course.rating}</span>
          </div>
          <h3 class="course-title">${course.title}</h3>
          <div class="course-footer">
            <div class="course-price">
              <span class="price-new">GH₵${course.price.toFixed(2)}</span>
              ${course.oldPrice ? `<span class="price-old">GH₵${course.oldPrice.toFixed(2)}</span>` : ''}
            </div>
            <button class="btn-add-to-cart-small" onclick="CartPage.addRecommendedToCart('${course.title}', ${course.price}, '${course.image}')">
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      `;
      
      recommendedGrid.appendChild(courseCard);
    });
  },
  
  addRecommendedToCart(title, price, image) {
    Cart.addToCart(title, price, image);
    this.renderCartItems();
    this.updateOrderSummary();
    this.checkCartEmpty();
  }
};

// Initialize cart page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  CartPage.init();
});


