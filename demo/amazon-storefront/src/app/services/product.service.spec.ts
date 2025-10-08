import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, Product, Review, ProductListResponse } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProducts', () => {
    it('should fetch products with default parameters', () => {
      const mockResponse: ProductListResponse = {
        products: [
          {
            id: 1,
            name: 'Product 1',
            description: 'Description 1',
            price: 99.99,
            category: 'Electronics',
            image_url: 'image1.jpg',
            stock_quantity: 10,
            lead_time_days: 3,
            rating: 4.5,
            review_count: 100
          }
        ],
        total: 1,
        page: 1,
        limit: 20
      };

      service.getProducts().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.products.length).toBe(1);
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('20');
      req.flush(mockResponse);
    });

    it('should include search parameter when provided', () => {
      const mockResponse: ProductListResponse = {
        products: [],
        total: 0,
        page: 1,
        limit: 20
      };

      service.getProducts('iPhone').subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('search')).toBe('iPhone');
      req.flush(mockResponse);
    });

    it('should include category parameter when provided', () => {
      const mockResponse: ProductListResponse = {
        products: [],
        total: 0,
        page: 1,
        limit: 20
      };

      service.getProducts(undefined, 'Electronics').subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('category')).toBe('Electronics');
      req.flush(mockResponse);
    });

    it('should include price range parameters when provided', () => {
      const mockResponse: ProductListResponse = {
        products: [],
        total: 0,
        page: 1,
        limit: 20
      };

      service.getProducts(undefined, undefined, 100, 500).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('minPrice')).toBe('100');
      expect(req.request.params.get('maxPrice')).toBe('500');
      req.flush(mockResponse);
    });

    it('should handle custom pagination', () => {
      const mockResponse: ProductListResponse = {
        products: [],
        total: 100,
        page: 3,
        limit: 10
      };

      service.getProducts(undefined, undefined, undefined, undefined, 3, 10).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockResponse);
    });

    it('should handle all filters together', () => {
      const mockResponse: ProductListResponse = {
        products: [],
        total: 0,
        page: 2,
        limit: 15
      };

      service.getProducts('laptop', 'Electronics', 500, 2000, 2, 15).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('search')).toBe('laptop');
      expect(req.request.params.get('category')).toBe('Electronics');
      expect(req.request.params.get('minPrice')).toBe('500');
      expect(req.request.params.get('maxPrice')).toBe('2000');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('15');
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.getProducts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getProduct', () => {
    it('should fetch a single product by id', () => {
      const mockProduct: Product = {
        id: 1,
        name: 'Product 1',
        description: 'Description 1',
        price: 99.99,
        category: 'Electronics',
        image_url: 'image1.jpg',
        stock_quantity: 10,
        lead_time_days: 3,
        rating: 4.5,
        review_count: 100
      };

      service.getProduct(1).subscribe(product => {
        expect(product).toEqual(mockProduct);
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProduct);
    });

    it('should handle 404 for non-existent product', () => {
      service.getProduct(999).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/products/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getProductReviews', () => {
    it('should fetch reviews for a product', () => {
      const mockReviews: Review[] = [
        {
          id: 1,
          product_id: 1,
          rating: 5,
          title: 'Great product',
          comment: 'Highly recommended',
          reviewer_name: 'John Doe',
          created_at: '2024-01-01'
        }
      ];

      service.getProductReviews(1).subscribe(reviews => {
        expect(reviews).toEqual(mockReviews);
        expect(reviews.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1/reviews`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReviews);
    });

    it('should return empty array when no reviews', () => {
      service.getProductReviews(1).subscribe(reviews => {
        expect(reviews).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1/reviews`);
      req.flush([]);
    });
  });

  describe('addReview', () => {
    it('should post a new review', () => {
      const newReview = {
        rating: 5,
        title: 'Excellent',
        comment: 'Great product!',
        reviewer_name: 'Jane Doe'
      };

      service.addReview(1, newReview).subscribe(response => {
        expect(response.message).toBe('Review added successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1/reviews`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newReview);
      req.flush({ message: 'Review added successfully' });
    });

    it('should handle validation errors', () => {
      const invalidReview = {
        rating: 5,
        title: '',
        comment: '',
        reviewer_name: ''
      };

      service.addReview(1, invalidReview).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/products/1/reviews`);
      req.flush({ error: 'Missing required fields' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', () => {
      const mockCategories = ['Electronics', 'Books', 'Clothing'];

      service.getCategories().subscribe(categories => {
        expect(categories).toEqual(mockCategories);
        expect(categories.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategories);
    });

    it('should return empty array when no categories', () => {
      service.getCategories().subscribe(categories => {
        expect(categories).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/categories`);
      req.flush([]);
    });
  });

  describe('edge cases', () => {
    it('should handle very large product IDs', () => {
      const mockProduct: Product = {
        id: 999999999,
        name: 'Product',
        description: 'Description',
        price: 99.99,
        category: 'Electronics',
        image_url: 'image.jpg',
        stock_quantity: 10,
        lead_time_days: 3,
        rating: 4.5,
        review_count: 100
      };

      service.getProduct(999999999).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/products/999999999`);
      req.flush(mockProduct);
    });

    it('should handle special characters in search', () => {
      service.getProducts('product & "test"').subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('search')).toBe('product & "test"');
      req.flush({ products: [], total: 0, page: 1, limit: 20 });
    });

    it('should handle negative prices in filters', () => {
      service.getProducts(undefined, undefined, -100, -50).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('minPrice')).toBe('-100');
      expect(req.request.params.get('maxPrice')).toBe('-50');
      req.flush({ products: [], total: 0, page: 1, limit: 20 });
    });

    it('should handle price filters where min > max', () => {
      service.getProducts(undefined, undefined, 500, 100).subscribe();

      const req = httpMock.expectOne(req => req.url.includes('/api/products'));
      expect(req.request.params.get('minPrice')).toBe('500');
      expect(req.request.params.get('maxPrice')).toBe('100');
      req.flush({ products: [], total: 0, page: 1, limit: 20 });
    });
  });
});
