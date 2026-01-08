# 📋 Invaice

**Smart invoice intelligence**

AI-powered invoice management with automated email monitoring and comprehensive analytics.

---

## ✨ Complete Feature List

### 🤖 Intelligent Invoice Processing

**Automatic Data Extraction**
- Upload invoice images or PDFs and let AI automatically extract all data
- Supports multiple languages (English, Greek, and more)
- Extracts: invoice numbers, dates, amounts, VAT, vendor details, line items
- Handles various invoice formats and layouts automatically
- No manual typing required - just upload and review

**Smart Email Monitoring**
- Connect your email inbox (Gmail, Zoho, Outlook, etc.) via IMAP
- System automatically checks for new invoice emails every 5 minutes
- Filter by email subject (exact match or contains keyword)
- Automatically processes invoice attachments from emails
- Saves as draft invoices for your review before finalizing

**Duplicate Prevention**
- Automatically detects duplicate invoices (same number + vendor)
- Prevents accidental re-entry of existing invoices
- Identifies duplicate business entities by tax ID or name

---

### 📊 Dashboard & Analytics

**Real-time Financial Overview**
- Total invoice count at a glance
- Income vs Expense breakdown
- Net profit calculation (Income - Expenses)
- Monthly, quarterly, or custom date range analysis

**Visual Reports**
- Interactive charts showing expense trends
- Category-based breakdown of spending
- Income/expense comparison graphs
- Exportable data for further analysis

**Quick Actions**
- Fast access to recent invoices
- One-click invoice creation
- Quick business entity lookup
- Instant report generation

---

### 💼 Business Entity Management

**Vendor & Customer Database**
- Store all business entities (suppliers, customers, vendors)
- Complete contact information:
  - Company name and tax ID
  - Tax office (for Greek businesses)
  - Address, city, country, postal code
  - Phone, mobile, email
  - Custom notes
- Search and filter entities quickly
- Edit and update entity details anytime

**Auto-Creation from Invoices**
- When AI extracts invoice data, it automatically creates missing business entities
- No need to manually add vendors before processing invoices
- Keeps your database always up-to-date

---

### 📄 Invoice Management

**Complete Invoice Tracking**
- Track both income (sales) and expense (purchases) invoices
- Store PDF/image attachments with each invoice
- Categorize invoices for better organization
- Mark invoices as paid or pending
- Due date tracking and reminders

**Draft Invoice System**
- Invoices from email monitoring saved as "Draft"
- Review and approve drafts before they appear in reports
- Edit draft data before finalizing
- Drafts don't affect financial calculations until approved

**Flexible Organization**
- Custom categories (e.g., Office Supplies, Utilities, Services)
- Filter by date range, type, status, category
- Search by invoice number, vendor, or amount
- Bulk operations support

---

### 📧 Accountant Integration

**Email Reports to Accountant**
- Configure 1-3 accountant email addresses
- Send monthly or custom period reports
- Reports include:
  - Invoice summary table (counts, totals, net profit)
  - ZIP file with all invoice PDFs/images
  - Breakdown by income/expense
- Filter reports by date range and invoice type
- One-click sending - no manual exports needed

**Automated Delivery**
- Reliable email delivery via MailerSend/Mailgun
- Attachments bundled in organized ZIP files
- Professional email templates
- Delivery confirmation and error handling

---

### 👥 User Management (Admin Only)

**Multi-User Support**
- Each user has their own invoice database
- Independent settings and configurations
- Separate business entity lists per user

**Admin Controls**
- Create, edit, and deactivate users
- Assign admin or regular user roles
- Monitor user activity
- Reset user passwords
- View system-wide statistics

**Access Control**
- Inactive users automatically blocked from login
- Admin-only features protected
- Role-based permissions
- Secure session management

---

### ⚙️ Settings & Configuration

**Email Import Settings**
- Configure IMAP connection (host, port, username, password)
- Set email subject filter (exact or contains)
- Enable/disable automatic monitoring
- Test connection before saving
- Secure password storage (encrypted)

**Accountant Email Settings**
- Add up to 3 accountant email addresses
- Validation for email format
- Easy add/remove recipients
- Custom message for reports

**Business Details**
- Set your company name, tax ID, and contact info
- Used for recipient identification in invoices
- Helps AI distinguish between buyer and seller

**Invoice Categories**
- Create custom categories for organization
- Edit or delete existing categories
- Apply categories to invoices for better reporting

---

### 🔐 Security Features

**User Authentication**
- Secure login system
- Email verification support
- Password recovery ("Forgot Password")
- Session timeout protection
- Remember me functionality

**Data Protection**
- All passwords encrypted
- IMAP credentials stored securely
- File uploads scanned and validated
- CSRF protection on all forms
- SQL injection prevention

**Access Logging**
- Track user login activity
- Monitor invoice operations
- Log email fetch activities
- Error tracking for troubleshooting

---

### 📱 User Experience

**Intuitive Interface**
- Clean, modern design
- Mobile-responsive layout
- Fast page loads
- Clear navigation
- Helpful tooltips and guidance

**Smart Workflows**
- Minimal clicks to complete tasks
- Auto-save draft data
- Inline editing where possible
- Bulk actions support
- Quick search and filters

**Notifications**
- Success confirmations
- Error messages with helpful tips
- Process status updates
- Email delivery confirmations

---

## 🎯 Use Cases

**For Freelancers**
- Track client invoices (income)
- Manage business expenses
- Automatic invoice data entry via email
- Send monthly summaries to accountant

**For Small Businesses**
- Multi-user invoice management
- Vendor/customer database
- Financial reporting and analytics
- Automated accountant collaboration

**For Accountants**
- Receive organized invoice packages from clients
- Access to categorized financial data
- Ready-to-process invoice archives
- Clear income/expense breakdowns

---

## 📞 Support & Documentation

- Full deployment guide included (see `DEPLOYMENT.md`)
- Step-by-step setup instructions
- cPanel integration guide
- Troubleshooting tips
- Error log access

---

**Built with ❤️ for efficient invoice management**
