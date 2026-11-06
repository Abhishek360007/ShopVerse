import { addToWishlistAPI, fetchWishlistAPI, mergeWishlistAPI, removeFromWishlistAPI } from "../../api/wishlist";
import { isTokenValid } from "../../utils/jwt-helper";
import { showToast } from "../features/common";
import { GUEST_KEY, addLocal, readGuestWishlist, removeLocal, setWishlist, writeGuestWishlist } from "../features/wishlist";

/** Only the fields the wishlist page needs, so guest storage stays small. */
const slim = (p) => ({
    id: p?.id, name: p?.name, slug: p?.slug, price: p?.price, thumbnail: p?.thumbnail,
    description: p?.description, brand: p?.brand, variants: p?.variants,
});

/** Loads the server wishlist when signed in, otherwise the one saved in this browser. */
export const loadWishlist = () => async (dispatch) => {
    if (!isTokenValid()) {
        dispatch(setWishlist(readGuestWishlist()));
        return;
    }
    try {
        dispatch(setWishlist(await fetchWishlistAPI()));
    } catch (e) {
        // keep whatever is shown; the next load will retry
    }
};

/** Adds or removes a product. Updates the screen first, then saves. */
export const toggleWishlist = (product) => async (dispatch, getState) => {
    const saved = getState()?.wishlistState?.items?.some((p) => p.id === product?.id);
    if (saved) {
        dispatch(removeLocal(product.id));
    } else {
        dispatch(addLocal(slim(product)));
        dispatch(showToast(`${product?.name ?? 'Item'} saved to wishlist`));
    }

    if (!isTokenValid()) {
        writeGuestWishlist(getState().wishlistState.items);
        return;
    }
    try {
        const items = saved ? await removeFromWishlistAPI(product.id) : await addToWishlistAPI(product.id);
        dispatch(setWishlist(items));
    } catch (e) {
        // undo the optimistic change if the server refused it
        dispatch(saved ? addLocal(slim(product)) : removeLocal(product.id));
        dispatch(showToast('Could not update your wishlist. Please try again.'));
    }
};

export const removeFromWishlist = (product) => async (dispatch, getState) => {
    if (getState()?.wishlistState?.items?.some((p) => p.id === product?.id)) {
        await dispatch(toggleWishlist(product));
    }
};

/** After sign-in: move items saved as a guest into the account, then show the account's list. */
export const syncWishlistAfterLogin = () => async (dispatch) => {
    const guestIds = readGuestWishlist().map((p) => p.id).filter(Boolean);
    try {
        const items = guestIds.length ? await mergeWishlistAPI(guestIds) : await fetchWishlistAPI();
        dispatch(setWishlist(items));
        try { localStorage.removeItem(GUEST_KEY); } catch (e) { /* ignore */ }
    } catch (e) {
        // leave the guest list in place so nothing is lost
    }
};

export const clearWishlistOnLogout = () => (dispatch) => {
    dispatch(setWishlist([]));
};
