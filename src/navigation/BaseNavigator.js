import React, { useEffect } from "react";
import { AppState } from "react-native";
import IdleTimerManager from "react-native-idle-timer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector,useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";

import SplashScreen from '../screens/Splash/Splash';
import MainNavigator from './MainNavigator';
import useDidMountEffect from '../utils/customHooks/UseDidMountEffect';
import {  authenticated} from '../redux/reducers/authenticationReducer';
import {setConfig,setConfigTest} from '../services/defaultAxios'
import routes from "./routes";
import {setSelectVehicle} from '../redux/reducers/configReducer';
import { getData} from '../services/common.service';
import urls from '../services/urls.json';
import errorHandler from '../utils/errorHandler';

const Stack = createNativeStackNavigator();

const BaseNavigator = () => {
  const user = useSelector(authenticated);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const getVehicle = async () => {
    const response = await getData(`${urls.GETVEHICLE}?page=1`);
    if (response?.data?.status) {
      if (response?.data?.data?.items?.length == 1) {
       await dispatch(setSelectVehicle(response?.data?.data?.items[0]));
      }
    } else {
      errorHandler(response);
    }
  };

  const fetchRoute = async()=>{
    if(user?.authenticated == true){
      if(user?.is_rider){
        await  getVehicle()
        navigation.navigate(routes.DRAWERNAVIGATOR)
      }else{
        navigation.navigate(routes.SENDER)
      }
    }else{
       navigation.navigate(routes.AUTHNAVIGATOR);
    }
  }

  useDidMountEffect(() => {
    fetchRoute()
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
