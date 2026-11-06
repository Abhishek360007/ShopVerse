import reducer, { addToCart, countCartItems, removeFromCart, updateQuantity } from './cart';

const line = (variantId, quantity = 1, stock = 10) => ({
  productId: 'p1',
  name: 'Shirt',
  price: 1299,
  quantity,
  subTotal: 1299 * quantity,
  variant: { id: variantId, size: 'M', stockQuantity: stock },
});

const empty = { cart: [] };

describe('cart reducer', () => {
  it('adds a new line', () => {
    const state = reducer(empty, addToCart(line('v1')));
    expect(state.cart).toHaveLength(1);
  });

  it('merges the same option instead of adding a duplicate row', () => {
    let state = reducer(empty, addToCart(line('v1')));
    state = reducer(state, addToCart(line('v1', 2)));
    expect(state.cart).toHaveLength(1);
    expect(state.cart[0].quantity).toBe(3);
    expect(state.cart[0].subTotal).toBe(1299 * 3);
  });

  it('never merges above the available stock', () => {
    let state = reducer(empty, addToCart(line('v1', 2, 3)));
    state = reducer(state, addToCart(line('v1', 5, 3)));
    expect(state.cart[0].quantity).toBe(3);
  });

  it('keeps different options as separate rows', () => {
    let state = reducer(empty, addToCart(line('v1')));
    state = reducer(state, addToCart(line('v2')));
    expect(state.cart).toHaveLength(2);
  });

  it('removes only the chosen option', () => {
    let state = reducer(empty, addToCart(line('v1')));
    state = reducer(state, addToCart(line('v2')));
    state = reducer(state, removeFromCart({ variantId: 'v1' }));
    expect(state.cart.map((i) => i.variant.id)).toEqual(['v2']);
  });

  it('updates quantity and subtotal', () => {
    let state = reducer(empty, addToCart(line('v1')));
    state = reducer(state, updateQuantity({ variant_id: 'v1', quantity: 4 }));
    expect(state.cart[0].subTotal).toBe(1299 * 4);
  });

  it('counts items by quantity', () => {
    let state = reducer(empty, addToCart(line('v1', 2)));
    state = reducer(state, addToCart(line('v2', 1)));
    expect(countCartItems({ cartState: state })).toBe(3);
  });
});
