import { API_BASE_URL, API_URLS } from "./constant"
import { getWithWakeup } from "./warmup";

export const fetchCategories = async()=> {
    try{
        const result = await getWithWakeup(API_BASE_URL + API_URLS.GET_CATEGORIES);
        return result?.data;
    }
    catch(e){
        console.error(e);
    }
}
