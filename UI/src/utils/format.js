const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a number as Indian Rupees, e.g. 1299 -> "₹1,299.00". */
export const formatPrice = (value) => inr.format(Number(value) || 0);

/** Sum of all cart line subtotals. */
export const cartTotal = (items = []) =>
  items.reduce((sum, item) => sum + (Number(item?.subTotal) || 0), 0);

/** Pulls a readable message out of an API error. */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || err?.message || fallback;
