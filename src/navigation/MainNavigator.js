import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import routes from "./routes";
import { authenticated } from '../redux/reducers/authenticationReducer';
import Sender from '../screens/WebView/Sender'
import InstallDriverApp from "../screens/WebView/InstallDriverApp"

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
    const user = useSelector(authenticated);

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={user?.authenticated ? user?.is_rider ? (/^[^@\s]+@bb\.com$/i.test(user?.email) ? routes.DRAWERNAVIGATOR : routes.INSTALLDRIVERAPP) : routes.SENDER : routes.AUTHNAVIGATOR}
        >
            <Stack.Screen
                name={routes.AUTHNAVIGATOR}
                component={AuthNavigator}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.DRAWERNAVIGATOR}
                component={DrawerNavigator}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.SENDER}
                component={Sender}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.INSTALLDRIVERAPP}
                component={InstallDriverApp}
                options={{ fullScreenGestureEnabled: false }}
            />
        </Stack.Navigator>
    )
};

export default MainNavigator;
