# StoreFront - E-Commerce Platform

A modern, full-featured e-commerce storefront built with Angular, Bootstrap, and DuckDB. Features include product browsing, advanced filtering, shopping cart, checkout, internationalization, and real-time system monitoring.

![StoreFront Logo](public/logo.svg)

## Features

### 🛒 Shopping Experience
- **Product Catalog**: 60 products across 12 categories
- **Advanced Search & Filtering**:
  - Text search
  - Category filtering
  - Price range
  - Stock availability
  - Delivery time
  - Customer ratings
- **Product Details**: Comprehensive product pages with reviews
- **Shopping Cart**: Add, remove, and manage cart items
- **Checkout**: Credit card validation and order processing

### 🌍 Internationalization (i18n)
- **10 Countries Supported**: US, UK, Canada, Australia, Germany, France, Spain, Italy, Japan, Brazil
- **Currency Conversion**: Real-time price conversion with proper rounding
- **Locale Formatting**: Currency symbols and formatting per region
- **Multi-language Support**: English, Spanish, Japanese

### 🎨 User Interface
- **Modern Design**: Amazon-inspired professional UI
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Professional Branding**: Custom SVG logo with gradient effects
- **Compact Filters**: Collapsible advanced filters with smooth animations
- **System Status Banner**: Real-time backend monitoring with alerts

### ⭐ Customer Reviews
- **60+ Reviews**: Realistic customer feedback across products
- **Rating System**: 5-star rating display
- **Review Submission**: Users can add their own reviews

### 🔧 Technical Features
- **Backend**: Node.js + Express + DuckDB (in-memory SQL database)
- **Frontend**: Angular 20.3 (standalone components)
- **Styling**: Bootstrap 5.3 + Custom SCSS
- **State Management**: RxJS BehaviorSubjects
- **Persistence**: LocalStorage for cart and preferences
- **Testing**: Comprehensive test suites (48 frontend, 13 backend tests)

## Prerequisites

- Node.js 18+
- npm 9+
- Angular CLI 20+

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd amazon-storefront
```

### 2. Install dependencies

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
cd ..
```

## Running the Application

### Development Mode

#### Start Backend (Terminal 1)
```bash
cd backend
npm start
```
Backend runs at: http://localhost:3000

#### Start Frontend (Terminal 2)
```bash
npm start
```
Frontend runs at: http://localhost:4200

### Production Build

#### Build Frontend
```bash
npm run build
```

## Project Structure

```
amazon-storefront/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/              # Product listing page
│   │   │   ├── product-detail/    # Product details page
│   │   │   ├── cart/              # Shopping cart
│   │   │   ├── checkout/          # Checkout process
│   │   │   └── system-banner/     # System status banner
│   │   └── services/
│   │       ├── product.service.ts      # Product API
│   │       ├── cart.service.ts         # Cart management
│   │       ├── i18n.service.ts         # Internationalization
│   │       ├── currency.service.ts     # Currency conversion
│   │       └── system-status.service.ts # Backend monitoring
│   ├── styles.scss                # Global styles
│   └── public/
│       └── logo.svg               # StoreFront logo
├── backend/
│   ├── server.js                  # Express server
│   ├── init-db.js                 # Database initialization
│   └── server.test.js             # Backend tests
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - List products with filtering
  - Query params: `search`, `category`, `minPrice`, `maxPrice`, `inStock`, `maxDeliveryDays`, `minRating`, `page`, `limit`
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List all categories

### Reviews
- `GET /api/products/:id/reviews` - Get product reviews
- `POST /api/products/:id/reviews` - Add review

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

## Features in Detail

### Advanced Filtering
The application provides comprehensive filtering options:
- **Search**: Full-text search across product names and descriptions
- **Category**: Filter by product category
- **Price Range**: Set minimum and maximum price
- **Stock**: Show only in-stock items
- **Delivery Time**: Filter by maximum delivery days
- **Rating**: Minimum customer rating filter

### Internationalization
Supports 10 countries with:
- Automatic currency conversion using exchange rates
- Proper currency symbol display (£, €, ¥, etc.)
- Locale-specific number formatting
- Multi-language interface (EN, ES, JA)

### System Monitoring
Real-time backend health monitoring:
- Checks backend connectivity every 30 seconds
- Displays professional alert banner when system is down
- Retry button for manual status checks
- Smooth slide-down animation

## Testing

### Run Frontend Tests
```bash
npm test
```

### Run Backend Tests
```bash
cd backend
npm test
```

### Test Coverage
```bash
cd backend
npm run test:coverage
```

## Database

The application uses **DuckDB**, an in-memory SQL database:
- Fast query performance
- SQL compatibility
- Automatic initialization on startup
- Pre-loaded with 60 products and 60+ reviews

### Database Schema

**products**
- id, name, description, price, category
- image_url, stock_quantity, lead_time_days
- rating, review_count

**reviews**
- id, product_id, rating, title, comment
- reviewer_name, created_at

**orders**
- id, items, total, shipping_address
- payment_method, status, created_at

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspired by Amazon's e-commerce platform
- Built with Angular and Bootstrap
- Icons from Bootstrap Icons
- Product images from Placehold.co

## Support

For issues and questions, please open an issue on GitHub.

---

**StoreFront** - Your Trusted Marketplace 🛍️
