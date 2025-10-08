import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { I18nService, Country } from '../../services/i18n.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cartItems: CartItem[] = [];
  countries: Country[] = [];

  constructor(
    public cartService: CartService,
    private router: Router,
    public i18nService: I18nService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.countries = this.i18nService.getCountries();
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
    });
  }

  removeItem(productId: number): void {
    if (confirm('Are you sure you want to remove this item?')) {
      this.cartService.removeFromCart(productId);
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity > 0) {
      this.cartService.updateQuantity(productId, quantity);
    }
  }

  incrementQuantity(item: CartItem): void {
    if (item.quantity < item.product.stock_quantity) {
      this.updateQuantity(item.product.id, item.quantity + 1);
    }
  }

  decrementQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity(item.product.id, item.quantity - 1);
    }
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getTax(): number {
    return this.getSubtotal() * 0.08; // 8% tax
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }

  selectCountry(countryCode: string): void {
    this.i18nService.setCountry(countryCode);
  }

  convertPrice(priceInUSD: number): number {
    const targetCurrency = this.i18nService.getCurrentCountry().currency;
    return this.currencyService.convertAndRound(priceInUSD, targetCurrency);
  }
}
