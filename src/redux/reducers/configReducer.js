/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialStateObject = {
   allTypes: null,
   userProfile: null,
   selectVehicle:null

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
      logouConfig: () => {
         return initialStateObject
      },
   },
});

export const {
   setAllTypes,
   logouConfig,
   setUserProfile,
   setSelectVehicle
} = configSlice.actions;

export default configSlice.reducer;
