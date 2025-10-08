import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart.service';
import { Product } from './product.service';

describe('CartService', () => {
  let service: CartService;
  let mockProduct: Product;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    localStorage.clear();

    mockProduct = {
      id: 1,
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'Electronics',
      image_url: 'test.jpg',
      stock_quantity: 10,
      lead_time_days: 3,
      rating: 4.5,
      review_count: 100
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addToCart', () => {
    it('should add a product to the cart', (done) => {
      service.addToCart(mockProduct, 1);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(1);
        expect(cart[0].product.id).toBe(mockProduct.id);
        expect(cart[0].quantity).toBe(1);
        done();
      });
    });

    it('should increase quantity if product already in cart', (done) => {
      service.addToCart(mockProduct, 1);
      service.addToCart(mockProduct, 2);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(1);
        expect(cart[0].quantity).toBe(3);
        done();
      });
    });

    it('should add multiple quantities at once', (done) => {
      service.addToCart(mockProduct, 5);

      service.cart$.subscribe(cart => {
        expect(cart[0].quantity).toBe(5);
        done();
      });
    });

    it('should persist cart to localStorage', () => {
      service.addToCart(mockProduct, 1);

      const savedCart = localStorage.getItem('cart');
      expect(savedCart).toBeTruthy();

      const parsedCart = JSON.parse(savedCart!);
      expect(parsedCart.length).toBe(1);
      expect(parsedCart[0].product.id).toBe(mockProduct.id);
    });
  });

  describe('removeFromCart', () => {
    it('should remove a product from the cart', (done) => {
      service.addToCart(mockProduct, 1);
      service.removeFromCart(mockProduct.id);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(0);
        done();
      });
    });

    it('should not throw error when removing non-existent product', () => {
      expect(() => service.removeFromCart(999)).not.toThrow();
    });
  });

  describe('updateQuantity', () => {
    it('should update product quantity', (done) => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, 5);

      service.cart$.subscribe(cart => {
        expect(cart[0].quantity).toBe(5);
        done();
      });
    });

    it('should remove product if quantity is 0', (done) => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, 0);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(0);
        done();
      });
    });

    it('should remove product if quantity is negative', (done) => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, -1);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(0);
        done();
      });
    });

    it('should not update if product not in cart', (done) => {
      service.updateQuantity(999, 5);

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(0);
        done();
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', (done) => {
      service.addToCart(mockProduct, 1);
      service.addToCart({ ...mockProduct, id: 2 }, 2);
      service.clearCart();

      service.cart$.subscribe(cart => {
        expect(cart.length).toBe(0);
        done();
      });
    });

    it('should clear localStorage', () => {
      service.addToCart(mockProduct, 1);
      service.clearCart();

      const savedCart = localStorage.getItem('cart');
      const parsedCart = JSON.parse(savedCart!);
      expect(parsedCart.length).toBe(0);
    });
  });

  describe('getCart', () => {
    it('should return current cart items', () => {
      service.addToCart(mockProduct, 1);
      const cart = service.getCart();

      expect(cart.length).toBe(1);
      expect(cart[0].product.id).toBe(mockProduct.id);
    });
  });

  describe('getTotal', () => {
    it('should calculate total price', () => {
      service.addToCart(mockProduct, 2);
      const total = service.getTotal();

      expect(total).toBe(mockProduct.price * 2);
    });

    it('should return 0 for empty cart', () => {
      const total = service.getTotal();
      expect(total).toBe(0);
    });

    it('should calculate total for multiple products', () => {
      const product2 = { ...mockProduct, id: 2, price: 50.00 };
      service.addToCart(mockProduct, 2); // 199.98
      service.addToCart(product2, 3); // 150.00

      const total = service.getTotal();
      expect(total).toBe(349.98);
    });
  });

  describe('getItemCount', () => {
    it('should return total item count', () => {
      service.addToCart(mockProduct, 2);
      const count = service.getItemCount();

      expect(count).toBe(2);
    });

    it('should return 0 for empty cart', () => {
      const count = service.getItemCount();
      expect(count).toBe(0);
    });

    it('should sum quantities from multiple products', () => {
      service.addToCart(mockProduct, 2);
      service.addToCart({ ...mockProduct, id: 2 }, 3);

      const count = service.getItemCount();
      expect(count).toBe(5);
    });
  });

  describe('localStorage persistence', () => {
    it('should load cart from localStorage on initialization', () => {
      const cartData: CartItem[] = [{
        product: mockProduct,
        quantity: 3
      }];

      localStorage.setItem('cart', JSON.stringify(cartData));

      // Create new service instance
      const newService = new CartService();

      expect(newService.getCart().length).toBe(1);
      expect(newService.getCart()[0].quantity).toBe(3);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('cart', 'invalid json');

      expect(() => new CartService()).toThrow();
    });

    it('should handle empty localStorage', () => {
      const newService = new CartService();
      expect(newService.getCart().length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large quantities', (done) => {
      service.addToCart(mockProduct, 1000000);

      service.cart$.subscribe(cart => {
        expect(cart[0].quantity).toBe(1000000);
        expect(service.getTotal()).toBe(mockProduct.price * 1000000);
        done();
      });
    });

    it('should handle decimal prices correctly', () => {
      const product = { ...mockProduct, price: 19.99 };
      service.addToCart(product, 3);

      const total = service.getTotal();
      expect(total).toBeCloseTo(59.97, 2);
    });

    it('should handle products with 0 price', () => {
      const freeProduct = { ...mockProduct, price: 0 };
      service.addToCart(freeProduct, 5);

      const total = service.getTotal();
      expect(total).toBe(0);
    });
  });
});
