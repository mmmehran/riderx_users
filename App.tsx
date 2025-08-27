import React, { useState, useMemo } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';

import BaseNavigator from "./src/navigation/BaseNavigator";
import toastConfig from './src/config/toastConfig';
import AppContext from "./src/components/common/AppContext";
import store, { persistor } from "./src/redux/store";
import i18n from './src/utils/i18n'

const App = () => {
  const [userDevice, setUserDevice] = useState([]);

  const globalState = useMemo(() => (
    {
      userDevice,
      setUserDevice
    }
  ), [])



  return (
    <SafeAreaProvider>
       <I18nextProvider i18n={i18n}>
      <AppContext.Provider value={globalState}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NavigationContainer
               
              >
                <BaseNavigator />
              </NavigationContainer>
            </GestureHandlerRootView>
          </PersistGate>
        </Provider>
      </AppContext.Provider>
       </I18nextProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  )
}

export default App

//token : glpat-1yEdC__VY7Ts-e9Mv8Xm