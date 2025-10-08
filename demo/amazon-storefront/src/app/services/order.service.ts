import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Order {
  items: any[];
  total: number;
  shipping_address: ShippingAddress;
  credit_card: CreditCard;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CreditCard {
  cardNumber: string;
  cardHolderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  placeOrder(order: Order): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, order);
  }
}
