# Deployment Guide - Invaice

**Smart invoice intelligence**

## cPanel Server Setup

### 1. **Upload Files to Server**

```bash
# Via FTP or file manager:
# Upload app folder to public_html or a subdirectory
# The public folder should be the web root
```

### 2. **Install Composer Dependencies**

```bash
cd /home/username/public_html/app  # or your app path
composer install --optimize-autoloader --no-dev
```

### 3. **Database Setup**

For **SQLite** (default):
```bash
# Create database directory if needed
mkdir -p storage/database
php artisan migrate --force
php artisan db:seed --class=AdminUserSeeder
```

For **MySQL** (recommended for production):
```bash
# Via cPanel: Create database and user
# Update .env:
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_pass

# Then run:
php artisan migrate --force
php artisan db:seed --class=AdminUserSeeder
```

### 4. **Configure Environment**

Edit `.env` file:
```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Enable all configured features
SESSION_DRIVER=database
CACHE_DRIVER=database
QUEUE_CONNECTION=database

# Mail configuration (your current setup)
MAIL_MAILER=mailersend
MAIL_FROM_ADDRESS="invoices@yourdomain.com"
MAILERSEND_API_KEY=your_api_key

# OpenAI for invoice extraction
OPENAI_API_KEY=your_key
```

### 5. **Optimize for Production**

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### 6. **Set Proper Permissions**

```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chmod 644 .env
```

---

## 🔄 Automatic Email Fetching via Cron

### **Setup Cron Job in cPanel**

1. **Go to cPanel** → **Cron Jobs**
2. **Add New Cron Job** with this schedule:

```
*/5 * * * * cd /home/username/public_html/app && php artisan schedule:run >> /dev/null 2>&1
```

**Replace:**
- `/home/username/public_html/app` = Your actual app path
- `5` = Every 5 minutes (change as needed)

### **Explanation:**
- `*/5 * * * *` = Every 5 minutes
- `php artisan schedule:run` = Runs Laravel's scheduler
- `>> /dev/null 2>&1` = Suppresses output (optional, remove for debugging)

### **Alternative: Every Hour**
```
0 * * * * cd /home/username/public_html/app && php artisan schedule:run >> /dev/null 2>&1
```

### **Alternative: Every 15 Minutes**
```
*/15 * * * * cd /home/username/public_html/app && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📧 User Email Configuration

Each user must configure their IMAP settings in **Settings → Email Import**:

1. **Email Host** (IMAP server)
   - Gmail: `imap.gmail.com`
   - Zoho: `imap.zoho.com`
   - Outlook: `imap-mail.outlook.com`
   - Custom: Get from email provider

2. **Port**: Usually 993 (SSL enabled)

3. **Username**: Full email address

4. **Password**: Email password (encrypted in database)

5. **Subject Filter**: 
   - Exact: Match exact subject line
   - Contains: Match if subject contains keyword
   - Example: "Invoice" or "New Invoice #"

6. **Enable IMAP**: Toggle ON

---

## 🧪 Testing Email Fetching

### **Manual Test**

```bash
# Run once to test
php artisan invoices:fetch-emails

# Test for specific user
php artisan invoices:fetch-emails --user=1
```

### **View Logs**

```bash
tail -f storage/logs/laravel.log
```

---

## 🐛 Troubleshooting

### **Cron not running?**
- Check cPanel → **Cron Logs** for errors
- Verify PHP path: `which php` or `which php74`
- Adjust cron command if needed

### **IMAP connection fails?**
- Verify IMAP host and port
- Check if email provider requires app-specific password (Gmail, Outlook)
- Review logs: `storage/logs/laravel.log`

### **Emails not being fetched?**
- Manually run: `php artisan invoices:fetch-emails`
- Check subject filter matches email subjects
- Enable IMAP in user settings

### **Permission denied errors?**
```bash
chmod 777 storage bootstrap/cache
```

---

## 📝 Checklist Before Going Live

- [ ] `.env` configured for production
- [ ] Database migrations completed
- [ ] Admin user seeded
- [ ] Composer dependencies installed (`--no-dev`)
- [ ] Storage and cache folders writable (775 permissions)
- [ ] Cron job configured for email fetching
- [ ] HTTPS/SSL certificate installed
- [ ] Mail credentials tested and working
- [ ] OpenAI API key configured and tested
- [ ] Users can login and access dashboard
- [ ] IMAP settings tested for sample user
- [ ] Invoice extraction working with AI
- [ ] Backups configured

---

## 🚀 Performance Tips

### **Enable Caching**
```bash
php artisan cache:clear
php artisan config:cache
```

### **Optimize Database**
- Add indexes for frequently queried columns
- Regular backups of SQLite or MySQL

### **Monitor Logs**
```bash
# View live logs
tail -f storage/logs/laravel.log | grep -i error
```

---

## 📞 Support

For issues or questions:
- Check `storage/logs/laravel.log` for error details
- Test features individually (login, invoice upload, email fetch)
- Review `.env` configuration

---

**Last Updated:** January 8, 2026
