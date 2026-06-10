import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import themeReducer from '../features/themeSlice';
import cartReducer from '../features/cartSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        theme: themeReducer,
        cart: cartReducer,
    },
});