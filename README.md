# 📋 Invoice System

AI-powered invoice management system with intelligent extraction, analytics dashboard, and accountant reporting capabilities.

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?style=flat-square&logo=laravel)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=flat-square&logo=php)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

### 🤖 AI-Powered Invoice Extraction
- **GPT-4V Integration**: Automatically extract invoice data from images/PDFs using OpenAI's vision model
- **Multi-language Support**: Process invoices in multiple languages (English, Greek, etc.)
- **Smart Data Parsing**: Extracts invoice number, dates, amounts, vendor info, and line items
- **Duplicate Prevention**: Prevents duplicate invoice entries with smart detection

### 📊 Analytics Dashboard
- **Real-time Aggregates**: Total invoice count, income/expense summaries, net profit calculations
- **Date Range Filtering**: Analyze invoices for any custom period
- **Categorized Breakdown**: View income vs expense distributions
- **Visual Charts**: Interactive charts for expense trends and category analysis

### 👥 User Management
- **Admin Control**: Dedicated admin panel for user and account management
- **User Status Enforcement**: Inactive users automatically blocked from access
- **Role-based Access**: Admin vs regular user roles with appropriate permissions
- **Activity Tracking**: Monitor user actions and system events

### 📧 Accountant Reporting
- **Email Configuration**: Configure 1-3 accountant email recipients per user
- **Automated Reports**: Generate and send monthly reports with invoice summaries
- **ZIP Attachments**: Bundle all invoices in compressed format for easy distribution
- **Mailgun Integration**: Reliable email delivery with Mailgun service
- **Export Formats**: Export by date range, invoice type (income/expense), and more

### 💼 Business Management
- **Entity Management**: Create and manage business entities (customers, vendors)
- **Duplicate Prevention**: Automatic detection of duplicate business entities
- **Contact Information**: Store comprehensive contact details and notes
- **Category Organization**: Organize invoices by custom categories

### 🔐 Security & Validation
- **Authentication**: Secure login with email verification
- **Password Management**: Secure password reset and update functionality
- **CSRF Protection**: Built-in Laravel CSRF token validation
- **Data Validation**: Comprehensive server-side validation for all inputs

## 🚀 Quick Start

