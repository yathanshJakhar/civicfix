// Standard OpenStreetMap tiles, darkened in CSS (see `.dark-tiles` in globals.css)
// so the map matches the app's black theme without needing a paid tile provider.
export const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_CLASS = "dark-tiles";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
