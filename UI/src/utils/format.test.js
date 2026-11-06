import { cartTotal, errorMessage, formatPrice } from './format';
import { safeRedirect } from './redirect';

describe('formatPrice', () => {
  it('formats rupees with Indian grouping', () => {
    expect(formatPrice(1299)).toBe('₹1,299.00');
    expect(formatPrice(125000.5)).toBe('₹1,25,000.50');
  });

  it('treats bad input as zero', () => {
    expect(formatPrice(undefined)).toBe('₹0.00');
  });
});

describe('cartTotal', () => {
  it('sums line subtotals', () => {
    expect(cartTotal([{ subTotal: 1299 }, { subTotal: 899 }])).toBe(2198);
    expect(cartTotal()).toBe(0);
  });
});

describe('errorMessage', () => {
  it('prefers the server message', () => {
    expect(errorMessage({ response: { data: { message: 'Not enough stock' } } })).toBe('Not enough stock');
    expect(errorMessage({}, 'fallback')).toBe('fallback');
  });
});

describe('safeRedirect', () => {
  it('allows in-app paths only', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout');
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('//evil.example')).toBe('/');
    expect(safeRedirect(null)).toBe('/');
  });
});
