// src/features/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("token");
const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

const authSlice = createSlice({
    name: "auth",

    initialState: {
        token,
        isAuthenticated: false,
        isAdmin: false,
        isAuthChecked: false,
        user,
        loading: false,
    },
    reducers: {
        loginStart: (state) => {
            state.loading = true;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;

            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },
        loginFailure: (state) => {
            state.loading = false;
        },
        logout: (state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setAuth: (state, action) => {
            state.isAuthenticated = action.payload;
        },
        setAdmin: (state, action) => {
            state.isAdmin = action.payload;
        },
        setAuthChecked: (state, action) => {
            state.isAuthChecked = action.payload;
        },
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    setUser,
    setAuth,
    setAdmin,
    setAuthChecked
} = authSlice.actions;
export default authSlice.reducer;
