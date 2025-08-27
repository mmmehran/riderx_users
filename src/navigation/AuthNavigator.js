import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginEmail from '../screens/Auth/LoginEmail';
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
        
        </Stack.Navigator>
    )
};

export default AuthNavigator;
