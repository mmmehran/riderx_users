/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialStateObject = {
   authenticated: false,
   token: null,
   user_id: null,
   email:null,
   phone:null,
   socketio:null,
   userProfile:null
};

export const selectAuthenticated = (state) => state.auth.authenticated;
export const authenticated = (state) => state.auth;

export const authenticationSlice = createSlice({
   name: "authentication",
   initialState: initialStateObject,
   reducers: {
      login: (state, action) => {
         return {
            authenticated: true,
            token: action.payload?.token,
            user_id: action.payload?.user_id,
            email: action.payload?.email,
            phone: action.payload?.phone,
            socketio: action.payload?.socketio,
         };
      },
      setUserProfile: (state, action) => {
         return {
           ...state,
            userProfile: action.payload,
         };
      },
      logout: () => {
         return initialStateObject
      },
   },
});

export const {
   login,
   logout,
   setUserProfile
} = authenticationSlice.actions;

export default authenticationSlice.reducer;
