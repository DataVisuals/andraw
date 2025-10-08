import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService, Product, Review } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { I18nService, Country } from '../../services/i18n.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  reviews: Review[] = [];
  loading: boolean = true;
  quantity: number = 1;
  countries: Country[] = [];

  // Review form
  showReviewForm: boolean = false;
  newReview = {
    rating: 5,
    title: '',
    comment: '',
    reviewer_name: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    public cartService: CartService,
    public i18nService: I18nService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.countries = this.i18nService.getCountries();
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadProduct(id);
      this.loadReviews(id);
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.loading = false;
      }
    });
  }

  loadReviews(id: number): void {
    this.productService.getProductReviews(id).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
      }
    });
  }

  addToCart(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      alert(`${this.quantity} x ${this.product.name} added to cart!`);
    }
  }

  buyNow(): void {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  submitReview(): void {
    if (!this.product) return;

    if (!this.newReview.title || !this.newReview.comment || !this.newReview.reviewer_name) {
      alert('Please fill in all review fields');
      return;
    }

    this.productService.addReview(this.product.id, this.newReview).subscribe({
      next: () => {
        alert('Review submitted successfully!');
        this.loadReviews(this.product!.id);
        this.showReviewForm = false;
        this.resetReviewForm();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        alert('Failed to submit review. Please try again.');
      }
    });
  }

  resetReviewForm(): void {
    this.newReview = {
      rating: 5,
      title: '',
      comment: '',
      reviewer_name: ''
    };
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock_quantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  selectCountry(countryCode: string): void {
    this.i18nService.setCountry(countryCode);
  }

  convertPrice(priceInUSD: number): number {
    const targetCurrency = this.i18nService.getCurrentCountry().currency;
    return this.currencyService.convertAndRound(priceInUSD, targetCurrency);
  }
}
