// Data Migration Script
// Migrates user data from localStorage to MySQL database
// Run this once after setting up the backend to preserve existing data

async function migrateUserData() {
  try {
    console.log('🔄 Starting data migration from localStorage to MySQL...\n');

    // Check if backend is available
    const isBackendAvailable = await API.testConnection();
    if (!isBackendAvailable) {
      throw new Error('Backend server is not running. Please start the backend first.');
    }

    // Get data from localStorage
    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    const localTheme = localStorage.getItem('theme') || 'light';

    console.log(`📦 Found in localStorage:`);
    console.log(`   - Cart items: ${localCart.length}`);
    console.log(`   - Wishlist items: ${localWishlist.length}`);
    console.log(`   - User: ${localUser ? 'Yes' : 'No'}`);
    console.log(`   - Theme: ${localTheme}\n`);

    // Check if user is logged in
    let currentUser;
    try {
      const result = await API.getCurrentUser();
      currentUser = result.user;
      console.log(`✅ Logged in as: ${currentUser.email}\n`);
    } catch {
      console.log('❌ Not logged in. You need to log in first.\n');
      
      if (localUser && localUser.email) {
        console.log(`📝 Found local user account: ${localUser.email}`);
        console.log('   You can either:');
        console.log('   1. Login with existing account');
        console.log('   2. Register a new account\n');
        
        // For now, just inform the user
        alert('Please log in or register to migrate your data.');
        window.location.href = '../auth/login.html';
        return;
      } else {
        console.log('💡 Please log in or register to save your cart and wishlist.');
        return;
      }
    }

    let migratedCart = 0;
    let migratedWishlist = 0;

    // Migrate cart items
    if (localCart.length > 0) {
      console.log('📥 Migrating cart items...');
      
      // First, get all courses to map titles to IDs
      const coursesResponse = await API.getCourses();
      const courses = coursesResponse.courses;
      
      for (const item of localCart) {
        try {
          // Find course ID by title
          const course = courses.find(c => 
            c.title.toLowerCase().includes(item.title.toLowerCase()) ||
            item.title.toLowerCase().includes(c.title.toLowerCase())
          );
          
          if (course) {
            await API.addToCart(course.id, item.quantity || 1);
            console.log(`   ✅ Migrated: ${item.title}`);
            migratedCart++;
          } else {
            console.log(`   ⚠️ Skipped: ${item.title} (course not found in database)`);
          }
        } catch (error) {
          console.log(`   ⚠️ Skipped: ${item.title} (${error.message})`);
        }
      }
    }

    // Migrate wishlist items
    if (localWishlist.length > 0) {
      console.log('\n📥 Migrating wishlist items...');
      
      const coursesResponse = await API.getCourses();
      const courses = coursesResponse.courses;
      
      for (const item of localWishlist) {
        try {
          // Handle both old string format and new object format
          const itemTitle = typeof item === 'string' ? item : item.title;
          
          // Find course ID by title
          const course = courses.find(c => 
            c.title.toLowerCase().includes(itemTitle.toLowerCase()) ||
            itemTitle.toLowerCase().includes(c.title.toLowerCase())
          );
          
          if (course) {
            await API.addToWishlist(course.id);
            console.log(`   ✅ Migrated: ${itemTitle}`);
            migratedWishlist++;
          } else {
            console.log(`   ⚠️ Skipped: ${itemTitle} (course not found in database)`);
          }
        } catch (error) {
          console.log(`   ⚠️ Skipped: ${typeof item === 'string' ? item : item.title} (${error.message})`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Migration Complete!');
    console.log(`   - Cart items migrated: ${migratedCart}/${localCart.length}`);
    console.log(`   - Wishlist items migrated: ${migratedWishlist}/${localWishlist.length}`);
    console.log('='.repeat(50) + '\n');

    // Ask user if they want to clear localStorage
    const clearLocalStorage = confirm(
      'Migration complete! Do you want to clear your localStorage data?\n\n' +
      'Your data is now safely stored in the database.\n' +
      'Click OK to clear localStorage, or Cancel to keep it.'
    );

    if (clearLocalStorage) {
      // Keep theme, clear everything else
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);
      console.log('🧹 localStorage cleared (theme preserved)');
      alert('Migration successful! Your data has been moved to the database.');
    } else {
      console.log('💾 localStorage data preserved');
      alert('Migration successful! Your localStorage data is still available as backup.');
    }

    // Refresh the page to load data from database
    window.location.reload();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    alert(`Migration failed: ${error.message}\n\nPlease check the console for details.`);
  }
}

// Auto-run migration if called with ?migrate parameter
if (window.location.search.includes('migrate=true')) {
  console.log('🚀 Auto-starting migration...\n');
  migrateUserData();
}

// Expose function globally
window.migrateUserData = migrateUserData;


