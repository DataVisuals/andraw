import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  flag: string;
  language: string;
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private countries: Country[] = [
    { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', locale: 'en-US', flag: '🇺🇸', language: 'en' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', locale: 'en-GB', flag: '🇬🇧', language: 'en' },
    { code: 'EU', name: 'European Union', currency: 'EUR', currencySymbol: '€', locale: 'de-DE', flag: '🇪🇺', language: 'en' },
    { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$', locale: 'en-CA', flag: '🇨🇦', language: 'en' },
    { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$', locale: 'en-AU', flag: '🇦🇺', language: 'en' },
    { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥', locale: 'ja-JP', flag: '🇯🇵', language: 'ja' },
    { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥', locale: 'zh-CN', flag: '🇨🇳', language: 'zh' },
    { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', locale: 'en-IN', flag: '🇮🇳', language: 'en' },
    { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', locale: 'pt-BR', flag: '🇧🇷', language: 'pt' },
    { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: 'Mex$', locale: 'es-MX', flag: '🇲🇽', language: 'es' }
  ];

  private translations: Translations = {
    en: {
      'search': 'Search Products',
      'search.placeholder': 'Search...',
      'category': 'Category',
      'all.categories': 'All Categories',
      'min.price': 'Min Price',
      'max.price': 'Max Price',
      'clear': 'Clear',
      'showing': 'Showing',
      'of': 'of',
      'products': 'products',
      'in': 'in',
      'add.to.cart': 'Add to Cart',
      'view.details': 'View Details',
      'cart': 'Cart',
      'checkout': 'Checkout',
      'buy.now': 'Buy Now',
      'in.stock': 'In Stock',
      'out.of.stock': 'Out of Stock',
      'delivery.in': 'Delivery in',
      'day': 'day',
      'days': 'days',
      'available': 'available',
      'reviews': 'reviews',
      'review': 'review',
      'write.review': 'Write a Review',
      'your.name': 'Your Name',
      'review.title': 'Review Title',
      'submit.review': 'Submit Review',
      'cancel': 'Cancel',
      'subtotal': 'Subtotal',
      'tax': 'Tax',
      'total': 'Total',
      'shipping': 'Shipping',
      'free': 'FREE',
      'continue.shopping': 'Continue Shopping',
      'proceed.to.checkout': 'Proceed to Checkout',
      'shipping.address': 'Shipping Address',
      'payment.information': 'Payment Information',
      'review.order': 'Review Order',
      'place.order': 'Place Order',
      'select.country': 'Select Country/Region'
    },
    es: {
      'search': 'Buscar Productos',
      'search.placeholder': 'Buscar...',
      'category': 'Categoría',
      'all.categories': 'Todas las Categorías',
      'min.price': 'Precio Mín',
      'max.price': 'Precio Máx',
      'clear': 'Limpiar',
      'showing': 'Mostrando',
      'of': 'de',
      'products': 'productos',
      'in': 'en',
      'add.to.cart': 'Añadir al Carrito',
      'view.details': 'Ver Detalles',
      'cart': 'Carrito',
      'checkout': 'Pagar',
      'buy.now': 'Comprar Ahora',
      'in.stock': 'En Stock',
      'out.of.stock': 'Agotado',
      'delivery.in': 'Entrega en',
      'day': 'día',
      'days': 'días',
      'available': 'disponible',
      'reviews': 'reseñas',
      'review': 'reseña',
      'write.review': 'Escribir Reseña',
      'your.name': 'Tu Nombre',
      'review.title': 'Título de Reseña',
      'submit.review': 'Enviar Reseña',
      'cancel': 'Cancelar',
      'subtotal': 'Subtotal',
      'tax': 'Impuesto',
      'total': 'Total',
      'shipping': 'Envío',
      'free': 'GRATIS',
      'continue.shopping': 'Continuar Comprando',
      'proceed.to.checkout': 'Proceder al Pago',
      'shipping.address': 'Dirección de Envío',
      'payment.information': 'Información de Pago',
      'review.order': 'Revisar Pedido',
      'place.order': 'Realizar Pedido',
      'select.country': 'Seleccionar País/Región'
    },
    ja: {
      'search': '製品を検索',
      'search.placeholder': '検索...',
      'category': 'カテゴリー',
      'all.categories': 'すべてのカテゴリー',
      'min.price': '最低価格',
      'max.price': '最高価格',
      'clear': 'クリア',
      'showing': '表示中',
      'of': '/',
      'products': '製品',
      'in': '',
      'add.to.cart': 'カートに追加',
      'view.details': '詳細を見る',
      'cart': 'カート',
      'checkout': 'チェックアウト',
      'buy.now': '今すぐ購入',
      'in.stock': '在庫あり',
      'out.of.stock': '在庫切れ',
      'delivery.in': '配送',
      'day': '日',
      'days': '日',
      'available': '利用可能',
      'reviews': 'レビュー',
      'review': 'レビュー',
      'write.review': 'レビューを書く',
      'your.name': 'お名前',
      'review.title': 'レビュータイトル',
      'submit.review': 'レビューを送信',
      'cancel': 'キャンセル',
      'subtotal': '小計',
      'tax': '税金',
      'total': '合計',
      'shipping': '送料',
      'free': '無料',
      'continue.shopping': '買い物を続ける',
      'proceed.to.checkout': 'チェックアウトへ進む',
      'shipping.address': '配送先住所',
      'payment.information': '支払い情報',
      'review.order': '注文確認',
      'place.order': '注文する',
      'select.country': '国・地域を選択'
    }
  };

  private currentCountrySubject = new BehaviorSubject<Country>(this.countries[0]);
  public currentCountry$ = this.currentCountrySubject.asObservable();

  constructor() {
    // Load saved country from localStorage
    const savedCountryCode = localStorage.getItem('selectedCountry');
    if (savedCountryCode) {
      const country = this.countries.find(c => c.code === savedCountryCode);
      if (country) {
        this.currentCountrySubject.next(country);
      }
    }
  }

  getCountries(): Country[] {
    return this.countries;
  }

  getCurrentCountry(): Country {
    return this.currentCountrySubject.value;
  }

  setCountry(countryCode: string): void {
    const country = this.countries.find(c => c.code === countryCode);
    if (country) {
      this.currentCountrySubject.next(country);
      localStorage.setItem('selectedCountry', countryCode);
    }
  }

  translate(key: string): string {
    const country = this.getCurrentCountry();
    const translations = this.translations[country.language] || this.translations['en'];
    return translations[key] || key;
  }

  formatPrice(price: number, convertedPrice?: number): string {
    const country = this.getCurrentCountry();
    const finalPrice = convertedPrice !== undefined ? convertedPrice : price;

    return new Intl.NumberFormat(country.locale, {
      style: 'currency',
      currency: country.currency
    }).format(finalPrice);
  }
}
