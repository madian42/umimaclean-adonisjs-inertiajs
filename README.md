# UmiMaclean - Shoe Cleaning Service Platform

A full-stack web application for managing a professional shoe cleaning service. Built with AdonisJS 6, Inertia.js, and React, this platform handles online and walk-in orders, payment processing, order tracking, and customer management.

## 🎯 Features

### For Customers
- **Online Order Booking** - Schedule pickup and delivery for shoe cleaning
- **Service Selection** - Choose from multiple cleaning services (deep cleaning, basic wash, repairs, etc.)
- **Address Management** - Save multiple addresses for convenient pickup/delivery
- **Real-time Order Tracking** - Track order status from pickup to delivery
- **Payment Integration** - Secure payment processing via Midtrans
- **Order History** - View past orders and download invoices
- **Photo Documentation** - View photos at different stages (pickup, inspection, delivery)

### For Staff
- **Walk-in Order Management** - Create orders for customers who visit the store
- **Order Processing** - Manage order lifecycle (pickup, inspection, cleaning, delivery)
- **Photo Upload** - Document shoe condition at various stages
- **Payment Tracking** - Monitor down payments and full payments
- **Customer Notifications** - Real-time updates via WebSocket (Transmit)

### For Admin
- **Service Management** - Configure cleaning services and pricing
- **Staff Management** - Manage staff accounts and roles
- **Order Overview** - Monitor all orders across the platform
- **Analytics** - Track business metrics and performance

## 🛠️ Tech Stack

### Backend
- **AdonisJS 6** - Modern Node.js framework
- **PostgreSQL** - Primary database with UUID support
- **Lucid ORM** - Type-safe database queries
- **VineJS** - Schema validation
- **AdonisJS Transmit** - Real-time WebSocket notifications
- **AdonisJS Mail** - Email notifications
- **Midtrans** - Payment gateway integration

### Frontend
- **React 19** - UI framework
- **Inertia.js** - SPA without API layer
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Component library
- **React Hook Form** - Form management
- **Tuyau** - Type-safe API client
- **Leaflet** - Interactive maps for address selection
- **React Leaflet** - Interactive maps for ReactJS built on top of Leaflet

### Development
- **Vite** - Fast build tool with HMR
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Japa** - Testing framework
- **Docker** - Containerization support

## 📋 Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v14 or higher)
- pnpm (recommended) or npm
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/madian42/umimaclean-adonisjs-inertiajs.git
cd umimaclean-adonisjs-inertiajs
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Generate application key
node ace generate:key
```

Configure your `.env` file:
```env
# Application
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=
NODE_ENV=development

VITE_API_URL=http://localhost:3333

# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_DATABASE=umimaclean

# Session
SESSION_DRIVER=cookie
DRIVE_DISK=fs
LIMITER_STORE=database

# Midtrans Payment (get from Midtrans dashboard)
MIDTRANS_MERCHANT_ID=
MIDTRANS_SERVER_KEY=your-server-key
MIDTRANS_CLIENT_KEY=your-client-key
MIDTRANS_IS_PRODUCTION=false

# Mail (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Service
SERVICE_CENTER_LATITUDE=
SERVICE_CENTER_LONGITUDE=
```

### 4. Database Setup
```bash
# Create database
createdb umimaclean

# Run migrations
node ace migration:run

# Seed database with sample data
node ace db:seed
```

### 5. Start Development Server
```bash
# Start with hot module replacement
pnpm dev

# Or start without HMR
pnpm start
```

Visit `http://localhost:3333` to see the application.

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Architecture](docs/ARCHITECTURE.md)** - System design, database schema, and business logic
- **[API Reference](docs/API.md)** - Routes, endpoints, and request/response formats
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[Development](docs/DEVELOPMENT.md)** - Development workflow and best practices
- **[Testing](docs/TESTING.md)** - Testing strategy and running tests

## 🔑 Default Credentials

After seeding, use these credentials to log in:

**Admin Account:**
- Email: `admin@umimaclean.com`
- Password: `password`

**Staff Account:**
- Email: `staff@umimaclean.com`
- Password: `password`

**Customer Account:**
- Email: `customer@umimaclean.com`
- Password: `password`

## 📁 Project Structure

```
├── app/                    # Application code
│   ├── controllers/        # HTTP controllers (auth, staff, user)
│   ├── models/            # Database models
│   ├── middleware/        # HTTP middleware
│   ├── validators/        # Request validation schemas
│   ├── enums/             # Enumerations (statuses, roles)
│   └── utils/             # Utility functions
├── database/
│   ├── migrations/        # Database migrations
│   └── seeders/           # Database seeders
├── inertia/               # Frontend React code
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   ├── lib/               # Utilities and helpers
│   └── css/               # Stylesheets
├── config/                # Configuration files
├── start/                 # Application bootstrap
│   ├── routes.ts          # Main routes
│   ├── auth_routes.ts     # Authentication routes
│   ├── staff_routes.ts    # Staff routes
│   └── user_routes.ts     # User routes
└── docs/                  # Documentation
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
node ace test tests/functional/auth.spec.ts

# Run with coverage
pnpm test --coverage
```

## 🏗️ Building for Production

```bash
# Build the application
pnpm build

# Start production server
cd build
npm start
```

## 🐳 Docker Deployment

```bash
# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec app node ace migration:run

# Seed database
docker-compose exec app node ace db:seed
```

## 📝 Available Scripts

- `pnpm dev` - Start development server with HMR
- `pnpm start` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint` - Lint code
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Check TypeScript types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License - see the LICENSE file for details.

## 👥 Authors

- **Madian42** - [GitHub](https://github.com/madian42)

## 🙏 Acknowledgments

- AdonisJS team for the excellent framework
- Inertia.js for the seamless frontend integration
- Shadcn/ui for the beautiful component library
- Midtrans for payment processing

## 📞 Support

For support, email support@umimaclean.com or open an issue in the GitHub repository.

---

**Made with ❤️ for professional shoe cleaning services**
