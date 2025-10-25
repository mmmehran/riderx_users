import React from 'react';
import { createDrawerNavigator } from "@react-navigation/drawer";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSelector} from 'react-redux';

import routes from "./routes";
import colors from '../config/colors';
import HomeMainScreen from '../screens/App/HomeScreens/HomeMainScreen'
import ChooseTheService from '../screens/App/ChooseService/ChooseTheService'
import ChooseVehicle from '../screens/App/ChooseVehicle/ChooseVehicle'
import DrawerScreen from '../screens/Drawer/Drawer'
import Report from '../screens/Drawer/Report'
import Wallet from '../screens/Drawer/Wallet'
import {selectConfig} from '../redux/reducers/configReducer'

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
    const config = useSelector(selectConfig);

    return (
        <Drawer.Navigator
            initialRouteName={config?.selectVehicle == null ?   routes.CHOOSEVEHICLE  :  routes.HOMEMAIN}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: wp(90),
                    backgroundColor: colors.screen
                },
                drawerPosition: "left",
                drawerType: "slide",
                 swipeEnabled: false, 
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

