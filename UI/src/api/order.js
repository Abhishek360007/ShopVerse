import axios from "axios";
import { API_BASE_URL, getHeaders } from "./constant";
import { errorMessage } from "../utils/format";

export const placeOrderAPI = async (data)=>{
    const url = API_BASE_URL + '/api/order';
    try{
        const response = await axios(url,{
            method:"POST",
            data:data,
            headers:getHeaders()
        });
        return response?.data;
    }
    catch(err){
        throw new Error(errorMessage(err, 'Unable to place your order. Please try again.'));
    }
}

export const confirmPaymentAPI = async (data)=>{
    const url = API_BASE_URL + '/api/order/update-payment';
    try{
        const response = await axios(url,{
            method:"POST",
            data:data,
            headers:getHeaders()
        });
        return response?.data;
    }
    catch(err){
        throw new Error(errorMessage(err, 'We could not confirm your payment.'));
    }
}
