import { Injectable } from '@angular/core';

export interface ExchangeRates {
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  // Exchange rates relative to USD (base currency)
  // Updated as of common market rates
  private exchangeRates: ExchangeRates = {
    'USD': 1.00,      // US Dollar (base)
    'GBP': 0.79,      // British Pound
    'EUR': 0.92,      // Euro
    'CAD': 1.36,      // Canadian Dollar
    'AUD': 1.53,      // Australian Dollar
    'JPY': 149.50,    // Japanese Yen
    'CNY': 7.24,      // Chinese Yuan
    'INR': 83.12,     // Indian Rupee
    'BRL': 4.97,      // Brazilian Real
    'MXN': 17.08      // Mexican Peso
  };

  constructor() {}

  /**
   * Convert price from USD to target currency
   */
  convert(priceInUSD: number, targetCurrency: string): number {
    const rate = this.exchangeRates[targetCurrency];
    if (!rate) {
      console.warn(`Exchange rate not found for ${targetCurrency}, using USD`);
      return priceInUSD;
    }
    return priceInUSD * rate;
  }

  /**
   * Convert price from any currency to another
   */
  convertBetween(price: number, fromCurrency: string, toCurrency: string): number {
    // First convert to USD, then to target currency
    const priceInUSD = price / (this.exchangeRates[fromCurrency] || 1);
    return this.convert(priceInUSD, toCurrency);
  }

  /**
   * Get exchange rate for a currency
   */
  getRate(currency: string): number {
    return this.exchangeRates[currency] || 1;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(this.exchangeRates);
  }

  /**
   * Round price to appropriate decimal places for currency
   */
  roundPrice(price: number, currency: string): number {
    // JPY doesn't use decimal places
    if (currency === 'JPY' || currency === 'CNY') {
      return Math.round(price);
    }
    // Most currencies use 2 decimal places
    return Math.round(price * 100) / 100;
  }

  /**
   * Convert and format price
   */
  convertAndRound(priceInUSD: number, targetCurrency: string): number {
    const converted = this.convert(priceInUSD, targetCurrency);
    return this.roundPrice(converted, targetCurrency);
  }
}
