import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginEmail from '../screens/Auth/LoginEmail';
import ResetPasswordEmail from '../screens/Auth/ResetPasswordEmail';
import ResetPasswordOtp from '../screens/Auth/ResetPasswordOtp';
import ResetPassword from '../screens/Auth/ResetPassword';
import SignUpSender from '../screens/WebView/SignUpSender'
import routes from "./routes";

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {

    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName={routes.LOGIN}
        >
            <Stack.Screen
                name={routes.LOGIN}
                component={LoginEmail}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.SIGNUPSENDER}
                component={SignUpSender}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.RESETPASSWORDEMAIL}
                component={ResetPasswordEmail}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.RESETPASSWORDOTP}
                component={ResetPasswordOtp}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Stack.Screen
                name={routes.RESETPASSWORD}
                component={ResetPassword}
                options={{ fullScreenGestureEnabled: false }}
            />
        
        </Stack.Navigator>
    )
};

export default AuthNavigator;
