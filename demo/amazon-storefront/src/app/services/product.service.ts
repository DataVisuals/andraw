import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  stock_quantity: number;
  lead_time_days: number;
  rating: number;
  review_count: number;
}

export interface Review {
  id?: number;
  product_id: number;
  rating: number;
  title: string;
  comment: string;
  reviewer_name: string;
  created_at?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getProducts(
    search?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    page: number = 1,
    limit: number = 20,
    inStock?: boolean,
    maxDeliveryDays?: number,
    minRating?: number
  ): Observable<ProductListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (minPrice !== undefined) {
      params = params.set('minPrice', minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params = params.set('maxPrice', maxPrice.toString());
    }
    if (inStock !== undefined) {
      params = params.set('inStock', inStock.toString());
    }
    if (maxDeliveryDays !== undefined) {
      params = params.set('maxDeliveryDays', maxDeliveryDays.toString());
    }
    if (minRating !== undefined) {
      params = params.set('minRating', minRating.toString());
    }

    return this.http.get<ProductListResponse>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductReviews(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/products/${productId}/reviews`);
  }

  addReview(productId: number, review: Omit<Review, 'id' | 'product_id' | 'created_at'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${productId}/reviews`, review);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }
}
