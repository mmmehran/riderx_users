import React from 'react';
import { createDrawerNavigator } from "@react-navigation/drawer";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import routes from "./routes";
import colors from '../config/colors';
import HomeMainScreen from '../screens/App/HomeScreens/HomeMainScreen'
import ChooseTheService from '../screens/App/ChooseService/ChooseTheService'
import ChooseVehicle from '../screens/App/ChooseVehicle/ChooseVehicle'
import DrawerScreen from '../screens/Drawer/Drawer'
import Report from '../screens/Drawer/Report'
import Wallet from '../screens/Drawer/Wallet'


const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  

    return (
        <Drawer.Navigator
            initialRouteName={routes.HOMEMAIN}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: wp(80),
                    backgroundColor: colors.screen
                },
                drawerPosition: "left",
                drawerType: "slide"
            }}
            drawerContent={(props) => <DrawerScreen {...props}></DrawerScreen>}
        >
            <Drawer.Screen
                name={routes.HOMEMAIN}
                component={HomeMainScreen}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHOOSESERVICE}
                component={ChooseTheService}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHOOSEVEHICLE}
                component={ChooseVehicle}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.REPORT}
                component={Report}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.WALLET}
                component={Wallet}
                options={{ fullScreenGestureEnabled: false }}
            />
        </Drawer.Navigator>
    )
}

export default DrawerNavigator

