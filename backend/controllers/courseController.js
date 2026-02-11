const db = require('../config/database');

// Get all courses with optional filters
exports.getAllCourses = async (req, res, next) => {
  try {
    const { category, difficulty, search, limit = 50, offset = 0 } = req.query;

    // Build WHERE clause for both count and main query
    let whereClause = 'WHERE is_active = true';
    const params = [];
    const countParams = [];
    let pIdx = 1;

    if (category && category !== 'all') {
      whereClause += ` AND category = $${pIdx++}`;
      params.push(category);
      countParams.push(category);
    }

    if (difficulty) {
      whereClause += ` AND difficulty = $${pIdx++}`;
      params.push(difficulty);
      countParams.push(difficulty);
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${pIdx} OR description ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      pIdx++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM courses ${whereClause}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated courses
    const query = `SELECT * FROM courses ${whereClause} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      total: total,
      courses: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Get single course
exports.getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM courses WHERE (id = $1 OR course_id = $2) AND is_active = true',
      [parseInt(id) || -1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      course: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Create new course (admin only)
exports.createCourse = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      image_url,
      price,
      original_price,
      instructor,
      course_id
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    const result = await db.query(
      `INSERT INTO courses (
        title, description, category, difficulty, image_url, price, original_price,
        instructor, course_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        title, description || null, category || null, difficulty || 'Beginner',
        image_url || null, price, original_price || null, instructor || 'CourseCity',
        course_id || `course_${Date.now()}`
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      courseId: result.rows[0].id
    });
  } catch (error) {
    next(error);
  }
};

// Update course (admin only)
exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'title', 'description', 'category', 'difficulty', 'image_url', 'price',
      'original_price', 'instructor', 'rating', 'reviews_count', 'is_active'
    ];

    const updateFields = [];
    const values = [];
    let pIdx = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${pIdx++}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(parseInt(id));
    const query = `UPDATE courses SET ${updateFields.join(', ')} WHERE id = $${pIdx} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Delete course (admin only)
exports.deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM courses WHERE id = $1', [parseInt(id)]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
