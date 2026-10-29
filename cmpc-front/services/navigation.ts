const LOGIN_PATH = '/login';

export function redirectToLogin(): void {
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = LOGIN_PATH;
}
