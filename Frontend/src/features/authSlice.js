import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            // 🌟 FORCE FALLBACKS: This guarantees that whether the backend uses 'full_name' or 'name',
            // it gets normalized into properties that your components can read!
            const incomingUser = action.payload.user;

            state.user = {
                ...incomingUser,
                full_name:
                    incomingUser?.full_name || incomingUser?.name || "Staff Member",
                role: incomingUser?.role || "user",
                image_url: incomingUser?.image_url || null,
            };

            state.token = action.payload.token;
            state.isAuthenticated = true;

            // Save to LocalStorage so it stays logged in on page refresh
            localStorage.setItem("user", JSON.stringify(state.user));
            localStorage.setItem("token", state.token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.clear();
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
