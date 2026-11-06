import { createSlice } from "@reduxjs/toolkit"

// Cart line: { productId, thumbnail, name, slug, variant, quantity, price, subTotal }

const readCart = () => {
    try {
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
        return [];
    }
};

const initialState = {
    cart: readCart()
}

const sameLine = (item, variantId) => item?.variant?.id === variantId;

const cartSlice = createSlice({
    name:'cartState',
    initialState:initialState,
    reducers:{
        addToCart:(state,action) =>{
            const line = action?.payload;
            const existing = state.cart.find((item) => sameLine(item, line?.variant?.id));
            if (existing) {
                // Same product option added again: bump the quantity instead of adding a second row
                const maxQty = Math.min(existing?.variant?.stockQuantity ?? 10, 10);
                existing.quantity = Math.min(existing.quantity + (line?.quantity ?? 1), maxQty);
                existing.subTotal = existing.quantity * existing.price;
            } else {
                state.cart.push(line);
            }
        },
        removeFromCart:(state,action)=>{
            state.cart = state.cart.filter((item) => !sameLine(item, action?.payload?.variantId));
        },
        updateQuantity:(state,action) =>{
            const item = state.cart.find((line) => sameLine(line, action?.payload?.variant_id));
            if (item) {
                item.quantity = action?.payload?.quantity;
                item.subTotal = item.quantity * item.price;
            }
        },
        deleteCart : (state)=>{
            state.cart = [];
        }
    }
})

export const { addToCart, removeFromCart, updateQuantity, deleteCart } = cartSlice?.actions;

export const countCartItems = (state) =>
    (state?.cartState?.cart ?? []).reduce((count, item) => count + (item?.quantity ?? 1), 0);
export const selectCartItems = (state) => state?.cartState?.cart ?? []
export default cartSlice.reducer;
