YOUTUBE-2 TV GRID FIX

Design updates:
- Removed landscape movie-card layout and forced portrait 2:3 posters.
- Fixed 3-column grid on Android TV / wide screens.
- Movies flow down the page in normal vertical scrolling; no horizontal movie rails.
- Added a compact top banner above the catalogue.
- Kept the latest GitHub Player FIX app.js and existing Supabase settings.

Upload these files to the root of the existing GitHub Pages repository, replacing:
index.html, styles.css, app.js, playerjs.js

The HTML uses new cache-busting version strings (20261128-tvgrid1).
No Supabase database/schema changes are required.
