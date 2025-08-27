import React from "react";
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
        authenticated ? navigation.navigate(routes.DRAWERNAVIGATOR) :
            navigation.navigate(routes.AUTHNAVIGATOR)
    }, [authenticated])

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
    )
};

export default BaseNavigator;
