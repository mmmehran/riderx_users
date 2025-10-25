/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialStateObject = {
   allTypes: null,
   userProfile: null,
   selectVehicle:null,
   socketStatus:false,
   seeOnboarding:false

};

export const selectConfig = (state) => state.config;

export const configSlice = createSlice({
   name: "config",
   initialState: initialStateObject,
   reducers: {
      setAllTypes: (state, action) => {
         return {
            ...state,
            allTypes: action.payload,
         };
      },
      setSocketStatus: (state, action) => {
         return {
            ...state,
            socketStatus: action.payload,
         };
      },
      setUserProfile: (state, action) => {
         return {
            ...state,
            userProfile: action.payload,
         };
      },
      setSelectVehicle: (state, action) => {
         return {
            ...state,
            selectVehicle: action.payload,
         };
      },
      setSeeOnboarding: (state) => {
         return {
            ...state,
            seeOnboarding: true
         };
      },
      logouConfig: () => {
           return {
           allTypes: null,
           userProfile: null,
           selectVehicle:null,
           socketStatus:false,
           seeOnboarding:true
         };
      },
   },
});

export const {
   setAllTypes,
   logouConfig,
   setUserProfile,
   setSelectVehicle,
   setSocketStatus,
   setSeeOnboarding
} = configSlice.actions;

export default configSlice.reducer;
