/** Only allow redirects to paths inside this app (blocks "https://..." and "//host"). */
export const safeRedirect = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/');
