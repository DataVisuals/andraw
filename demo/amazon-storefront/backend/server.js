const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Database } = require('duckdb');
const path = require('path');

const app = express();
const PORT = 3000;

// Helper function to convert BigInt to Number
const convertBigInt = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertBigInt(value)])
    );
  }
  return obj;
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize DuckDB
const db = new Database(':memory:');
const connection = db.connect();

// Initialize database schema and data
require('./init-db')(connection);

// Routes
app.get('/api/products', (req, res) => {
  const { search, category, minPrice, maxPrice, inStock, maxDeliveryDays, minRating, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM products WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
  const params = [];
  const countParams = [];

  if (search) {
    query += ' AND (name ILIKE ? OR description ILIKE ?)';
    countQuery += ' AND (name ILIKE ? OR description ILIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ' AND category = ?';
    countQuery += ' AND category = ?';
    params.push(category);
    countParams.push(category);
  }

  if (minPrice) {
    query += ' AND price >= ?';
    countQuery += ' AND price >= ?';
    params.push(parseFloat(minPrice));
    countParams.push(parseFloat(minPrice));
  }

  if (maxPrice) {
    query += ' AND price <= ?';
    countQuery += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
    countParams.push(parseFloat(maxPrice));
  }

  if (inStock === 'true') {
    query += ' AND stock_quantity > 0';
    countQuery += ' AND stock_quantity > 0';
  }

  if (maxDeliveryDays) {
    query += ' AND lead_time_days <= ?';
    countQuery += ' AND lead_time_days <= ?';
    params.push(parseInt(maxDeliveryDays));
    countParams.push(parseInt(maxDeliveryDays));
  }

  if (minRating) {
    query += ' AND rating >= ?';
    countQuery += ' AND rating >= ?';
    params.push(parseFloat(minRating));
    countParams.push(parseFloat(minRating));
  }

  query += ` ORDER BY id LIMIT ${limit} OFFSET ${offset}`;

  connection.all(query, ...params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    connection.all(countQuery, ...countParams, (err, countRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json(convertBigInt({
        products: rows,
        total: countRows[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }));
    });
  });
});

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;

  connection.all('SELECT * FROM products WHERE id = ?', id, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(convertBigInt(rows[0]));
  });
});

app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;

  connection.all('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', id, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(convertBigInt(rows));
  });
});

app.post('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { rating, title, comment, reviewer_name } = req.body;

  if (!rating || !title || !comment || !reviewer_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO reviews (product_id, rating, title, comment, reviewer_name, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  connection.run(query, id, rating, title, comment, reviewer_name, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ message: 'Review added successfully' });
  });
});

app.post('/api/orders', (req, res) => {
  const { items, total, shipping_address, credit_card } = req.body;

  if (!items || !total || !shipping_address || !credit_card) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // In a real application, you would process the payment here
  // For now, we'll just store the order

  const query = `
    INSERT INTO orders (items, total, shipping_address, status, created_at)
    VALUES (?, ?, ?, 'processing', CURRENT_TIMESTAMP)
  `;

  connection.run(query, JSON.stringify(items), total, JSON.stringify(shipping_address), (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    connection.all('SELECT last_insert_rowid() as id', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json(convertBigInt({
        message: 'Order placed successfully',
        orderId: rows[0].id
      }));
    });
  });
});

app.get('/api/categories', (req, res) => {
  connection.all('SELECT DISTINCT category FROM products ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows.map(row => row.category));
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
