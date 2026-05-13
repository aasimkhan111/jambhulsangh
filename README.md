# Kute Farmers Dashboard

Premium, mobile-first frontend dashboard and listing site powered by Google Sheets.

## What is included

- Floating glass navbar, hero, dashboard stats, and dark mode
- Debounced multi-field search with sticky search bar
- Mobile card listings with bottom-sheet filters and infinite scroll
- Desktop table with sorting, pagination, sticky header, and column toggles
- Auto-refresh on load, every 15 seconds, and when the tab becomes active
- Skeleton loading, smooth transitions, and a record detail modal

## Connect Google Sheets

1. Open [assets/js/config.js](assets/js/config.js) and replace:
   - `YOUR_SHEET_ID`
   - `YOUR_GOOGLE_API_KEY`
   - `range` if your tab or column span differs
2. Make sure your Google Sheet is accessible to the API key you use.
3. Keep the first row in the sheet as headers.

The app looks for common header names like `Title`, `Category`, `Status`, `Price`, `Date`, `Owner`, `Location`, `Stage`, and `Summary`. It will still render other columns dynamically in the desktop table and record detail view.

## File structure

- [index.html](index.html)
- [assets/styles/main.css](assets/styles/main.css)
- [assets/js/config.js](assets/js/config.js)
- [assets/js/mock-data.js](assets/js/mock-data.js)
- [assets/js/sheets.js](assets/js/sheets.js)
- [assets/js/app.js](assets/js/app.js)

## Preview mode

If the Google Sheets credentials are not set yet, the app falls back to bundled preview data so the UI can still be reviewed immediately.
