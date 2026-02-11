const db = require('../config/database');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.log('nodemailer module not found; admin order emails will be disabled.');
}

async function sendAdminOrderEmail(orderSummary, user) {
  if (!nodemailer) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'coursecity0@gmail.com';
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('SMTP configuration missing; skipping admin order email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass }
  });

  const buyerEmail = user && user.email ? user.email : 'Unknown';
  const lines = (orderSummary.items || []).map(item => {
    const qty = item.quantity || 1;
    const price = typeof item.price === 'number' ? item.price.toFixed(2) : item.price;
    return `- Course ID: ${item.course_id} | Price: GH₵${price} x ${qty}`;
  }).join('\n') || 'No detailed items available.';

  const subject = `New CourseCity order #${orderSummary.orderId}`;
  const text = [
    'A new order has been placed on CourseCity.',
    '',
    `Order ID: ${orderSummary.orderId}`,
    `User ID: ${orderSummary.userId}`,
    `User Email: ${buyerEmail}`,
    `Payment Method: ${orderSummary.paymentMethod || 'paystack'}`,
    `Total Amount: GH₵${orderSummary.total.toFixed(2)}`,
    '',
    'Items:',
    lines,
    '',
    `Paystack Reference: ${orderSummary.paystackReference || 'N/A'}`,
    '',
    'You are receiving this email because you are set as the admin for CourseCity.'
  ].join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || adminEmail,
    to: adminEmail,
    subject,
    text
  });
}

async function createAdminNotificationEntry(orderSummary) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'coursecity0@gmail.com';
    const admins = await db.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [adminEmail]
    );

    if (admins.rows.length === 0) {
      console.log('Admin user not found for notifications; skipping admin notification.');
      return;
    }

    const adminId = admins.rows[0].id;
    const title = 'New course purchase completed';
    const message = `Order #${orderSummary.orderId} completed for user ID ${orderSummary.userId} with total GH₵${orderSummary.total.toFixed(2)}.`;

    await db.query(
      'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
      [adminId, 'order', title, message]
    );
  } catch (error) {
    console.error('Error creating admin notification entry:', error);
  }
}

// Get user's orders
exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, total_amount, status, payment_method, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orders = result.rows;

    // Get order items for each order
    for (let order of orders) {
      const itemsResult = await db.query(
        `SELECT oi.id, oi.course_id, oi.price, oi.quantity,
                co.title, co.image_url, co.instructor
         FROM order_items oi
         JOIN courses co ON oi.course_id = co.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// Get single order
exports.getOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.id, oi.course_id, oi.price, oi.quantity,
              co.title, co.image_url, co.instructor, co.description
       FROM order_items oi
       JOIN courses co ON oi.course_id = co.id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    res.json({
      success: true,
      order
    });
  } catch (error) {
    next(error);
  }
};

// Create order (checkout)
exports.createOrder = async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const { payment_method = 'card', cart_items, paystack_reference } = req.body;

    // Get cart items if not provided
    let items = cart_items;
    if (!items) {
      const cartItemsResult = await client.query(
        `SELECT c.course_id, c.quantity, co.price
         FROM cart c
         JOIN courses co ON c.course_id = co.id
         WHERE c.user_id = $1`,
        [userId]
      );
      items = cartItemsResult.rows;
    }

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No items to checkout' });
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, total, payment_method, 'completed']
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, course_id, price, quantity) VALUES ($1, $2, $3, $4)',
        [orderId, item.course_id, item.price, item.quantity || 1]
      );
    }

    // Clear cart
    await client.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    const orderSummary = {
      orderId, total, userId,
      paymentMethod: payment_method,
      paystackReference: paystack_reference || null,
      items
    };

    try {
      await sendAdminOrderEmail(orderSummary, req.user);
      await createAdminNotificationEntry(orderSummary);
    } catch (notifyError) {
      console.error('Error sending admin notifications for order:', notifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId,
      total: total.toFixed(2)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
