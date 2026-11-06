import { createSlice } from "@reduxjs/toolkit";

// Guests keep their wishlist in the browser; signed-in customers keep it on the server.
export const GUEST_KEY = 'wishlist';

export const readGuestWishlist = () => {
    try {
        const items = JSON.parse(localStorage.getItem(GUEST_KEY));
        return Array.isArray(items) ? items : [];
    } catch (e) {
        return [];
    }
};

export const writeGuestWishlist = (items) => {
    try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    } catch (e) {
        // storage unavailable: the wishlist still works for this visit
    }
};

const wishlistSlice = createSlice({
    name: 'wishlistState',
    initialState: { items: [] },
    reducers: {
        setWishlist: (state, action) => {
            state.items = action.payload ?? [];
        },
        addLocal: (state, action) => {
            if (!state.items.some((p) => p.id === action.payload?.id)) {
                state.items.unshift(action.payload);
            }
        },
        removeLocal: (state, action) => {
            state.items = state.items.filter((p) => p.id !== action.payload);
        },
    },
});

export const { setWishlist, addLocal, removeLocal } = wishlistSlice.actions;

export const selectWishlist = (state) => state?.wishlistState?.items ?? [];
export const selectWishlistCount = (state) => selectWishlist(state).length;
export const selectIsWishlisted = (productId) => (state) => selectWishlist(state).some((p) => p.id === productId);

export default wishlistSlice.reducer;
