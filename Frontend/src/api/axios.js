import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../features/authSlice';

const api = axios.create({
    baseURL: 'https://node-api-pos-coffee-sys-3.onrender.com/api',
    timeout: 60000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            store.dispatch(logout());
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;