const request = require('supertest');
const { Database } = require('duckdb');

// Mock DuckDB before requiring the server
jest.mock('duckdb');

let app;
let mockConnection;
let mockDb;

beforeAll(() => {
  // Setup mock connection methods
  mockConnection = {
    all: jest.fn(),
    run: jest.fn(),
    prepare: jest.fn(() => ({
      run: jest.fn(),
      finalize: jest.fn()
    }))
  };

  // Setup mock database
  mockDb = {
    connect: jest.fn(() => mockConnection)
  };

  Database.mockImplementation(() => mockDb);

  // Now require the server after mocking
  app = require('./server');
});

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 99.99 },
        { id: 2, name: 'Product 2', price: 149.99 }
      ];

      mockConnection.all
        .mockImplementationOnce((query, ...args) => {
          const callback = args[args.length - 1];
          callback(null, mockProducts);
        })
        .mockImplementationOnce((query, callback) => {
          callback(null, [{ total: 2 }]);
        });

      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.products).toEqual(mockProducts);
      expect(response.body.total).toBe(2);
    });

    it('should filter products by search term', async () => {
      const mockProducts = [
        { id: 1, name: 'iPhone 15', price: 999.99 }
      ];

      mockConnection.all
        .mockImplementationOnce((query, ...args) => {
          expect(query).toContain('ILIKE');
          const callback = args[args.length - 1];
          callback(null, mockProducts);
        })
        .mockImplementationOnce((query, callback) => {
          callback(null, [{ total: 1 }]);
        });

      const response = await request(app)
        .get('/api/products')
        .query({ search: 'iPhone', page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.products).toEqual(mockProducts);
    });

    it('should filter products by category', async () => {
      mockConnection.all
        .mockImplementationOnce((query, ...args) => {
          expect(query).toContain('category');
          const callback = args[args.length - 1];
          callback(null, []);
        })
        .mockImplementationOnce((query, callback) => {
          callback(null, [{ total: 0 }]);
        });

      await request(app)
        .get('/api/products')
        .query({ category: 'Electronics', page: 1, limit: 20 });

      expect(mockConnection.all).toHaveBeenCalled();
    });

    it('should filter products by price range', async () => {
      mockConnection.all
        .mockImplementationOnce((query, ...args) => {
          expect(query).toContain('price >=');
          expect(query).toContain('price <=');
          const callback = args[args.length - 1];
          callback(null, []);
        })
        .mockImplementationOnce((query, callback) => {
          callback(null, [{ total: 0 }]);
        });

      await request(app)
        .get('/api/products')
        .query({ minPrice: 100, maxPrice: 500, page: 1, limit: 20 });

      expect(mockConnection.all).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockConnection.all.mockImplementationOnce((query, ...args) => {
        const callback = args[args.length - 1];
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/api/products')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a single product', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 99.99 };

      mockConnection.all.mockImplementationOnce((query, id, callback) => {
        callback(null, [mockProduct]);
      });

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
    });

    it('should return 404 for non-existent product', async () => {
      mockConnection.all.mockImplementationOnce((query, id, callback) => {
        callback(null, []);
      });

      const response = await request(app).get('/api/products/999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('GET /api/products/:id/reviews', () => {
    it('should return reviews for a product', async () => {
      const mockReviews = [
        { id: 1, product_id: 1, rating: 5, title: 'Great!', comment: 'Excellent product' }
      ];

      mockConnection.all.mockImplementationOnce((query, id, callback) => {
        callback(null, mockReviews);
      });

      const response = await request(app).get('/api/products/1/reviews');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReviews);
    });
  });

  describe('POST /api/products/:id/reviews', () => {
    it('should add a review', async () => {
      const newReview = {
        rating: 5,
        title: 'Excellent',
        comment: 'Great product!',
        reviewer_name: 'John Doe'
      };

      mockConnection.run.mockImplementationOnce((query, ...args) => {
        const callback = args[args.length - 1];
        callback(null);
      });

      const response = await request(app)
        .post('/api/products/1/reviews')
        .send(newReview);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Review added successfully');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/products/1/reviews')
        .send({ rating: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('POST /api/orders', () => {
    it('should create an order', async () => {
      const order = {
        items: [{ product_id: 1, quantity: 2 }],
        total: 199.98,
        shipping_address: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        credit_card: {
          cardNumber: '4111111111111111',
          cardHolderName: 'John Doe',
          expirationMonth: '12',
          expirationYear: '2025',
          cvv: '123'
        }
      };

      mockConnection.run.mockImplementationOnce((query, ...args) => {
        const callback = args[args.length - 1];
        callback(null);
      });

      mockConnection.all.mockImplementationOnce((query, callback) => {
        callback(null, [{ id: 1 }]);
      });

      const response = await request(app)
        .post('/api/orders')
        .send(order);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Order placed successfully');
      expect(response.body.orderId).toBe(1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { category: 'Electronics' },
        { category: 'Books' },
        { category: 'Clothing' }
      ];

      mockConnection.all.mockImplementationOnce((query, callback) => {
        callback(null, mockCategories);
      });

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(['Electronics', 'Books', 'Clothing']);
    });
  });
});
