import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { OrderService, ShippingAddress, CreditCard } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  currentStep: number = 1; // 1: Shipping, 2: Payment, 3: Review

  shippingAddress: ShippingAddress = {
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: ''
  };

  creditCard: CreditCard = {
    cardNumber: '',
    cardHolderName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: ''
  };

  months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  years: string[] = [];
  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  processingOrder = false;
  orderPlaced = false;
  orderId: number | null = null;

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {
    // Generate years for credit card expiration
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      this.years.push((currentYear + i).toString());
    }
  }

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      if (items.length === 0 && !this.orderPlaced) {
        this.router.navigate(['/cart']);
      }
    });
  }

  getSubtotal(): number {
    return this.cartService.getTotal();
  }

  getTax(): number {
    return this.getSubtotal() * 0.08;
  }

  getTotal(): number {
    return this.getSubtotal() + this.getTax();
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.validateShippingAddress()) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.validatePayment()) {
      this.currentStep = 3;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateShippingAddress(): boolean {
    const addr = this.shippingAddress;
    if (!addr.fullName || !addr.addressLine1 || !addr.city || !addr.state || !addr.zipCode) {
      alert('Please fill in all required shipping address fields.');
      return false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(addr.zipCode)) {
      alert('Please enter a valid ZIP code (e.g., 12345 or 12345-6789).');
      return false;
    }
    return true;
  }

  validatePayment(): boolean {
    const card = this.creditCard;
    if (!card.cardNumber || !card.cardHolderName || !card.expirationMonth || !card.expirationYear || !card.cvv) {
      alert('Please fill in all credit card fields.');
      return false;
    }

    // Remove spaces and validate card number
    const cardNum = card.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNum)) {
      alert('Please enter a valid credit card number (13-19 digits).');
      return false;
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(card.cvv)) {
      alert('Please enter a valid CVV (3-4 digits).');
      return false;
    }

    return true;
  }

  formatCardNumber(): void {
    // Format card number with spaces every 4 digits
    let value = this.creditCard.cardNumber.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    this.creditCard.cardNumber = formattedValue;
  }

  placeOrder(): void {
    if (!this.validateShippingAddress() || !this.validatePayment()) {
      return;
    }

    this.processingOrder = true;

    const order = {
      items: this.cartItems.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      total: this.getTotal(),
      shipping_address: this.shippingAddress,
      credit_card: {
        ...this.creditCard,
        cardNumber: '****' + this.creditCard.cardNumber.slice(-4) // Only store last 4 digits
      }
    };

    this.orderService.placeOrder(order).subscribe({
      next: (response) => {
        this.processingOrder = false;
        this.orderPlaced = true;
        this.orderId = response.orderId;
        this.cartService.clearCart();
        window.scrollTo(0, 0);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.processingOrder = false;
        alert('Failed to place order. Please try again.');
      }
    });
  }

  continueShopping(): void {
    this.router.navigate(['/']);
  }
}
