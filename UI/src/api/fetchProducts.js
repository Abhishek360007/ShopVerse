import axios from "axios";
import { API_BASE_URL, API_URLS } from "./constant"

const fetchList = async (params) => {
    try {
        // axios drops undefined params, so we never send "categoryId=undefined"
        const result = await axios.get(API_BASE_URL + API_URLS.GET_PRODUCTS, { params });
        return result?.data ?? [];
    } catch (err) {
        console.error(err);
        return [];
    }
};

export const getAllProducts = (categoryId, typeId) =>
    fetchList({ categoryId: categoryId || undefined, typeId: typeId || undefined });

export const searchProducts = (query) => fetchList({ q: query });

export const getProductBySlug = async (slug)=>{
    const products = await fetchList({ slug });
    return products?.[0];
}
