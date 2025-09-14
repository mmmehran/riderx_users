import React, { useEffect } from "react";
import { AppState } from "react-native";
import IdleTimerManager from "react-native-idle-timer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import SplashScreen from '../screens/Splash/Splash';
import MainNavigator from './MainNavigator';
import useDidMountEffect from '../utils/customHooks/UseDidMountEffect';
import { selectAuthenticated } from '../redux/reducers/authenticationReducer';

import routes from "./routes";

const Stack = createNativeStackNavigator();

const BaseNavigator = () => {
  const authenticated = useSelector(selectAuthenticated);
  const navigation = useNavigation();

  useDidMountEffect(() => {
    authenticated
      ? navigation.navigate(routes.DRAWERNAVIGATOR)
      : navigation.navigate(routes.AUTHNAVIGATOR);
  }, [authenticated]);

  useEffect(() => {
    const apply = (state) => {
      const isActive = state === "active";
      IdleTimerManager.setIdleTimerDisabled(Boolean(authenticated) && isActive);
    };

    apply(AppState.currentState);

    const sub = AppState.addEventListener("change", apply);
    return () => {
      sub.remove();
      IdleTimerManager.setIdleTimerDisabled(false);
    };
  }, [authenticated]);

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
