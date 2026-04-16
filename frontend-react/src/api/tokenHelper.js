/**
 * Returns the admin JWT token from localStorage.
 */
export function getToken() {
  return localStorage.getItem('admin_token');
}
