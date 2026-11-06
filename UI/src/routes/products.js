import { getProductBySlug } from '../api/fetchProducts';
import { setLoading } from '../store/features/common';
import store from '../store/store';

export const loadProductBySlug = async ({params}) =>{
    store.dispatch(setLoading(true));
    try{
        const product = await getProductBySlug(params?.slug);
        return {product};
    }
    catch(err){
        return {product: undefined};
    }
    finally{
        store.dispatch(setLoading(false));
    }
}