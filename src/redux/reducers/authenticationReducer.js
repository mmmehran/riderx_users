/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialStateObject = {
   authenticated: false,
   token: null,
   user_id: null,
   email:null,
   phone:null,
   socketio:null,
   userProfile:null,
   profile_image:null,
   email_verified:null,
   is_rider:null,
   social_auth_callback_url:null,
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
            phone: action.payload?.phone ? `${action.payload?.phone?.country_code}${action.payload?.phone?.number}` : null,
            socketio: action.payload?.socketio,
            profile_image: action.payload?.profile_image,
            email_verified: action.payload?.email_verified,
            is_rider: action.payload?.is_rider ? action.payload?.is_rider : false,
            social_auth_callback_url: action.payload?.social_auth_callback_url ,
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
