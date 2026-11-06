import { getToken } from "../utils/jwt-helper";
export const API_URLS = {
    GET_PRODUCTS:'/api/products',
    GET_PRODUCT: (id) => `/api/product/${id}`,
    GET_CATEGORIES:'/api/category',
    GET_CATEGORY: (id) => `/api/category/${id}`,
}

// Hosting platforms may give just a host name (e.g. shopverse-api.onrender.com); add https:// when missing
const withScheme = (url) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export const API_BASE_URL = withScheme(process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');


export const getHeaders = ()=>{
    return {
        'Authorization':`Bearer ${getToken()}`
    }
}