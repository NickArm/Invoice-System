# Changelog Feature - Documentation

## Overview
The application now includes a beautiful changelog viewer that reads directly from `CHANGELOG.md` and displays it with proper formatting.

## Features

### 1. Changelog Page
- **Route**: `/changelog`
- **Access**: Public (no authentication required)
- **Rendering**: Markdown → HTML with Parsedown library

### 2. Version Badge in Footer
- Displays current version (v1.1.0) with clickable link
- Located in authenticated layout footer
- Styled with primary color theme
- Full dark mode support

## Technical Implementation

### Backend
- **Controller**: `App\Http\Controllers\ChangelogController`
  - Reads `CHANGELOG.md` from project root
  - Parses markdown to HTML using Parsedown
  - Extracts latest version with regex: `/##\s+\[(\d+\.\d+\.\d+)\]/`
  - Returns Inertia view with HTML content + version

### Frontend
- **Page**: `resources/js/Pages/Changelog/Index.jsx`
  - Displays parsed HTML with `dangerouslySetInnerHTML`
  - Custom CSS styling for all markdown elements
  - Responsive design with max-width container
  - Full dark mode support

### Styling
Custom styles applied to:
- `h1`: 3xl, bold, large margins
- `h2`: 2xl, semibold, border-bottom
- `h3`: xl, semibold
- `h4`: lg, medium
- `ul/li`: Disc bullets, proper spacing
- `code`: Background, rounded, monospace
- `a`: Primary color links
- `strong`: Bold emphasis

## Single Source of Truth
The `CHANGELOG.md` file is the **only** file that needs to be updated:
- No duplicate content in database
- No manual HTML editing
- Version number automatically extracted
- Changes reflect immediately after editing CHANGELOG.md

## Updating the Changelog

### 1. Add New Version
Edit `CHANGELOG.md`:
```markdown
## [1.2.0] - 2026-02-15

### Added
- New feature description

### Changed
- Changed feature description

### Fixed
- Fixed bug description
```

### 2. Update Version Badge
Edit `resources/js/Layouts/AuthenticatedLayout.jsx`:
```jsx
<Link href={route('changelog')} className="...">
    v1.2.0  {/* Update this */}
</Link>
```

### 3. Update Changelog Entry
Add new section in `CHANGELOG.md` documenting the version badge update.

## Package Dependency
- **erusev/parsedown**: Markdown to HTML parser
  - Installed via: `composer require erusev/parsedown`
  - Version: ^1.7
  - No configuration needed

## Routes
- `GET /changelog` → ChangelogController@index (public)

## Views
- `resources/js/Pages/Changelog/Index.jsx` → Changelog viewer

## Styling Classes
The changelog page uses Tailwind's prose classes with custom overrides for optimal readability in both light and dark modes.

## Future Enhancements
- [ ] Add search/filter functionality
- [ ] Add anchor links to version sections
- [ ] Add RSS feed for changelog updates
- [ ] Add "What's New" badge notification for new versions
- [ ] Add version comparison view
