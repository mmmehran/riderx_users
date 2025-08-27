/* eslint-disable prettier/prettier */

import {
   combineReducers,
   configureStore
} from "@reduxjs/toolkit";
import {
   persistStore,
   persistReducer,
   FLUSH,
   REHYDRATE,
   PAUSE,
   PERSIST,
   PURGE,
   REGISTER,
} from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authenticationReducer from "./reducers/authenticationReducer";
import configReducer from "./reducers/configReducer";



const persistConfig = {
   key: "root",
   storage: AsyncStorage,
};

const rootReducer = combineReducers({
   auth: authenticationReducer,
   config: configReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
   reducer: persistedReducer
});

export const persistor = persistStore(store);

export default store;
