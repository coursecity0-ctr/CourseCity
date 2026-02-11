// Database seeder - populates courses table with initial data for PostgreSQL/Supabase
require('dotenv').config();
const db = require('./config/database');

const courses = [
  // ... (keeping the same course data as before)
  {
    title: 'Data and Business Analytics Masterclass',
    description: 'Turn raw data into meaningful insights and gain one of the most in-demand skills of the 21st century.',
    category: 'data-science',
    image_url: '/assets/image/Data and Business Analytics.png',
    price: 50.00,
    original_price: 350.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 17,
    students_count: 23,
    course_id: 'data-analytics-001'
  },
  {
    title: 'Excel Masterclass for Students & Professionals',
    description: 'From beginner to advanced, learn Formulas, Data Analysis, Dashboards, and Automation.',
    category: 'data-science',
    image_url: '/assets/image/Excel.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 19,
    students_count: 25,
    course_id: 'excel-001'
  },
  {
    title: 'Complete Power BI Masterclass',
    description: 'Master Power BI from basics to advanced data visualization and business intelligence.',
    category: 'data-science',
    image_url: '/assets/image/Power Bi.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 22,
    students_count: 19,
    course_id: 'power-bi-001'
  },
  {
    title: 'Complete Python Masterclass',
    description: 'Learn Python programming from scratch to advanced level with hands-on projects.',
    category: 'development',
    image_url: '/assets/image/Python.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 20,
    students_count: 27,
    course_id: 'python-001'
  },
  {
    title: 'Complete SQL for Data Science',
    description: 'Master SQL queries, database design, and data analysis for data science applications.',
    category: 'data-science',
    image_url: '/assets/image/SQL.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.8,
    reviews_count: 18,
    students_count: 19,
    course_id: 'sql-001'
  },
  {
    title: 'Complete Full-Stack Development Bootcamp',
    description: 'Become a full-stack web developer with HTML, CSS, JavaScript, Node.js, and more.',
    category: 'development',
    image_url: '/assets/image/FullStack.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 24,
    students_count: 29,
    course_id: 'fullstack-001'
  },
  {
    title: 'Cybersecurity Fundamentals: Protect Systems and Networks',
    description: 'Learn essential cybersecurity principles to protect digital assets and defend against cyber attacks.',
    category: 'cybersecurity',
    image_url: '/assets/image/CyberSecurity.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 21,
    students_count: 25,
    course_id: 'cybersecurity-001'
  },
  {
    title: 'Video Editing Mastery: Professional Editing Skills',
    description: 'Master professional video editing techniques with industry-standard software.',
    category: 'creative',
    image_url: '/assets/image/Video Editing Resources And Courses.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.8,
    reviews_count: 20,
    students_count: 22,
    course_id: 'video-editing-001'
  },
  {
    title: '8-In-1 Advanced Graphic Design Bundle',
    description: 'Complete graphic design masterclass covering all major design software and techniques.',
    category: 'ui-ux-design',
    image_url: '/assets/image/Graphic Design.png',
    price: 20.00,
    original_price: 100.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 24,
    students_count: 21,
    course_id: 'graphic-design-001'
  },
  {
    title: '3D Design and Architecture Masterclass',
    description: 'Master 3D Design and Architecture from scratch! Learn industry-standard tools, create stunning architectural visualizations.',
    category: 'creative',
    image_url: '/assets/image/3D Design And Architecture.png',
    price: 60.00,
    original_price: 300.00,
    instructor: 'CourseCity',
    rating: 4.7,
    reviews_count: 12,
    students_count: 15,
    course_id: '3d-design-001'
  },
  {
    title: 'Guitar Masterclass: From Beginner to Professional Guitarist',
    description: 'Master the guitar from scratch! Learn chords, scales, techniques, music theory, and play your favorite songs.',
    category: 'creative',
    image_url: '/assets/image/Guitar.png',
    price: 42.00,
    original_price: 180.00,
    instructor: 'CourseCity',
    rating: 4.6,
    reviews_count: 29,
    students_count: 38,
    course_id: 'guitar-001'
  },
  {
    title: 'Mobile Photography Masterclass: Capture Stunning Photos with Your Phone',
    description: 'Master mobile photography and create stunning images with just your smartphone.',
    category: 'creative',
    image_url: '/assets/image/Mobile Photography.png',
    price: 38.00,
    original_price: 160.00,
    instructor: 'CourseCity',
    rating: 4.7,
    reviews_count: 27,
    students_count: 34,
    course_id: 'mobile-photography-001'
  },
  {
    title: 'Learn Arabic Language: Complete Beginner to Advanced Course',
    description: 'Learn Arabic from beginner to advanced level. Master reading, writing, speaking, and understanding Arabic.',
    category: 'languages',
    image_url: '/assets/image/Arabic.png',
    price: 45.00,
    original_price: 200.00,
    instructor: 'CourseCity',
    rating: 4.8,
    reviews_count: 19,
    students_count: 28,
    course_id: 'arabic-001'
  },
  {
    title: 'Learn French Language: Complete Beginner to Fluency',
    description: 'Learn French from beginner to fluency. Master grammar, vocabulary, pronunciation, and conversation skills.',
    category: 'languages',
    image_url: '/assets/image/French.png',
    price: 48.00,
    original_price: 210.00,
    instructor: 'CourseCity',
    rating: 4.7,
    reviews_count: 26,
    students_count: 31,
    course_id: 'french-001'
  },
  {
    title: 'Learn Chinese Language: HSK Preparation Course',
    description: 'Learn Chinese (Mandarin) from basics to HSK proficiency. Master reading, writing, speaking, and tones.',
    category: 'languages',
    image_url: '/assets/image/Chinese.png',
    price: 50.00,
    original_price: 220.00,
    instructor: 'CourseCity',
    rating: 4.6,
    reviews_count: 18,
    students_count: 22,
    course_id: 'chinese-001'
  },
  {
    title: 'TikTok Marketing Mastery: Grow Your Brand and Go Viral',
    description: 'Master TikTok marketing and grow your brand exponentially. Learn content creation and viral strategies.',
    category: 'marketing',
    image_url: '/assets/image/Tiktok.png',
    price: 44.00,
    original_price: 190.00,
    instructor: 'CourseCity',
    rating: 4.8,
    reviews_count: 43,
    students_count: 52,
    course_id: 'tiktok-marketing-001'
  },
  {
    title: 'YouTube MasterClass: Build, Grow, and Monetize Your Channel',
    description: 'Master YouTube content creation and build a profitable channel. Learn video production and SEO.',
    category: 'marketing',
    image_url: '/assets/image/Youtube MasterClass.png',
    price: 52.00,
    original_price: 230.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 54,
    students_count: 61,
    course_id: 'youtube-masterclass-001'
  },
  {
    title: 'Cisco Networking: CCNA Certification Preparation',
    description: 'Master Cisco Networking and prepare for CCNA certification. Learn networking fundamentals.',
    category: 'networking',
    image_url: '/assets/image/Cisco Networking.png',
    price: 65.00,
    original_price: 350.00,
    instructor: 'CourseCity',
    rating: 4.8,
    reviews_count: 14,
    students_count: 18,
    course_id: 'cisco-networking-001'
  },
  {
    title: 'ChatGPT Tools and AI Mastery: Master Artificial Intelligence',
    description: 'Master ChatGPT and AI tools to boost productivity and creativity. Learn prompt engineering.',
    category: 'business',
    image_url: '/assets/image/ChatGPT Tools And AI Mastery.png',
    price: 55.00,
    original_price: 250.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 35,
    students_count: 42,
    course_id: 'chatgpt-ai-001'
  },
  {
    title: 'HTML, CSS & JavaScript: Complete Web Development Foundation',
    description: 'Master HTML, CSS, and JavaScript — the core technologies of web development.',
    category: 'development',
    image_url: '/assets/image/HTML.png',
    price: 35.00,
    original_price: 150.00,
    instructor: 'CourseCity',
    rating: 4.9,
    reviews_count: 41,
    students_count: 47,
    course_id: 'webdev-foundation-001'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting Supabase database seeding...\n');

    // Clear existing courses
    await db.query('DELETE FROM courses');
    console.log('✅ Cleared existing courses\n');

    // Insert courses
    for (const course of courses) {
      const result = await db.query(
        `INSERT INTO courses (
          title, description, category, image_url, price, original_price,
          instructor, rating, reviews_count, students_count, course_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          course.title, course.description, course.category,
          course.image_url, course.price, course.original_price, course.instructor,
          course.rating, course.reviews_count, course.students_count, course.course_id
        ]
      );
      console.log(`✅ Added: ${course.title} (ID: ${result.rows[0].id})`);
    }

    console.log(`\n🎉 Successfully seeded ${courses.length} courses!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