### Prerequisites
- PHP 8.3+
- Node.js 18+
- Composer
- SQLite or MySQL database
- OpenAI API key
- Mailgun account (optional, for email features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/NickArm/Invoice-System.git
cd Invoice-System
```

2. **Install PHP dependencies**
```bash
composer install
```

3. **Install JavaScript dependencies**
```bash
npm install
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and set:
```env
APP_KEY=base64:YourBase64EncodedKey
DB_CONNECTION=sqlite
# or for MySQL:
DB_HOST=localhost
DB_DATABASE=invoice_system
DB_USERNAME=root
DB_PASSWORD=password

OPENAI_API_KEY=sk_your_openai_key
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_SECRET=your-mailgun-secret
```

5. **Generate application key**
```bash
php artisan key:generate
```

6. **Run database migrations**
```bash
php artisan migrate
```

7. **Seed admin user (optional)**
```bash
php artisan db:seed --class=AdminUserSeeder
```

8. **Build frontend assets**
```bash
npm run build
```

For development with hot reload:
```bash
npm run dev
```

9. **Start the development server**
```bash
php artisan serve
```

Visit `http://localhost:8000` in your browser.

## 📖 Usage

### Extracting Invoices
1. Navigate to **Invoices → Extract**
2. Upload invoice image/PDF
3. System automatically extracts data using AI
4. Review and confirm extracted information
5. Invoice saved to database with full details

### Dashboard
- View real-time invoice statistics
- Filter by date range
- See income vs expense breakdown
- Export reports for accountants
- Access quick business entity management

### Settings
- **Accountant Emails**: Configure recipient email addresses (1-3 emails)
- **Business Details**: Set company information
- **Categories**: Create custom invoice categories

### Admin Panel
- User management (create, edit, deactivate users)
- View system activity logs
- Monitor invoice processing
- Manage business entities

### Accountant Reports
1. Go to **Dashboard**
2. Select date range and invoice type
3. Choose export format (all invoices as ZIP)
4. Click "Send Report"
5. Automatic email delivery to configured addresses

## 🏗️ Architecture

### Backend
- **Framework**: Laravel 11
- **Database**: SQLite/MySQL with Eloquent ORM
- **Job Queue**: Database-backed queue for async processing
- **API**: RESTful API endpoints for frontend communication

### Frontend
- **Framework**: React 18 with Vite
- **State Management**: React Hooks with Inertia.js
- **Styling**: Tailwind CSS
- **Form Handling**: Inertia form helpers with validation feedback

### External Services
- **OpenAI**: Invoice data extraction via GPT-4V
- **Mailgun**: Transactional email delivery

## 🗂️ Project Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/        # Application controllers
│   │   ├── Middleware/         # Custom middleware
│   │   └── Requests/           # Form validation
│   ├── Models/                 # Eloquent models
│   ├── Jobs/                   # Queue jobs
│   ├── Mail/                   # Mailable classes
│   └── Providers/              # Service providers
├── routes/
│   ├── web.php                 # Web routes
│   └── auth.php                # Auth routes
├── database/
│   ├── migrations/             # Database migrations
│   └── seeders/                # Database seeders
├── resources/
│   ├── js/                     # React components
│   ├── views/                  # Blade templates
│   ├── css/                    # Stylesheets
│   └── emails/                 # Email templates
├── config/                     # Application configuration
├── tests/                      # Test suite
└── public/                     # Public assets
```

## 🔧 API Endpoints

### Invoices
- `GET /invoices` - List invoices
- `POST /invoices` - Create invoice
- `GET /invoices/{id}` - Show invoice
- `PUT /invoices/{id}` - Update invoice
- `DELETE /invoices/{id}` - Delete invoice
- `POST /invoices/extract` - Extract from image/PDF

### Business Entities
- `GET /business-entities` - List entities
- `POST /business-entities` - Create entity
- `PUT /business-entities/{id}` - Update entity
- `DELETE /business-entities/{id}` - Delete entity

### Dashboard
- `GET /dashboard` - Dashboard data with aggregates

### Settings
- `GET /settings/accountant-emails` - Get email configuration
- `POST /settings/accountant-emails` - Update email configuration
- `POST /accountant/send` - Send report to accountants

### Admin
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

## 🧪 Testing

Run the test suite:
```bash
php artisan test
```

With coverage:
```bash
php artisan test --coverage
```

## 🌍 Environment Variables

Key environment variables to configure:

```env
# Application
APP_NAME=Invoice-System
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...

# Database
DB_CONNECTION=sqlite
DB_DATABASE=database.sqlite

# OpenAI
OPENAI_API_KEY=sk_...
OPENAI_ORGANIZATION=org_...

# Mailgun
MAILGUN_SECRET=key-...
MAILGUN_DOMAIN=mail.example.com

# Mail
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Invoice System"

# App Settings
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database
```

## 📦 Dependencies

### PHP Packages
- Laravel 11.x
- Inertia.js
- OpenAI PHP client
- Mailgun PHP SDK
- Laravel Tinker

### JavaScript Packages
- React 18
- React DOM 18
- Inertia.js React adapter
- Tailwind CSS
- Vite
- PostCSS

See `composer.json` and `package.json` for complete dependency lists.

## 🚢 Deployment

### Production Checklist
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Set `APP_ENV=production`
- [ ] Generate new `APP_KEY`
- [ ] Set up proper database (MySQL recommended)
- [ ] Configure mail service credentials (Mailgun)
- [ ] Set up OpenAI API key with appropriate rate limits
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Optimize for production:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan optimize
  ```
- [ ] Set up background job processing
- [ ] Configure HTTPS/SSL certificate
- [ ] Set up log rotation and monitoring
- [ ] Configure backup strategy for database

### Docker (Optional)
```bash
docker-compose up -d
docker-compose exec app php artisan migrate
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs in `storage/logs/`

## 🙏 Acknowledgments

- Laravel framework and community
- React community
- OpenAI for vision capabilities
- Mailgun for reliable email delivery
- Tailwind CSS for styling utilities

---

**Made with ❤️ for better invoice management**

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
