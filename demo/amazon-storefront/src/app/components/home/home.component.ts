import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { I18nService, Country } from '../../services/i18n.service';
import { CurrencyService } from '../../services/currency.service';
import { SystemBannerComponent } from '../system-banner/system-banner.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SystemBannerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  categories: string[] = [];
  selectedCategory: string = '';
  searchTerm: string = '';
  minPrice: number | undefined;
  maxPrice: number | undefined;
  inStockOnly: boolean = false;
  maxDeliveryDays: number | undefined;
  minRating: number | undefined;
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;
  loading: boolean = false;
  showCountrySelector: boolean = false;
  showAdvancedFilters: boolean = false;
  countries: Country[] = [];

  constructor(
    private productService: ProductService,
    public cartService: CartService,
    public i18nService: I18nService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.countries = this.i18nService.getCountries();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(
      this.searchTerm || undefined,
      this.selectedCategory || undefined,
      this.minPrice,
      this.maxPrice,
      this.currentPage,
      20,
      this.inStockOnly || undefined,
      this.maxDeliveryDays,
      this.minRating
    ).subscribe({
      next: (response) => {
        this.products = response.products;
        this.totalProducts = response.total;
        this.totalPages = Math.ceil(response.total / response.limit);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onPriceFilter(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = undefined;
    this.maxPrice = undefined;
    this.inStockOnly = false;
    this.maxDeliveryDays = undefined;
    this.minRating = undefined;
    this.currentPage = 1;
    this.loadProducts();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
      window.scrollTo(0, 0);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
      window.scrollTo(0, 0);
    }
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
    alert(`${product.name} added to cart!`);
  }

  getStarArray(rating: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(rating));
    }
    return stars;
  }

  selectCountry(countryCode: string): void {
    this.i18nService.setCountry(countryCode);
  }

  convertPrice(priceInUSD: number): number {
    const targetCurrency = this.i18nService.getCurrentCountry().currency;
    return this.currencyService.convertAndRound(priceInUSD, targetCurrency);
  }
}

