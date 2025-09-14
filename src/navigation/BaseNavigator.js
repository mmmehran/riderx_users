import React, { useEffect } from "react";
import { AppState } from "react-native";
import IdleTimerManager from "react-native-idle-timer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import SplashScreen from '../screens/Splash/Splash';
import MainNavigator from './MainNavigator';
import useDidMountEffect from '../utils/customHooks/UseDidMountEffect';
import {  authenticated} from '../redux/reducers/authenticationReducer';
import {setConfig,setConfigTest} from '../services/defaultAxios'
import routes from "./routes";

const Stack = createNativeStackNavigator();

const BaseNavigator = () => {
  const user = useSelector(authenticated);
  const navigation = useNavigation();




  useDidMountEffect(() => {
    user?.authenticated
      ? navigation.navigate(routes.DRAWERNAVIGATOR)
      : navigation.navigate(routes.AUTHNAVIGATOR);
  }, [user?.authenticated]);

  useEffect(() => {
    if( user?.authenticated && /^[^@\s]+@bb\.com$/i.test(user?.email)){
        setConfigTest()
    }else{
        setConfig()
    }

    const apply = (state) => {
      const isActive = state === "active";
      IdleTimerManager.setIdleTimerDisabled(Boolean(user?.authenticated) && isActive);
    };

    apply(AppState.currentState);

    const sub = AppState.addEventListener("change", apply);
    return () => {
      sub.remove();
      IdleTimerManager.setIdleTimerDisabled(false);
    };
  }, [user?.authenticated]);

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={routes.SPLASH}
    >
      <Stack.Screen
        name={routes.SPLASH}
        component={SplashScreen}
        options={{ fullScreenGestureEnabled: false }}
      />
      <Stack.Screen
        name={routes.MAINNAVIGATOR}
        component={MainNavigator}
        options={{ fullScreenGestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

export default BaseNavigator;
