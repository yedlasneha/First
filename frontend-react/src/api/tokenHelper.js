/**
 * Returns the correct JWT token based on the current route.
 * Admin pages use admin_token, user pages use user_token.
 * Use this everywhere instead of localStorage.getItem('token').
 */
export function getToken() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  return isAdmin
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('user_token');
}
