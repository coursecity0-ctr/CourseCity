// Test Backend Endpoints
// Quick verification that all API endpoints are working

const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing CourseCity Backend Endpoints\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣  Testing /api/test...');
    const testRes = await fetch(`${API_URL}/test`);
    const testData = await testRes.json();
    console.log('✅', testData.message);

    // Test 2: Database connection
    console.log('\n2️⃣  Testing /api/test-db...');
    const dbRes = await fetch(`${API_URL}/test-db`);
    const dbData = await dbRes.json();
    console.log('✅ Database:', dbData.database);
    console.log('✅ Message:', dbData.message);

    // Test 3: Get all courses
    console.log('\n3️⃣  Testing /api/courses...');
    const coursesRes = await fetch(`${API_URL}/courses`);
    const coursesData = await coursesRes.json();
    console.log(`✅ Found ${coursesData.count} courses`);
    console.log('✅ Sample course:', coursesData.courses[0]?.title);

    // Test 4: Get single course
    if (coursesData.courses.length > 0) {
      console.log('\n4️⃣  Testing /api/courses/:id...');
      const courseId = coursesData.courses[0].id;
      const courseRes = await fetch(`${API_URL}/courses/${courseId}`);
      const courseData = await courseRes.json();
      console.log('✅ Course title:', courseData.course.title);
      console.log('✅ Price: GH₵' + courseData.course.price);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 All tests passed! Backend is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the backend server is running on port 5000\n');
  }
}

testEndpoints();


