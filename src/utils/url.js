// src/utils/url.js
export const buildUrl = (path) => {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}