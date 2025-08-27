/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialStateObject = {
   allTypes: null,
   userProfile: null

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
      logouConfig: () => {
         return initialStateObject
      },
   },
});

export const {
   setAllTypes,
   logouConfig,
   setUserProfile
} = configSlice.actions;

export default configSlice.reducer;
