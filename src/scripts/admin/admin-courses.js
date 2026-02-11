// Admin Courses Management Script

let currentPage = 1;
let currentFilters = {};

// Check admin access on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize admin page with authentication check
  const adminUser = await initAdminPage();
  
  if (!adminUser) {
    // Access denied - initAdminPage already handled the redirect/error display
    return;
  }

  const adminUsernameEl = document.getElementById('admin-username');
  if (adminUsernameEl) {
    adminUsernameEl.textContent = adminUser.full_name || adminUser.username || 'Admin';
  }

  // Load courses
  await loadCourses();

  // Setup form handlers
  document.getElementById('course-form').addEventListener('submit', handleCourseSubmit);
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadCourses();
  });
});

// Load courses with filters
async function loadCourses(page = 1) {
  try {
    currentPage = page;
    
    const search = document.getElementById('search-input').value.trim();
    const category = document.getElementById('category-filter').value;
    const isActive = document.getElementById('status-filter').value;

    currentFilters = {
      page,
      limit: 20
    };

    if (search) currentFilters.search = search;
    if (category) currentFilters.category = category;
    if (isActive !== '') currentFilters.is_active = isActive;

    const data = await API.getAdminCourses(currentFilters);
    
    const countEl = document.getElementById('courses-count');
    if (countEl) {
      countEl.textContent = `${data.count} of ${data.total} courses`;
    }

    renderCoursesTable(data.courses);
    renderPagination(data.page, data.totalPages);
  } catch (error) {
    console.error('Error loading courses:', error);
    showToast('Failed to load courses.', 'error');
    document.getElementById('courses-table').innerHTML = 
      '<tr><td colspan="7" class="text-center">Error loading courses</td></tr>';
  }
}

// Render courses table
function renderCoursesTable(courses) {
  const tableBody = document.getElementById('courses-table');
  if (!tableBody) return;

  if (!courses || courses.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No courses found</td></tr>';
    return;
  }

  tableBody.innerHTML = courses.map(course => {
    const statusClass = course.is_active ? 'status-completed' : 'status-cancelled';
    const statusText = course.is_active ? 'Active' : 'Inactive';
    const date = new Date(course.created_at).toLocaleDateString();
    const price = parseFloat(course.price).toFixed(2);

    return `
      <tr>
        <td>${course.id}</td>
        <td>${course.title || 'N/A'}</td>
        <td>${course.category || 'N/A'}</td>
        <td>₵${price}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn-edit" onclick="openEditModal(${course.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn action-btn-delete" onclick="confirmDeleteCourse(${course.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render pagination
function renderPagination(currentPage, totalPages) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  paginationHTML += `
    <button onclick="loadCourses(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      paginationHTML += `
        <button class="${i === currentPage ? 'active' : ''}" onclick="loadCourses(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += `<span>...</span>`;
    }
  }

  paginationHTML += `
    <button onclick="loadCourses(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationEl.innerHTML = paginationHTML;
}

// Open create modal
function openCreateModal() {
  document.getElementById('modal-title').textContent = 'Create Course';
  document.getElementById('course-id').value = '';
  document.getElementById('course-status-group').style.display = 'none';
  document.getElementById('course-form').reset();
  document.getElementById('course-modal').classList.add('show');
}

// Open edit modal
async function openEditModal(courseId) {
  try {
    const courseData = await API.getCourse(courseId);
    const course = courseData.course;

    document.getElementById('modal-title').textContent = 'Edit Course';
    document.getElementById('course-id').value = course.id;
    document.getElementById('course-title').value = course.title || '';
    document.getElementById('course-description').value = course.description || '';
    document.getElementById('course-category').value = course.category || '';
    document.getElementById('course-difficulty').value = course.difficulty || 'Beginner';
    document.getElementById('course-price').value = course.price || '';
    document.getElementById('course-old-price').value = course.old_price || '';
    document.getElementById('course-instructor').value = course.instructor || 'CourseCity'; // Backend field name remains 'instructor'
    document.getElementById('course-duration').value = course.duration || '';
    document.getElementById('course-lectures').value = course.lectures_count || 0;
    document.getElementById('course-students').value = course.students_count || 0;
    document.getElementById('course-image-url').value = course.image_url || '';
    document.getElementById('course-is-active').value = course.is_active ? 'true' : 'false';
    document.getElementById('course-status-group').style.display = 'block';

    document.getElementById('course-modal').classList.add('show');
  } catch (error) {
    console.error('Error loading course:', error);
    showToast('Failed to load course details.', 'error');
  }
}

// Close course modal
function closeCourseModal() {
  document.getElementById('course-modal').classList.remove('show');
  document.getElementById('course-form').reset();
  document.getElementById('course-id').value = '';
}

// Handle course form submission
async function handleCourseSubmit(e) {
  e.preventDefault();

  try {
    const courseId = document.getElementById('course-id').value;
    const courseData = {
      title: document.getElementById('course-title').value,
      description: document.getElementById('course-description').value,
      category: document.getElementById('course-category').value || null,
      difficulty: document.getElementById('course-difficulty').value,
      price: parseFloat(document.getElementById('course-price').value),
      old_price: document.getElementById('course-old-price').value ? parseFloat(document.getElementById('course-old-price').value) : null,
      instructor: document.getElementById('course-instructor').value || 'CourseCity', // Backend field name remains 'instructor'
      duration: document.getElementById('course-duration').value || null,
      lectures_count: parseInt(document.getElementById('course-lectures').value) || 0,
      students_count: parseInt(document.getElementById('course-students').value) || 0,
      image_url: document.getElementById('course-image-url').value || null
    };

    if (courseId) {
      // Edit mode
      courseData.is_active = document.getElementById('course-is-active').value === 'true';
      await API.updateAdminCourse(courseId, courseData);
      showToast('Course updated successfully!', 'success');
    } else {
      // Create mode
      await API.createAdminCourse(courseData);
      showToast('Course created successfully!', 'success');
    }

    closeCourseModal();
    await loadCourses(currentPage);
  } catch (error) {
    console.error('Error saving course:', error);
    showToast(error.message || 'Failed to save course.', 'error');
  }
}

// Confirm and delete course
async function confirmDeleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
    return;
  }

  try {
    await API.deleteAdminCourse(courseId);
    showToast('Course deleted successfully!', 'success');
    await loadCourses(currentPage);
  } catch (error) {
    console.error('Error deleting course:', error);
    showToast(error.message || 'Failed to delete course.', 'error');
  }
}

// Toast notification function
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

