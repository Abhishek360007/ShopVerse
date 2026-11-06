import reducer, { addLocal, removeLocal, selectIsWishlisted, selectWishlistCount, setWishlist } from './wishlist';

const p = (id) => ({ id, name: `Product ${id}` });

describe('wishlist reducer', () => {
  it('adds newest first and never duplicates', () => {
    let state = reducer(undefined, addLocal(p('a')));
    state = reducer(state, addLocal(p('b')));
    state = reducer(state, addLocal(p('a')));
    expect(state.items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('removes by id and replaces from the server', () => {
    let state = reducer({ items: [p('a'), p('b')] }, removeLocal('a'));
    expect(state.items.map((i) => i.id)).toEqual(['b']);
    state = reducer(state, setWishlist([p('x')]));
    expect(state.items.map((i) => i.id)).toEqual(['x']);
  });

  it('selects count and saved state', () => {
    const root = { wishlistState: { items: [p('a')] } };
    expect(selectWishlistCount(root)).toBe(1);
    expect(selectIsWishlisted('a')(root)).toBe(true);
    expect(selectIsWishlisted('z')(root)).toBe(false);
  });
});
