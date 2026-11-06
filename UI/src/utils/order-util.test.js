import { createOrderRequest, getStepCount } from './order-util';

const cartItems = [
  { productId: 'p1', variant: { id: 'v1' }, quantity: 2, subTotal: 40.5 },
  { productId: 'p2', variant: { id: 'v2' }, quantity: 1, subTotal: 19.25 },
];

describe('createOrderRequest', () => {
  it('builds order items from the cart', () => {
    const request = createOrderRequest(cartItems, 'user-1', 'address-1');

    expect(request.userId).toBe('user-1');
    expect(request.addressId).toBe('address-1');
    expect(request.orderItemRequests).toEqual([
      { productId: 'p1', productVariantId: 'v1', discount: 0, quantity: 2 },
      { productId: 'p2', productVariantId: 'v2', discount: 0, quantity: 1 },
    ]);
  });

  it('totals the cart amount to two decimals', () => {
    const request = createOrderRequest(cartItems, 'user-1', 'address-1');
    expect(request.totalAmount).toBe('59.75');
  });

  it('sets an expected delivery date in the future', () => {
    const request = createOrderRequest(cartItems, 'user-1', 'address-1');
    expect(new Date(request.expectedDeliveryDate).getTime()).toBeGreaterThan(Date.now());
  });

  it('handles an empty cart', () => {
    const request = createOrderRequest([], 'user-1', 'address-1');
    expect(request.orderItemRequests).toEqual([]);
    expect(request.totalAmount).toBe('0.00');
  });
});

describe('getStepCount', () => {
  it('maps order statuses to timeline steps', () => {
    expect(getStepCount.PENDING).toBe(1);
    expect(getStepCount.IN_PROGRESS).toBe(2);
    expect(getStepCount.SHIPPED).toBe(3);
    expect(getStepCount.DELIVERED).toBe(4);
  });
});
