# Invoice System (Laravel 11 + React)

AI-assisted invoice import with IMAP fetching, vision-powered extraction, and draft review before approval.

## Key Features
- IMAP import (Zoho tested): fetch unread emails, download attachments, create draft invoices.
- Vision extraction (OpenAI gpt-4o): PDF/image to structured data (type, amounts, supplier, dates).
- Business entities: auto-create/reuse supplier entities from extracted name/AFM.
- Draft workflow: email imports land as `draft`; excluded from dashboard/summary metrics until approved.
- Invoices UI: filter by status (draft/pending/paid), view attachment, edit/delete.
- IMAP settings UI: per-user host/port/SSL/username/password, subject filter, connection test.

## Requirements
- PHP 8.3+, Composer
- Node.js 18+
- SQLite (default) or MySQL
- OpenAI API key (for extraction)
- Optional: Poppler (`pdftoppm`) or Imagick for PDF->PNG conversion

## Setup
```bash
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate
npm run build
php artisan serve
```

## Environment Notes
- Set `OPENAI_API_KEY` in `.env`.
- IMAP fields live on `users` table (host, port, username, password, ssl, subject_filter, subject_match_type, enabled).
- Queue: jobs currently run sync; for async use a queue driver (database/redis) and `php artisan queue:work`.

## Email Import
- Command: `php artisan invoices:fetch-emails -v` (scheduled every 15 minutes via `routes/console.php`).
- Saves attachments to `storage/app/invoices/draft/{user_id}/` on the `local` disk.
- Creates `attachments` rows (status pending→extracted) and dispatches extraction job.
- `ProcessInvoiceAttachment` normalizes data, defaults type to expense unless supplier AFM matches your company (then income), creates/links BusinessEntity, and inserts an invoice with `status=draft`.

## Draft Handling
- Draft invoices are visible in the list (status filter includes Draft) but are **excluded** from:
  - Dashboard aggregates and charts
  - List summary counts/sums
- Approval flow is not implemented yet (to-do: add approve/reject actions that flip `status` from draft to paid/pending and re-include in metrics).

## Frontend
- Inertia + React + Tailwind.
- Pages of interest: `resources/js/Pages/Invoices/Index.jsx` (filters, status badges, file view) and `resources/js/Pages/Settings/ImapSettings.jsx`.

## Troubleshooting
- PDF conversion: if Imagick is missing, Poppler `pdftoppm` is attempted (configure binary paths in `ProcessInvoiceAttachment::findPdftoppm`).
- CSRF: IMAP test uses Axios to include XSRF token automatically.
- Drafts missing in metrics: intended; only non-draft counted.

## To-Do
- Add approve/reject actions for drafts in UI and API.
- Optional: mark IMAP messages as seen after successful processing.
- Optional: tighten duplicate detection and add unit tests for extraction mapping.
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
