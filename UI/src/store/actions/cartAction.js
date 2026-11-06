import { addToCart, deleteCart, removeFromCart, updateQuantity } from "../features/cart"
import { showToast } from "../features/common"

const updateLocalStorage = (getState)=>{
    const {cartState} = getState();
    try {
        localStorage.setItem('cart',JSON.stringify(cartState?.cart))
    } catch (e) {
        // storage unavailable (private mode); the cart still works for this session
    }
}

/** Builds a cart line from a product and the chosen variant. */
export const toCartLine = (product, variant, quantity = 1) => ({
    productId: product?.id,
    thumbnail: product?.thumbnail,
    name: product?.name,
    slug: product?.slug,
    variant,
    quantity,
    price: Number(product?.price),
    subTotal: Number(product?.price) * quantity,
});

export const addItemToCartAction = (productItem)=>{
    return (dispatch,getState) =>{
        dispatch(addToCart(productItem));
        updateLocalStorage(getState);
        dispatch(showToast(`${productItem?.name ?? 'Item'} added to cart`));
    }
}

export const updateItemToCartAction = (productItem) =>{
    return (dispatch,getState) =>{
        dispatch(updateQuantity({
            variant_id: productItem?.variant_id,
            quantity: productItem?.quantity
        }))
        updateLocalStorage(getState);
    }
}

export const delteItemFromCartAction = (payload)=>{
    return (dispatch,getState)=>{
        dispatch(removeFromCart(payload));
        updateLocalStorage(getState);
    }
}

export const clearCart = ()=>{
    return (dispatch) =>{
       dispatch(deleteCart());
       try {
           localStorage.removeItem('cart');
       } catch (e) {
           // ignore
       }
    }
}
