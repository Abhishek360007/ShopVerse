import { createSlice } from "@reduxjs/toolkit"

export const initialState = {
    loading: false,
    toast: null,
}

export const commonSlice = createSlice({
    name:'commonSlice',
    initialState,
    reducers:{
        setLoading : (state,action)=>{
            return {
                ...state,
                loading:action?.payload
            }
        },
        showToast: (state, action) => {
            return {
                ...state,
                toast: { message: action?.payload, id: Date.now() }
            }
        },
        hideToast: (state) => {
            return {
                ...state,
                toast: null
            }
        }
    }
});

export const { setLoading, showToast, hideToast } = commonSlice?.actions;
export default commonSlice?.reducer;
