// ====================================
// COURSECITY - COURSES PAGE
// Search, Filter, and Course Management
// ====================================

'use strict';

// ====================================
// STATE MANAGEMENT
// ====================================
// Note: AppState is defined in script.js - using the global instance here
// No need to redeclare it to avoid "Identifier 'AppState' has already been declared" error

// ====================================
// TOAST NOTIFICATIONS
// ====================================
// Note: Toast is defined in script.js - using the global instance here
// No need to redeclare it to avoid "Identifier 'Toast' has already been declared" error

// ====================================
// CART FUNCTIONALITY
// ====================================
// Note: Cart is defined in script.js - using the global instance here
// No need to redeclare it to avoid "Identifier 'Cart' has already been declared" error

// ====================================
// WISHLIST FUNCTIONALITY
// ====================================
// Note: Wishlist is defined in script.js - using the global instance here
// No need to redeclare it to avoid "Identifier 'Wishlist' has already been declared" error

// ====================================
// UPDATE CART UI
// ====================================
// Note: updateCartUI is defined in script.js - using the global function here
// No need to redeclare it to avoid conflicts

// ====================================
// COURSE DATA TRANSFORMER (API to Card Format)
// ====================================
const CourseDataTransformer = {
  /**
   * Transform API course object to card data format
   */
  transformFromAPI(course) {
    // Calculate discount percentage
    let discountPercent = 0;
    if (course.old_price && course.price && course.old_price > course.price) {
      discountPercent = Math.round((1 - course.price / course.old_price) * 100);
    }

    // Generate stars HTML based on rating
    const rating = parseFloat(course.rating || 4.9);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>';
    }
    starsHTML += `<span class="rating-value">${rating.toFixed(1)}</span>`;

    // Format duration
    const duration = course.duration || '';

    // Format lectures count
    const lecturesCount = course.lectures_count || 0;
    const lectures = lecturesCount > 0 ? `${lecturesCount} ${lecturesCount === 1 ? 'Lecture' : 'Lectures'}` : '';

    // Format students count
    const studentsCount = course.students_count || 0;
    const students = studentsCount > 0 ? `${studentsCount} ${studentsCount === 1 ? 'Student' : 'Students'}` : '';

    // Get initials from seller name
    const instructorName = course.instructor || 'CourseCity'; // Backend field name remains 'instructor'
    const instructorAvatar = instructorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CC';

    // Handle image path - convert API image_url to relative path
    let imagePath = course.image_url || '';
    if (imagePath) {
      // If it's an absolute URL starting with /uploads, keep it
      if (imagePath.startsWith('/uploads/')) {
        imagePath = `http://${window.location.hostname}:5000${imagePath}`;
      }
      // If it's already an absolute URL (http/https), keep it
      else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        // Keep as is
      }
      // If it's a server-relative path starting with /Assets or /assets, convert to frontend-relative path
      else if (imagePath.startsWith('/Assets/')) {
        imagePath = imagePath.replace('/Assets/', '../../assets/');
      }
      else if (imagePath.startsWith('/assets/')) {
        imagePath = imagePath.replace('/assets/', '../../assets/');
      }
      // If it's just a filename, assume it's in the image folder
      else if (!imagePath.includes('/')) {
        imagePath = `../../assets/image/${imagePath}`;
      }
      // Otherwise try to preserve the path
    }

    // Generate course detail page link based on title
    const link = course.link || this.generateCourseLink(course.title);

    return {
      id: course.id,
      title: course.title || '',
      image: imagePath,
      price: parseFloat(course.price || 0),
      oldPrice: parseFloat(course.old_price || 0),
      category: course.category || '',
      description: course.description || '',
      link: link,
      instructor: instructorName,
      instructorAvatar: instructorAvatar,
      difficulty: course.difficulty || 'Beginner',
      rating: rating,
      reviews: course.reviews_count || 0,
      duration: duration,
      lectures: lectures,
      students: students,
      discountPercent: discountPercent,
      starsHTML: starsHTML
    };
  },

  /**
   * Generate course link from title (for detail pages)
   */
  generateCourseLink(title) {
    if (!title) return '#';
    // Convert title to URL-friendly format
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${slug}.html`;
  },

  /**
   * Transform array of API courses
   */
  transformAll(apiCourses) {
    return apiCourses.map(course => this.transformFromAPI(course));
  }
};

// ====================================
// COURSE DATA EXTRACTION
// ====================================
const CourseDataExtractor = {
  /**
   * Extract course data from HTML course card element
   */
  extractFromCard(card) {
    const titleEl = card.querySelector('.course-title');
    const imageEl = card.querySelector('img');
    const priceEl = card.querySelector('.price-new') || card.querySelector('.current-price');
    const oldPriceEl = card.querySelector('.price-old') || card.querySelector('.old-price');
    const discountBadge = card.querySelector('.discount-badge');
    const instructorEl = card.querySelector('.instructor-name');
    const instructorAvatar = card.querySelector('.instructor-avatar');
    const difficultyEl = card.querySelector('.course-level span') || card.querySelector('.difficulty');
    const ratingEl = card.querySelector('.meta-item span') || card.querySelector('.rating-value');
    const reviewsEl = card.querySelector('.meta-light') || card.querySelector('.review-count');

    // Parse price values
    const priceText = priceEl?.textContent.replace(/[^\d.]/g, '') || '0';
    const oldPriceText = oldPriceEl?.textContent.replace(/[^\d.]/g, '') || '0';

    // Parse discount percentage
    let discountPercent = 0;
    if (discountBadge) {
      const discountText = discountBadge.textContent?.replace(/[^\d]/g, '') || '';
      discountPercent = parseInt(discountText) || 0;
    }

    // Parse rating
    const rating = parseFloat(ratingEl?.textContent || '4.9');

    // Parse reviews count
    const reviewsText = reviewsEl?.textContent.replace(/[^\d]/g, '') || '0';
    const reviews = parseInt(reviewsText) || 0;

    // Extract meta information from new structure or legacy
    let duration = '', lectures = '', students = '';
    const metaItems = card.querySelectorAll('.meta-item');
    if (metaItems.length > 1) {
      // New structure
      duration = metaItems[3]?.textContent.trim() || '';
      lectures = metaItems[1]?.textContent.trim() || '';
      students = metaItems[2]?.textContent.trim() || '';
    } else {
      // Legacy structure
      const metaSpans = card.querySelectorAll('.course-meta span');
      duration = metaSpans[0]?.textContent.trim() || '';
      lectures = metaSpans[1]?.textContent.trim() || '';
      students = metaSpans[2]?.textContent.trim() || '';
    }

    return {
      title: card.dataset.title || titleEl?.textContent.trim() || '',
      image: card.dataset.image || imageEl?.src || '',
      price: parseFloat(priceText) || 0,
      oldPrice: parseFloat(oldPriceText) || 0,
      category: card.dataset.category || '',
      description: card.dataset.description || '',
      link: card.dataset.link || '',
      instructor: instructorEl?.textContent.trim() || 'CourseCity',
      instructorAvatar: instructorAvatar?.textContent.trim() || 'CC',
      difficulty: difficultyEl?.textContent.trim() || 'Beginner',
      rating: rating,
      reviews: reviews,
      duration: duration,
      lectures: lectures,
      students: students,
      discountPercent: discountPercent
    };
  },

  /**
   * Extract all course data from HTML
   */
  extractAll() {
    const courseCards = document.querySelectorAll('#all-courses-grid .course-card-new, #all-courses-grid .course-card');
    const count = courseCards.length;
    console.log(`CourseDataExtractor: Found ${count} course cards in HTML`);
    const extracted = Array.from(courseCards).map(card => this.extractFromCard(card));
    console.log(`CourseDataExtractor: Extracted data for ${extracted.length} courses`);
    return extracted;
  }
};

// ====================================
// COURSE CARD RENDERER
// ====================================
const CourseCardRenderer = {
  /**
   * Render a single course card HTML
   */
  render(courseData) {
    const discountBadge = courseData.discountPercent > 0
      ? `<span class="discount-badge">${courseData.discountPercent}% OFF</span>`
      : '';

    // Fix image path - handle both absolute and relative paths
    let imageSrc = courseData.image;
    if (imageSrc.startsWith('/Assets/')) {
      imageSrc = imageSrc.replace('/Assets/', '../../assets/');
    } else if (!imageSrc.includes('/') && !imageSrc.startsWith('http')) {
      imageSrc = `../../assets/image/${imageSrc}`;
    }

    let courseLink = courseData.link;
    const oldPriceDisplay = courseData.oldPrice > 0 && courseData.oldPrice > courseData.price
      ? `<span class="price-old">GH₵${courseData.oldPrice.toFixed(2)}</span>`
      : '';

    const card = document.createElement('div');
    card.className = 'course-card-new'; // Changed to modern class
    card.dataset.dynamicallyRendered = 'true';
    card.dataset.category = courseData.category;
    card.dataset.title = courseData.title;
    card.dataset.image = courseData.image;
    card.dataset.price = courseData.price.toFixed(2);
    card.dataset.oldPrice = courseData.oldPrice.toFixed(2);
    card.dataset.description = courseData.description;
    card.dataset.link = courseLink;
    if (courseData.id) {
      card.dataset.courseId = courseData.id;
    }

    card.innerHTML = `
      <div class="course-image">
        <img src="${imageSrc}" alt="${courseData.title}" loading="lazy">
        ${discountBadge}
        <button class="card-wishlist-btn" data-course="${courseData.title}" aria-label="Add to wishlist">
          <i class="far fa-heart"></i>
        </button>
        <button class="card-preview-btn expand-btn" aria-label="Preview course">
          <i class="fas fa-eye"></i>
        </button>
      </div>
      <div class="course-body">
        <div class="course-header">
          <div class="instructor">
            <div class="instructor-avatar">${courseData.instructorAvatar}</div>
            <span class="instructor-name">${courseData.instructor}</span>
          </div>
          <div class="course-price">
            <span class="price-new">GH₵${courseData.price.toFixed(2)}</span>
            ${oldPriceDisplay}
          </div>
        </div>
        <h3 class="course-title">${courseData.title}</h3>
        <p class="course-description">${courseData.description}</p>
        <div class="course-level">
          <span class="badge-beginner">${courseData.difficulty}</span>
        </div>
        <div class="course-meta">
          <div class="meta-item">
            <i class="fas fa-star"></i>
            <span>${courseData.rating.toFixed(1)}</span>
            <span class="meta-light">(${courseData.reviews})</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-file-alt"></i>
            <span>${courseData.lectures || '0 Lectures'}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-users"></i>
            <span>${courseData.students || '0 Students'}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-clock"></i>
            <span>${courseData.duration || '--'}</span>
          </div>
        </div>
        <button class="btn-add-cart add-to-cart-btn" data-course="${courseData.title}" data-price="${courseData.price.toFixed(2)}">
          <i class="fas fa-shopping-cart"></i>
          Add to Cart
        </button>
      </div>
    `;

    return card;
  }
};

// ====================================
// LOAD MORE FUNCTIONALITY
// ====================================
const LoadMore = {
  coursesPerPage: 9,
  currentPage: 1,
  allCoursesData: [],
  renderedCourses: [],
  courseGrid: null,
  isLoading: false,
  isLoadingMore: false,
  totalCoursesAvailable: 0,
  currentFilters: {},

  async init() {
    // Get course grid container
    this.courseGrid = document.getElementById('all-courses-grid');
    if (!this.courseGrid) {
      console.error('Course grid container not found');
      return;
    }

    // Show loading state
    this.showLoadingState();

    // Reset state
    this.allCoursesData = [];
    this.renderedCourses = [];
    this.currentPage = 1;
    this.totalCoursesAvailable = 0;
    this.currentFilters = {};

    // Try to fetch initial batch from API (9 courses)
    try {
      if (typeof API !== 'undefined') {
        console.log('Attempting to fetch initial courses from API...');
        const response = await API.getCourses({
          limit: this.coursesPerPage,
          offset: 0
        });

        if (response && response.success && response.courses && response.courses.length > 0) {
          // Transform API courses to card format
          console.log(`API returned ${response.courses.length} courses`);
          console.log('Full API response:', JSON.stringify(response, null, 2));
          this.allCoursesData = CourseDataTransformer.transformAll(response.courses);
          this.totalCoursesAvailable = response.total || response.count || response.courses.length;

          console.log(`✅ Transformed ${this.allCoursesData.length} courses from API`);
          console.log(`Total courses available from API: ${this.totalCoursesAvailable}`);
          console.log(`API response.total: ${response.total}`);
          console.log(`API response.count: ${response.count}`);
          console.log(`Courses loaded: ${this.allCoursesData.length}`);
          console.log(`Sample course data:`, this.allCoursesData[0]);

          // Hide/remove HTML cards since we're using API data
          this.cleanupHTMLCards();
        } else {
          console.warn('API response is empty or invalid:', response);
          throw new Error('No courses in API response');
        }
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.warn('API fetch failed, falling back to HTML extraction:', error);

      // Fallback: Extract course data from HTML
      console.log('Falling back to HTML extraction...');
      this.allCoursesData = CourseDataExtractor.extractAll();
      this.totalCoursesAvailable = this.allCoursesData.length;
      console.log(`Extracted ${this.allCoursesData.length} courses from HTML`);

      if (this.allCoursesData.length === 0) {
        console.error('No course data available from API or HTML!');
        console.error('Checking for HTML cards in DOM...');
        const htmlCards = document.querySelectorAll('#all-courses-grid .course-card-new, #all-courses-grid .course-card');
        console.error(`Found ${htmlCards.length} HTML course cards in DOM`);
        this.showErrorState();
        this.hideLoadingState();
        return;
      }

      console.log(`Sample extracted course:`, this.allCoursesData[0]);
      this.cleanupHTMLCards();
    }

    // Show the grid container
    console.log('Setting grid to visible...');
    this.courseGrid.style.display = 'grid';
    this.courseGrid.style.visibility = 'visible';

    // Clear any existing dynamically rendered courses
    const existingDynamicCards = Array.from(this.courseGrid.querySelectorAll('.course-card-new[data-dynamically-rendered="true"], .course-card[data-dynamically-rendered="true"]'));
    console.log(`Removing ${existingDynamicCards.length} existing dynamic cards`);
    existingDynamicCards.forEach(card => {
      if (card.parentNode) {
        card.remove();
      }
    });

    // Verify we have course data before rendering
    console.log(`About to render courses. Total courses available: ${this.totalCoursesAvailable}`);
    if (this.allCoursesData.length === 0) {
      console.error('No course data to render!');
      this.showErrorState();
      return;
    }

    // Render the first batch (already loaded from API)
    this.showCourses();
    this.setupEventListener();

    // Ensure Load More button is visible if there are more courses
    const loadMoreBtnFinal = document.getElementById('load-more-btn');
    if (loadMoreBtnFinal) {
      console.log('=== Load More Button Visibility Check ===');
      console.log(`allCoursesData.length: ${this.allCoursesData.length}`);
      console.log(`totalCoursesAvailable: ${this.totalCoursesAvailable}`);
      console.log(`coursesPerPage: ${this.coursesPerPage}`);

      // Show button if there are more courses to load
      if (this.totalCoursesAvailable > this.coursesPerPage ||
        (this.totalCoursesAvailable === 0 && this.allCoursesData.length === this.coursesPerPage) ||
        (this.totalCoursesAvailable === 0 && this.allCoursesData.length > 0)) {
        loadMoreBtnFinal.classList.remove('hidden');
        loadMoreBtnFinal.style.display = 'block';
        loadMoreBtnFinal.style.visibility = 'visible';
        console.log(`✅ Load More button SHOWN: ${this.allCoursesData.length}/${this.totalCoursesAvailable || '?'} courses loaded`);
      } else if (this.allCoursesData.length >= 20 && this.totalCoursesAvailable > 0 && this.allCoursesData.length >= this.totalCoursesAvailable) {
        loadMoreBtnFinal.classList.add('hidden');
        console.log(`❌ Load More button HIDDEN: All ${this.totalCoursesAvailable} courses already loaded (${this.allCoursesData.length} total)`);
      } else {
        loadMoreBtnFinal.classList.remove('hidden');
        loadMoreBtnFinal.style.display = 'block';
        loadMoreBtnFinal.style.visibility = 'visible';
        console.log(`✅ Load More button SHOWN (default): ${this.allCoursesData.length} courses loaded, total unknown`);
      }
    } else {
      console.error('❌ Load More button NOT FOUND in DOM during final visibility check!');
    }

    // Hide loading state
    this.hideLoadingState();

    // Set up Load More button event listener
    this.setupLoadMoreButton();

    console.log(`Initialized LoadMore: ${this.renderedCourses.length} courses rendered, ${this.totalCoursesAvailable} total available`);
  },

  /**
   * Set up the Load More button event listener
   */
  setupLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      // Remove any existing event listeners to prevent duplicates
      loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
      const newLoadMoreBtn = document.getElementById('load-more-btn');

      newLoadMoreBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🔄 Load More button clicked');
        await this.loadMoreCourses();
      });

      console.log('✅ Load More button event listener attached');
    } else {
      console.error('❌ Load More button not found when setting up event listener');
    }
  },

  /**
   * Load more courses from API (server-side pagination)
   */
  async loadMoreCourses() {
    // Prevent double-loading
    if (this.isLoadingMore) {
      console.log('Already loading more courses, skipping...');
      return;
    }

    // Check if all courses are already loaded - only hide if we have 20+ courses
    if (this.allCoursesData.length >= 20 && this.allCoursesData.length >= this.totalCoursesAvailable && this.totalCoursesAvailable > 0) {
      console.log(`🛑 All courses already loaded: ${this.allCoursesData.length}/${this.totalCoursesAvailable} (minimum 20 reached)`);
      this.hideLoadMoreButton();
      return;
    }

    console.log(`🔄 Loading more courses... Current: ${this.allCoursesData.length}/${this.totalCoursesAvailable} (need minimum 20)`);

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading more courses...';
    }

    this.isLoadingMore = true;

    try {
      // Calculate offset for next batch
      const offset = this.allCoursesData.length;
      const filters = { ...this.currentFilters, limit: this.coursesPerPage, offset };

      console.log(`Loading more courses: offset=${offset}, limit=${this.coursesPerPage}`);

      const response = await API.getCourses(filters);

      if (response && response.success && response.courses && response.courses.length > 0) {
        // Transform and append new courses
        const newCourses = CourseDataTransformer.transformAll(response.courses);
        this.allCoursesData.push(...newCourses);

        // Update total if provided
        if (response.total !== undefined) {
          this.totalCoursesAvailable = response.total;
        }

        console.log(`✅ Loaded ${newCourses.length} more courses. Total loaded: ${this.allCoursesData.length}/${this.totalCoursesAvailable}`);

        // Show success message
        Toast.show(`Loaded ${newCourses.length} more courses!`, 'success');

        // Increment page and render new courses
        this.currentPage++;
        this.showCourses();

        // Check if more courses available - only hide if we have 20+ courses AND reached the total
        if (this.allCoursesData.length >= 20 && this.allCoursesData.length >= this.totalCoursesAvailable && this.totalCoursesAvailable > 0) {
          this.hideLoadMoreButton();
          Toast.show('All courses loaded!', 'info');
        }
      } else {
        console.log('No more courses to load');
        this.hideLoadMoreButton();
        Toast.show('No more courses available', 'info');
      }
    } catch (error) {
      console.error('Error loading more courses:', error);
      Toast.show('Failed to load more courses. Please try again.', 'error');
    } finally {
      this.isLoadingMore = false;
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = 'Load More Courses';
      }
    }
  },

  /**
   * Hide the Load More button
   */
  hideLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.classList.add('hidden');
      console.log('All courses loaded, hiding Load More button');
    }
  },

  /**
   * Clean up HTML course cards (only original ones, not dynamically rendered)
   */
  cleanupHTMLCards() {
    if (!this.courseGrid) return;

    console.log('Cleaning up static HTML course cards...');
    const originalCards = Array.from(this.courseGrid.querySelectorAll('.course-card-new:not([data-dynamically-rendered="true"]), .course-card:not([data-dynamically-rendered="true"])'));

    console.log(`cleanupHTMLCards: Found ${originalCards.length} original HTML cards to remove`);

    if (originalCards.length > 0) {
      originalCards.forEach(card => {
        // Mark for removal
        card.style.display = 'none';
        card.style.visibility = 'hidden';
        // Remove immediately to prevent conflicts
        if (card.parentNode === this.courseGrid) {
          card.remove();
        }
      });
    }
  },

  /**
   * Show loading state
   */
  showLoadingState() {
    const showingCount = document.getElementById('showing-count');
    if (showingCount) {
      showingCount.textContent = 'Loading courses...';
    }
    this.isLoading = true;
  },

  /**
   * Hide loading state and update showing count
   */
  hideLoadingState() {
    this.isLoading = false;
    this.updateShowingCount();
  },

  /**
   * Update the showing count display
   */
  updateShowingCount() {
    const showingCount = document.getElementById('showing-count');
    if (showingCount) {
      const shown = this.renderedCourses.length;
      const total = this.totalCoursesAvailable || this.allCoursesData.length;

      if (total === 0) {
        showingCount.textContent = 'No courses found';
      } else if (shown >= total) {
        showingCount.textContent = `Showing all ${total} ${total === 1 ? 'course' : 'courses'}`;
      } else {
        showingCount.textContent = `Showing ${shown} of ${total} ${total === 1 ? 'course' : 'courses'}`;
      }
    }
  },

  /**
   * Show error state
   */
  showErrorState() {
    const showingCount = document.getElementById('showing-count');
    if (showingCount) {
      showingCount.textContent = 'Unable to load courses. Please refresh the page.';
    }
    if (this.courseGrid) {
      this.courseGrid.style.display = 'none';
    }
  },

  showCourses() {
    if (!this.courseGrid) {
      console.error('showCourses: courseGrid not found!');
      return;
    }

    // Ensure grid is visible
    if (this.courseGrid.style.display === 'none') {
      console.warn('Grid was hidden, making it visible...');
      this.courseGrid.style.display = 'grid';
      this.courseGrid.style.visibility = 'visible';
    }

    // For server-side pagination, render only the courses that haven't been rendered yet
    const startIndex = this.renderedCourses.length;
    const endIndex = this.allCoursesData.length;

    if (startIndex >= endIndex) {
      console.log(`LoadMore.showCourses() - All loaded courses already rendered (startIndex ${startIndex} >= endIndex ${endIndex})`);
      return;
    }

    const coursesToShow = this.allCoursesData.slice(startIndex, endIndex);

    console.log(`LoadMore.showCourses() - Rendering courses ${startIndex} to ${endIndex - 1} (${coursesToShow.length} courses)`);

    let renderedCount = 0;

    // Render the new courses
    coursesToShow.forEach((courseData, index) => {
      try {
        if (!courseData || !courseData.title) {
          console.error(`Invalid course data at index ${index}:`, courseData);
          return;
        }

        const card = CourseCardRenderer.render(courseData);

        if (!card) {
          console.error(`Failed to render course card for: ${courseData.title}`);
          return;
        }

        // Ensure card is visible and has proper styling
        card.style.display = '';
        card.style.visibility = 'visible';
        card.style.opacity = '1';

        // Verify card has required structure
        if (!card.querySelector('.course-title')) {
          console.error(`Course card missing title element: ${courseData.title}`);
        }

        // Append to grid
        this.courseGrid.appendChild(card);
        this.renderedCourses.push(card);
        renderedCount++;

        console.log(`✓ Rendered course ${renderedCount}/${coursesToShow.length}: ${courseData.title}`);
      } catch (error) {
        console.error(`Error rendering course card: ${error.message}`, courseData);
      }
    });

    console.log(`Successfully rendered ${renderedCount} out of ${coursesToShow.length} courses`);

    // Attach event listeners to newly rendered cards
    this.attachEventListeners();

    // Update showing count
    this.updateShowingCount();

    // Show/hide load more button based on server-side total
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      console.log('[showCourses] Button visibility check:');
      console.log(`  - allCoursesData.length: ${this.allCoursesData.length}`);
      console.log(`  - totalCoursesAvailable: ${this.totalCoursesAvailable}`);

      // Only hide if we have 20+ courses AND reached the total available
      if (this.allCoursesData.length >= 20 && this.totalCoursesAvailable > 0 && this.allCoursesData.length >= this.totalCoursesAvailable) {
        this.hideLoadMoreButton();
        console.log(`  → HIDDEN: All courses loaded (${this.allCoursesData.length}/${this.totalCoursesAvailable})`);
      } else {
        // Explicitly show button if there are more courses available or we haven't reached 20 yet
        loadMoreBtn.classList.remove('hidden');
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.style.visibility = 'visible';
        console.log(`  → SHOWN: More courses available (${this.allCoursesData.length}/${this.totalCoursesAvailable || '?'})`);
      }
    } else {
      console.error('❌ Load More button not found in showCourses() when trying to update visibility');
    }

    console.log(`Total rendered courses: ${this.renderedCourses.length}`);
  },

  attachEventListeners() {
    // Event listeners are handled via event delegation in:
    // - WishlistManager (for wishlist buttons)
    // - CourseModal.attachCardListeners() (for cart, expand, and card clicks)
    // So no need to attach individual listeners here
    // Just update wishlist UI for newly rendered cards
    Wishlist.updateUI();
  },

  setupEventListener() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      // Remove existing listener if any (to prevent duplicates)
      const newBtn = loadMoreBtn.cloneNode(true);
      loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);

      newBtn.addEventListener('click', () => {
        this.loadMoreCourses();
      });
    }
  },

  reset() {
    // Clear rendered courses
    this.renderedCourses.forEach(card => card.remove());
    this.renderedCourses = [];
    this.allCoursesData = [];
    this.currentPage = 1;
    this.totalCoursesAvailable = 0;
    this.currentFilters = {};

    // Re-initialize to fetch fresh data
    this.init();
  },

  resetWithFilteredData(filteredData) {
    // This method is kept for backward compatibility but should use API filters instead
    // Clear rendered courses
    this.renderedCourses.forEach(card => card.remove());
    this.renderedCourses = [];

    // Update data source
    this.allCoursesData = filteredData;
    this.totalCoursesAvailable = filteredData.length;
    this.currentPage = 1;

    // Re-render first batch
    this.showCourses();
  },

  /**
   * Reset and load courses with filters (for server-side filtering)
   */
  async resetWithFilters(filters) {
    // Clear rendered courses
    this.renderedCourses.forEach(card => card.remove());
    this.renderedCourses = [];
    this.allCoursesData = [];
    this.currentPage = 1;
    this.currentFilters = filters;

    // Remove existing no results message
    const noResultsMsg = document.getElementById('no-results-message');
    if (noResultsMsg) {
      noResultsMsg.remove();
    }

    // Show loading state
    this.showLoadingState();

    try {
      const response = await API.getCourses({
        ...filters,
        limit: this.coursesPerPage,
        offset: 0
      });

      if (response && response.success && response.courses) {
        this.allCoursesData = CourseDataTransformer.transformAll(response.courses);
        this.totalCoursesAvailable = response.total || response.courses.length;

        // Show no results message if no courses found
        if (this.allCoursesData.length === 0 && this.totalCoursesAvailable === 0) {
          const courseList = document.querySelector('.course-list');
          if (courseList && !document.getElementById('no-results-message')) {
            const noResults = document.createElement('div');
            noResults.id = 'no-results-message';
            noResults.className = 'no-results-message';
            const searchTerm = filters.search || '';
            noResults.innerHTML = `
              <i class="fas fa-search"></i>
              <h3>No courses found</h3>
              <p>No courses match "${searchTerm || 'your search'}". Try different keywords or browse all courses.</p>
            `;
            courseList.appendChild(noResults);
          }
        }

        this.showCourses();

        // Ensure Load More button visibility after filtering
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
          if (this.totalCoursesAvailable > this.coursesPerPage) {
            loadMoreBtn.classList.remove('hidden');
            console.log(`Load More button shown after filter: ${this.allCoursesData.length}/${this.totalCoursesAvailable} courses`);
          } else {
            loadMoreBtn.classList.add('hidden');
            console.log(`Load More button hidden after filter: All ${this.totalCoursesAvailable} courses loaded`);
          }
        }

        this.hideLoadingState();
      } else {
        this.showErrorState();
      }
    } catch (error) {
      console.error('Error loading filtered courses:', error);
      this.showErrorState();
    }
  }
};

// ====================================
// SEARCH AND FILTER FUNCTIONALITY (Courses Page Specific)
// ====================================
// Note: Renamed to CoursesPageFilter to avoid conflict with CourseFilter in script.js
const CoursesPageFilter = {
  allCoursesData: [],

  init() {
    // Wait for LoadMore to initialize first (now async)
    // Use a longer timeout to ensure LoadMore.init() completes
    setTimeout(async () => {
      await this.cacheCourses();
      this.setupEventListeners();
      console.log(`CourseFilter initialized with ${this.allCoursesData.length} courses`);
    }, 150);
  },

  async cacheCourses() {
    // Use the course data from LoadMore
    if (LoadMore.allCoursesData && LoadMore.allCoursesData.length > 0) {
      this.allCoursesData = LoadMore.allCoursesData;
    } else {
      // Wait a bit more and try again, or fallback to DOM extraction
      await new Promise(resolve => setTimeout(resolve, 100));
      if (LoadMore.allCoursesData && LoadMore.allCoursesData.length > 0) {
        this.allCoursesData = LoadMore.allCoursesData;
      } else {
        // Final fallback: extract from DOM
        this.allCoursesData = CourseDataExtractor.extractAll();
      }
    }
  },

  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('course-search');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.applyFilters();
      }, 300));

      // Allow Enter key to trigger search
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.applyFilters();
        }
      });
    }

    // Search button click
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Category filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active state
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.applyFilters();
      });
    });
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  applyFilters() {
    const searchTerm = document.getElementById('course-search')?.value.trim() || '';
    const activeCategory = document.querySelector('.filter-btn.active')?.dataset.category || 'all';

    // Build API filters object
    const apiFilters = {};

    if (activeCategory !== 'all') {
      apiFilters.category = activeCategory;
    }

    if (searchTerm) {
      apiFilters.search = searchTerm;
    }

    // Use server-side filtering with API
    if (typeof API !== 'undefined') {
      console.log('CourseFilter: Applying server-side filters:', apiFilters);

      // Remove no results message if exists
      const noResultsMsg = document.getElementById('no-results-message');
      if (noResultsMsg) {
        noResultsMsg.remove();
      }

      // Use server-side filtering
      LoadMore.resetWithFilters(apiFilters);
    } else {
      // Fallback to client-side filtering if API not available
      console.warn('CourseFilter: API not available, using client-side filtering');
      const sourceData = this.allCoursesData.length > 0 ? this.allCoursesData : LoadMore.allCoursesData;

      if (!sourceData || sourceData.length === 0) {
        console.warn('CourseFilter: No course data available for filtering');
        return;
      }

      let filteredCourses = sourceData.filter(courseData => {
        // Apply category filter
        if (activeCategory !== 'all' && courseData.category !== activeCategory) {
          return false;
        }

        // Apply search filter
        if (searchTerm) {
          const title = (courseData.title || '').toLowerCase();
          const description = (courseData.description || '').toLowerCase();
          const seller = (courseData.instructor || '').toLowerCase(); // Backend field name remains 'instructor'
          const searchLower = searchTerm.toLowerCase();

          return title.includes(searchLower) ||
            description.includes(searchLower) ||
            seller.includes(searchLower);
        }

        return true;
      });

      // Show/hide no results message
      const courseList = document.querySelector('.course-list');
      let noResultsMsg = document.getElementById('no-results-message');

      if (filteredCourses.length === 0) {
        if (!noResultsMsg && courseList) {
          noResultsMsg = document.createElement('div');
          noResultsMsg.id = 'no-results-message';
          noResultsMsg.className = 'no-results-message';
          noResultsMsg.innerHTML = `
            <i class="fas fa-search"></i>
            <h3>No courses found</h3>
            <p>No courses match "${searchTerm || 'your search'}". Try different keywords or browse all courses.</p>
          `;
          courseList.appendChild(noResultsMsg);
        }
      } else {
        if (noResultsMsg) {
          noResultsMsg.remove();
        }
      }

      // Update results count
      this.updateResultsCount(filteredCourses.length);

      // Reset and update load more with filtered data
      LoadMore.resetWithFilteredData(filteredCourses);
    }
  },

  updateResultsCount(total) {
    const showingCount = document.getElementById('showing-count');

    if (showingCount) {
      if (total === 0) {
        showingCount.textContent = 'No courses found';
      } else {
        const displayed = Math.min(total, LoadMore.currentPage * LoadMore.coursesPerPage);
        showingCount.textContent = `Showing ${displayed} of ${total} courses`;
      }
    }
  }
};

// ====================================
// WISHLIST MANAGER - CONNECT TO BUTTONS
// ====================================
const WishlistManager = {
  init() {
    this.attachListeners();
    Wishlist.updateUI(); // Initial update based on saved wishlist
  },

  attachListeners() {
    // Use event delegation to handle dynamically created cards
    const courseGrid = document.getElementById('all-courses-grid');
    if (courseGrid) {
      courseGrid.addEventListener('click', (e) => {
        const wishlistBtn = e.target.closest('.wishlist-btn');
        if (wishlistBtn) {
          e.stopPropagation();
          this.toggleWishlist(wishlistBtn);
        }
      });
    }
  },

  toggleWishlist(btn) {
    const card = btn.closest('.course-card');
    if (!card) return;

    const courseTitle = card.querySelector('.course-title')?.textContent.trim();
    if (!courseTitle) return;

    // Extract complete course data from the card
    const courseData = {
      title: courseTitle,
      image: card.dataset.image || card.querySelector('img')?.src || '',
      price: parseFloat(card.querySelector('.current-price')?.textContent.replace(/[^\d.]/g, '') || 0),
      oldPrice: parseFloat(card.querySelector('.old-price')?.textContent.replace(/[^\d.]/g, '') || 0),
      instructor: card.querySelector('.instructor-name')?.textContent.trim() || 'CourseCity',
      rating: parseFloat(card.querySelector('.rating-value')?.textContent || 4.9),
      reviews: parseInt(card.querySelector('.review-count')?.textContent.replace(/[^\d]/g, '') || 0),
      duration: card.querySelectorAll('.course-meta span')[0]?.textContent.trim() || '',
      lectures: card.querySelectorAll('.course-meta span')[1]?.textContent.trim() || '',
      students: card.querySelectorAll('.course-meta span')[2]?.textContent.trim() || '',
      category: card.dataset.category || '',
      difficulty: card.querySelector('.difficulty')?.textContent.trim() || 'Beginner'
    };

    // Use the global Wishlist object with complete data
    Wishlist.toggle(courseTitle, courseData);
  }
};

// ====================================
// COURSE MODAL (Quick View)
// ====================================
const CourseModal = {
  modal: null,

  init() {
    this.modal = document.getElementById("course-modal");
    if (!this.modal) return;

    this.setupEventListeners();
    this.attachCardListeners();
  },

  setupEventListeners() {
    const closeBtn = this.modal.querySelector(".modal-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    // Close on outside click
    window.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    // Modal wishlist button
    const modalWishlistBtn = this.modal.querySelector(".modal-wishlist-btn");
    if (modalWishlistBtn) {
      modalWishlistBtn.addEventListener("click", () => {
        // Toggle wishlist for current course
        const title = document.getElementById("modal-title")?.textContent;
        if (title) {
          // Extract complete course data from modal
          const courseData = {
            title: title,
            image: document.getElementById("modal-image")?.src || '',
            price: parseFloat(document.getElementById("modal-price")?.textContent.replace(/[^\d.]/g, '') || 0),
            oldPrice: parseFloat(document.getElementById("modal-old-price")?.textContent.replace(/[^\d.]/g, '') || 0),
            instructor: document.querySelector(".modal-instructor-name")?.textContent.trim() || 'CourseCity',
            rating: parseFloat(document.querySelector(".modal-stars .rating-value")?.textContent || 4.9),
            reviews: parseInt(document.getElementById("modal-reviews")?.textContent.replace(/[^\d]/g, '') || 0),
            duration: document.getElementById("modal-duration")?.textContent.trim() || '',
            lectures: document.getElementById("modal-lectures")?.textContent.trim() || '',
            students: document.getElementById("modal-students")?.textContent.trim() || '',
            category: document.getElementById("modal-category")?.textContent.trim() || '',
            difficulty: document.getElementById("modal-difficulty")?.textContent.trim() || 'Beginner'
          };

          const isInWishlist = Wishlist.toggle(title, courseData);
          const icon = modalWishlistBtn.querySelector("i");
          if (icon) {
            icon.className = isInWishlist ? "fas fa-heart" : "far fa-heart";
          }
        }
      });
    }

    // Modal add to cart button
    const modalAddBtn = document.getElementById("modal-add-to-cart");
    if (modalAddBtn) {
      modalAddBtn.addEventListener("click", () => {
        const title = document.getElementById("modal-title")?.textContent;
        const priceText = document.getElementById("modal-price")?.textContent;
        const image = document.getElementById("modal-image")?.src;

        if (title && priceText) {
          const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
          Cart.addToCart(title, price, image || '');
          this.close();
        }
      });
    }
  },

  attachCardListeners() {
    // Use event delegation for dynamically created cards
    const courseGrid = document.getElementById('all-courses-grid');
    if (!courseGrid) return;

    // Attach listeners using event delegation
    courseGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.course-card');
      if (!card) return;

      // Handle add to cart button
      if (e.target.closest('.add-to-cart-btn')) {
        e.stopPropagation();
        this.addToCart(card).catch(err => {
          console.error('Error adding to cart:', err);
        });
        return;
      }

      // Handle expand button
      if (e.target.closest('.expand-btn')) {
        e.stopPropagation();
        this.open(card);
        return;
      }

      // Handle wishlist button (handled by WishlistManager)
      if (e.target.closest('.wishlist-btn')) {
        return; // Let WishlistManager handle it
      }

      // Click on card opens modal
      if (e.target.tagName.toLowerCase() !== 'button') {
        this.open(card);
      }
    });
  },

  open(card) {
    // Try to get data from dataset first, then fallback to DOM elements
    const title = card.dataset.title || card.querySelector(".course-title")?.innerText || '';
    let image = card.dataset.image || card.querySelector("img")?.src || '';
    const price = card.dataset.price || card.querySelector('.current-price')?.textContent.replace(/[^\d.]/g, '') || '0';
    const oldPrice = card.dataset.oldPrice || card.querySelector('.old-price')?.textContent.replace(/[^\d.]/g, '') || '0';
    const description = card.dataset.description || "No description available.";
    let link = card.dataset.link || "#";
    const category = card.dataset.category || '';

    // Fix link path if needed - ensure it's relative to current directory
    if (link && link !== '#' && !link.startsWith('http') && !link.startsWith('../') && !link.startsWith('./')) {
      // Link is already relative to same directory, keep as is
      // But ensure it doesn't have leading slash
      if (link.startsWith('/')) {
        link = link.substring(1);
      }
    }

    // Fix image path if needed
    if (image.startsWith('/Assets/')) {
      image = image.replace('/Assets/', '../../assets/');
    }

    // Get course meta from card
    const metaSpans = card.querySelectorAll('.course-meta span');
    const duration = metaSpans[0]?.textContent.trim() || '';
    const lectures = metaSpans[1]?.textContent.trim() || '';
    const students = metaSpans[2]?.textContent.trim() || '';

    const difficulty = card.querySelector('.difficulty')?.textContent || 'Beginner';
    const rating = card.querySelector('.rating-value')?.textContent || '4.9';
    const reviews = card.querySelector('.review-count')?.textContent || '(17)';

    // Populate modal
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalImage = document.getElementById('modal-image');
    const modalPrice = document.getElementById('modal-price');
    const modalOldPrice = document.getElementById('modal-old-price');
    const modalCategory = document.getElementById('modal-category');
    const modalDuration = document.getElementById('modal-duration');
    const modalLectures = document.getElementById('modal-lectures');
    const modalStudents = document.getElementById('modal-students');
    const modalDifficulty = document.getElementById('modal-difficulty');
    const modalDetailsLink = document.getElementById('modal-details-link');

    if (modalTitle) modalTitle.textContent = title;
    if (modalDescription) modalDescription.innerHTML = description;
    if (modalImage) modalImage.src = image;
    if (modalPrice) modalPrice.textContent = `GH₵${parseFloat(price).toFixed(2)}`;
    if (modalOldPrice) modalOldPrice.textContent = parseFloat(oldPrice) > 0 ? `GH₵${parseFloat(oldPrice).toFixed(2)}` : '';
    if (modalCategory) modalCategory.textContent = category.replace(/-/g, ' ');
    if (modalDuration) modalDuration.textContent = duration;
    if (modalLectures) modalLectures.textContent = lectures;
    if (modalStudents) modalStudents.textContent = students;
    if (modalDifficulty) modalDifficulty.textContent = difficulty;
    if (modalDetailsLink) modalDetailsLink.href = link;

    // Show discount badge if applicable
    const discountBadge = document.getElementById('modal-discount');
    if (discountBadge) {
      if (parseFloat(oldPrice) > 0 && parseFloat(oldPrice) > parseFloat(price)) {
        const discount = Math.round((1 - parseFloat(price) / parseFloat(oldPrice)) * 100);
        discountBadge.textContent = `${discount}% OFF`;
        discountBadge.style.display = 'block';
      } else {
        discountBadge.style.display = 'none';
      }
    }

    // Populate stars
    const starsContainer = document.getElementById('modal-stars');
    if (starsContainer) {
      const ratingNum = parseFloat(rating);
      const fullStars = Math.floor(ratingNum);
      const hasHalfStar = ratingNum % 1 >= 0.5;

      let starsHTML = '';
      for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
      }
      if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
      }
      const emptyStars = 5 - Math.ceil(ratingNum);
      for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
      }
      starsHTML += `<span class="rating-value">${rating}</span>`;
      starsContainer.innerHTML = starsHTML;
    }

    const modalReviews = document.getElementById('modal-reviews');
    if (modalReviews) modalReviews.textContent = reviews;

    // Update wishlist button state
    const modalWishlistBtn = this.modal.querySelector(".modal-wishlist-btn i");
    if (modalWishlistBtn) {
      modalWishlistBtn.className = Wishlist.has(title) ? "fas fa-heart" : "far fa-heart";
    }

    if (this.modal) {
      this.modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  },

  close() {
    this.modal.style.display = "none";
    document.body.style.overflow = "";
  },

  async addToCart(card) {
    const titleEl = card.querySelector(".course-title");
    const priceEl = card.querySelector(".current-price");
    const imgEl = card.querySelector("img");

    if (!titleEl || !priceEl) return;

    const title = titleEl.textContent.trim();
    const priceText = priceEl.textContent.replace(/[^\d.]/g, '');
    const price = parseFloat(priceText) || 0;
    const image = imgEl ? imgEl.src : '';

    // Add to cart (Cart.addToCart handles updateCartUI internally)
    if (typeof Cart !== 'undefined' && Cart.addToCart) {
      await Cart.addToCart(title, price, image);
    } else {
      console.error('Cart object not available');
    }
  }
};

// ====================================
// HAMBURGER MENU
// ====================================
const HamburgerMenu = {
  initialized: false,

  init() {
    // Prevent duplicate initialization
    if (this.initialized) return;

    // Skip initialization if override flag is set (e.g., on test page)
    if (window.HamburgerMenuOverride) {
      console.log('Hamburger menu initialization skipped (override flag set)');
      return;
    }

    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('#nav-menu ul');

    if (!hamburger || !navMenu) {
      console.warn('Hamburger menu elements not found');
      return;
    }

    // Toggle menu on hamburger click
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('show');

      const isOpen = navMenu.classList.contains('show');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('show');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });

    this.initialized = true;
    console.log('Hamburger menu initialized');
  }
};

// ====================================
// THEME TOGGLE
// ====================================
const ThemeToggle = {
  init() {
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (!themeToggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.applyTheme(savedTheme, sunIcon, moonIcon);

    // Toggle theme on click
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.classList.contains('night-mode') ? 'night' : 'light';
      const newTheme = currentTheme === 'light' ? 'night' : 'light';
      this.applyTheme(newTheme, sunIcon, moonIcon);
      localStorage.setItem('theme', newTheme);
    });
  },

  applyTheme(theme, sunIcon, moonIcon) {
    if (theme === 'night') {
      document.body.classList.add('night-mode');
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
    } else {
      document.body.classList.remove('night-mode');
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
    }
  }
};

// ====================================
// CART FUNCTIONALITY
// ====================================
const CartUI = {
  init() {
    const cartBtn = document.getElementById('cart-btn');
    const cartDropdown = document.getElementById('cart-dropdown');

    if (cartBtn && cartDropdown) {
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = cartDropdown.classList.toggle('active');
        cartBtn.setAttribute('aria-expanded', isOpen);
      });

      // Prevent dropdown from closing when clicking inside
      cartDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Close cart when clicking outside
      document.addEventListener('click', (e) => {
        if (!cartDropdown.contains(e.target) && !cartBtn.contains(e.target)) {
          cartDropdown.classList.remove('active');
          cartBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }
};

// ====================================
// INITIALIZE
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize AppState (load from localStorage)
  AppState.init();

  // Update Cart UI with saved data
  updateCartUI();

  // Initialize page components in correct order
  // LoadMore MUST be first and must complete before others (now async)
  try {
    await LoadMore.init();  // Must be first to fetch and render courses
  } catch (error) {
    console.error('Error initializing LoadMore:', error);
  }

  // Wait for LoadMore to complete before initializing dependent modules
  setTimeout(() => {
    CourseModal.init();  // Initialize modal before attaching listeners
    CoursesPageFilter.init();  // Depends on LoadMore being initialized
    WishlistManager.init();
    HamburgerMenu.init();
    ThemeToggle.init();
    CartUI.init();

    console.log('%cCourses Page Ready', 'color: #ff7a00; font-weight: bold;');
  }, 200); // Give LoadMore time to complete (increased for API calls)
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CoursesPageFilter, CourseModal, LoadMore };
}

