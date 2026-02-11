// ====================================
// WISHLIST PAGE - SPECIFIC FUNCTIONALITY
// ====================================

'use strict';

const WishlistPage = {
  // Sample course data (in a real app, this would come from an API or database)
  coursesData: {
    'Data Science And Machine Learning Essentials From A to Z': {
      image: '../assets/image/Data and Business Analytics.png',
      instructor: 'Jane Mensah',
      instructorAvatar: 'JM',
      price: 620.00,
      oldPrice: 800.00,
      rating: 4.8,
      reviews: 4800,
      lessons: 24,
      students: 3200,
      duration: '6h 30m',
      level: 'Beginner',
      category: 'data-science'
    },
    'Creative Fiverr Color Schemes for Your Design Project': {
      image: '../assets/image/Graphic Design.png',
      instructor: 'Kofi Asante',
      instructorAvatar: 'KA',
      price: 500.00,
      rating: 4.9,
      reviews: 2300,
      lessons: 18,
      students: 4500,
      duration: '4h 15m',
      level: 'Intermediate',
      category: 'ui-ux'
    },
    'Digital Leadership: Strategies for a New Business': {
      image: '../assets/image/FullStack.png',
      instructor: 'Ama Boateng',
      instructorAvatar: 'AB',
      price: 340.00,
      oldPrice: 500.00,
      rating: 4.7,
      reviews: 1800,
      lessons: 32,
      students: 2800,
      duration: '8h 45m',
      level: 'Advanced',
      category: 'development'
    },
    'Finance Tactic: Learn to Budget and Calculate Your Net Worth': {
      image: '../assets/image/Excel.png',
      instructor: 'Yaw Owusu',
      instructorAvatar: 'YO',
      price: 450.00,
      rating: 4.6,
      reviews: 3200,
      lessons: 20,
      students: 5200,
      duration: '5h 20m',
      level: 'Beginner',
      category: 'data-science'
    },
    'Build Brand: Site Marketing Tackling the New Marketing Landscape': {
      image: '../assets/image/Video Editing Resources And Courses.png',
      instructor: 'Efua Osei',
      instructorAvatar: 'EO',
      price: 280.00,
      oldPrice: 350.00,
      rating: 4.5,
      reviews: 1500,
      lessons: 28,
      students: 3800,
      duration: '6h 10m',
      level: 'Intermediate',
      category: 'development'
    },
    'Graphic Design: Mastering Design and Icon for Beginners': {
      image: '../assets/image/Graphic Design.png',
      instructor: 'Kwame Kusi',
      instructorAvatar: 'KK',
      price: 390.00,
      rating: 4.9,
      reviews: 2800,
      lessons: 22,
      students: 4100,
      duration: '5h 45m',
      level: 'Beginner',
      category: 'ui-ux'
    },
    'Power BI Beginner to Advanced': {
      image: '../assets/image/Power Bi.png',
      instructor: 'Yaw Owusu',
      instructorAvatar: 'YO',
      price: 20.00,
      rating: 4.9,
      reviews: 1567,
      lessons: 30,
      students: 1567,
      duration: '7h 30m',
      level: 'Beginner',
      category: 'data-science'
    },
    'Full-Stack Web Development': {
      image: '../assets/image/FullStack.png',
      instructor: 'Kofi Asare',
      instructorAvatar: 'KA',
      price: 50.00,
      oldPrice: 250.00,
      rating: 4.7,
      reviews: 987,
      lessons: 45,
      students: 2341,
      duration: '12h 15m',
      level: 'Advanced',
      category: 'development'
    },
    'Video Editing Mastery': {
      image: '../assets/image/Video Editing Resources And Courses.png',
      instructor: 'Ama Mensah',
      instructorAvatar: 'AM',
      price: 50.00,
      oldPrice: 250.00,
      rating: 4.6,
      reviews: 654,
      lessons: 25,
      students: 1234,
      duration: '8h 00m',
      level: 'Intermediate',
      category: 'development'
    },
    'Cybersecurity & Digital Defense': {
      image: '../assets/image/CyberSecurity.png',
      instructor: 'Kwame Boateng',
      instructorAvatar: 'KB',
      price: 50.00,
      oldPrice: 250.00,
      rating: 4.8,
      reviews: 789,
      lessons: 35,
      students: 1876,
      duration: '10h 30m',
      level: 'Advanced',
      category: 'development'
    }
  },
  
  init() {
    this.renderWishlistItems();
    this.updateWishlistCount();
    this.checkWishlistEmpty();
    this.loadRecommendedCourses();
    this.setupEventListeners();
  },
  
  setupEventListeners() {
    // Listen for wishlist updates
    window.addEventListener('wishlist-updated', () => {
      this.renderWishlistItems();
      this.updateWishlistCount();
      this.checkWishlistEmpty();
    });
  },
  
  checkWishlistEmpty() {
    const emptyState = document.getElementById('empty-wishlist-state');
    const wishlistGrid = document.getElementById('wishlist-grid');
    const wishlistHeader = document.querySelector('.wishlist-header');
    
    if (AppState.wishlist.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (wishlistGrid) wishlistGrid.style.display = 'none';
      if (wishlistHeader) wishlistHeader.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (wishlistGrid) wishlistGrid.style.display = 'grid';
      if (wishlistHeader) wishlistHeader.style.display = 'flex';
    }
  },
  
  updateWishlistCount() {
    const countElement = document.getElementById('total-wishlist-count');
    if (countElement) {
      countElement.textContent = AppState.wishlist.length;
    }
  },
  
  renderWishlistItems() {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (!wishlistGrid) return;
    
    wishlistGrid.innerHTML = '';
    
    if (AppState.wishlist.length === 0) {
      return;
    }
    
    AppState.wishlist.forEach((item, index) => {
      // Handle both old string format and new object format
      let courseTitle, courseData;
      
      if (typeof item === 'string') {
        // Old format: just a title string
        courseTitle = item;
        courseData = this.coursesData[courseTitle] || this.getDefaultCourseData(courseTitle);
      } else {
        // New format: full course object
        courseTitle = item.title;
        courseData = {
          image: item.image || '',
          instructor: item.instructor || 'CourseCity',
          instructorAvatar: item.instructor ? item.instructor.split(' ').map(n => n[0]).join('').toUpperCase() : 'CC',
          level: item.difficulty || 'Beginner',
          rating: item.rating || 4.9,
          reviews: item.reviews || 0,
          lessons: item.lectures ? parseInt(item.lectures.replace(/[^\d]/g, '')) : 0,
          students: item.students ? parseInt(item.students.replace(/[^\d]/g, '')) : 0,
          duration: item.duration || '',
          price: item.price || 0,
          oldPrice: item.oldPrice || 0
        };
      }
      
      const wishlistCard = document.createElement('div');
      wishlistCard.className = 'wishlist-course-card';
      
      const levelBadgeClass = courseData.level === 'Beginner' ? 'badge-beginner' : 
                               courseData.level === 'Intermediate' ? 'badge-intermediate' : 
                               'badge-advanced';
      
      wishlistCard.innerHTML = `
        <div class="wishlist-card-image">
          <img src="${courseData.image}" alt="${courseTitle}" loading="lazy">
          <button class="wishlist-remove-btn" onclick="WishlistPage.removeFromWishlist('${this.escapeHtml(courseTitle)}')" aria-label="Remove from wishlist">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="wishlist-card-body">
          <div class="wishlist-card-header">
            <div class="instructor-info">
              <div class="instructor-avatar-small">${courseData.instructorAvatar}</div>
              <span class="instructor-name-small">${courseData.instructor}</span>
            </div>
            <span class="${levelBadgeClass}">${courseData.level}</span>
          </div>
          
          <h3 class="wishlist-course-title">${courseTitle}</h3>
          
          <div class="wishlist-course-meta">
            <div class="meta-item">
              <i class="fas fa-star"></i>
              <span>${courseData.rating}</span>
              <span class="meta-light">(${this.formatNumber(courseData.reviews)})</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-file-alt"></i>
              <span>${courseData.lessons} Lessons</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-users"></i>
              <span>${this.formatNumber(courseData.students)}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-clock"></i>
              <span>${courseData.duration}</span>
            </div>
          </div>
          
          <div class="wishlist-card-footer">
            <div class="wishlist-course-price">
              <span class="price-new">GH₵${courseData.price.toFixed(2)}</span>
              ${courseData.oldPrice ? `<span class="price-old">GH₵${courseData.oldPrice.toFixed(2)}</span>` : ''}
            </div>
            <div class="wishlist-card-actions">
              <button class="btn-add-to-cart-wishlist" onclick="WishlistPage.addToCart('${this.escapeHtml(courseTitle)}', ${courseData.price}, '${courseData.image}')">
                <i class="fas fa-shopping-cart"></i>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
      
      wishlistGrid.appendChild(wishlistCard);
    });
  },
  
  escapeHtml(text) {
    // Use SecurityUtils if available, otherwise basic escape
    if (typeof window !== 'undefined' && window.SecurityUtils) {
      return window.SecurityUtils.escapeHtml(text || '');
    }
    // Fallback: basic HTML escaping
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },
  
  formatNumber(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  },
  
  getDefaultCourseData(title) {
    // Default data for courses not in the coursesData object
    return {
      image: '../assets/image/ExcelR.png',
      instructor: 'Expert Seller',
      instructorAvatar: 'EI',
      price: 20.00,
      rating: 4.5,
      reviews: 100,
      lessons: 20,
      students: 500,
      duration: '5h 00m',
      level: 'Beginner',
      category: 'general'
    };
  },
  
  removeFromWishlist(courseTitle) {
    Wishlist.toggle(courseTitle);
    this.renderWishlistItems();
    this.updateWishlistCount();
    this.checkWishlistEmpty();
  },
  
  addToCart(courseTitle, price, image) {
    // Check if already in cart
    const existingItem = AppState.cart.find(item => item.title === courseTitle);
    
    if (existingItem) {
      Toast.info(`${courseTitle} is already in your cart`);
      return;
    }
    
    Cart.addToCart(courseTitle, price, image);
    Toast.success(`${courseTitle} added to cart! Item remains in wishlist.`);
  },
  
  loadRecommendedCourses() {
    const recommendedGrid = document.getElementById('wishlist-recommended-grid');
    if (!recommendedGrid) return;
    
    // Sample recommended courses
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
        title: 'Excel for Data Analysts',
        image: '../assets/image/ExcelR.png',
        instructor: 'Yaw Owusu',
        price: 20.00,
        oldPrice: 100.00,
        rating: 4.9,
        students: 1567,
        category: 'data-science'
      },
      {
        title: 'Mobile Photography Masterclass',
        image: '../assets/image/Mobile Photography.png',
        instructor: 'Kofi Asare',
        price: 30.00,
        oldPrice: 150.00,
        rating: 4.6,
        students: 654,
        category: 'ui-ux'
      }
    ];
    
    recommendedGrid.innerHTML = '';
    
    recommendedCourses.slice(0, 4).forEach(course => {
      const isInWishlist = Wishlist.has(course.title);
      
      const courseCard = document.createElement('div');
      courseCard.className = 'recommended-course-card';
      
      courseCard.innerHTML = `
        <div class="course-image">
          <img src="${course.image}" alt="${course.title}" loading="lazy">
          <button class="card-wishlist-btn-small ${isInWishlist ? 'active' : ''}" 
                  onclick="WishlistPage.toggleRecommendedWishlist('${this.escapeHtml(course.title)}', this)" 
                  aria-label="Toggle wishlist">
            <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
          </button>
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
            <button class="btn-add-to-cart-small" onclick="WishlistPage.addToCart('${this.escapeHtml(course.title)}', ${course.price}, '${course.image}')">
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      `;
      
      recommendedGrid.appendChild(courseCard);
    });
  },
  
  toggleRecommendedWishlist(courseTitle, buttonElement) {
    Wishlist.toggle(courseTitle);
    
    // Update button appearance
    const icon = buttonElement.querySelector('i');
    if (Wishlist.has(courseTitle)) {
      buttonElement.classList.add('active');
      icon.className = 'fas fa-heart';
    } else {
      buttonElement.classList.remove('active');
      icon.className = 'far fa-heart';
    }
    
    // Update main wishlist if needed
    this.renderWishlistItems();
    this.updateWishlistCount();
    this.checkWishlistEmpty();
  }
};

// Initialize wishlist page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  WishlistPage.init();
});

