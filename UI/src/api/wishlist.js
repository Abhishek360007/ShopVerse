import axios from "axios";
import { API_BASE_URL, getHeaders } from "./constant";

const URL = `${API_BASE_URL}/api/wishlist`;

// Every call returns the customer's full, updated wishlist (a list of products).
export const fetchWishlistAPI = async () => (await axios.get(URL, { headers: getHeaders() })).data;

export const addToWishlistAPI = async (productId) =>
    (await axios.post(`${URL}/${productId}`, null, { headers: getHeaders() })).data;

export const removeFromWishlistAPI = async (productId) =>
    (await axios.delete(`${URL}/${productId}`, { headers: getHeaders() })).data;

export const mergeWishlistAPI = async (productIds) =>
    (await axios.post(`${URL}/merge`, { productIds }, { headers: getHeaders() })).data;
