require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/config/database');

async function optimize() {
    console.log('🚀 Starting database optimization...');
    try {
        await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        console.log('✅ Database indexes created successfully!');
    } catch (err) {
        console.error('❌ Error optimizing database:', err.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

optimize();
