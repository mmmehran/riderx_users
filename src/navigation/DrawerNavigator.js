import React from 'react';
import { createDrawerNavigator } from "@react-navigation/drawer";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSelector } from 'react-redux';

import routes from "./routes";
import colors from '../config/colors';
import HomeMainScreen from '../screens/App/HomeScreens/HomeMainScreen'
import ChooseTheService from '../screens/App/ChooseService/ChooseTheService'
import ChooseVehicle from '../screens/App/ChooseVehicle/ChooseVehicle'
import DrawerScreen from '../screens/Drawer/Drawer'
import ChangeLanguage from '../screens/Drawer/ChangeLanguage'
import Report from '../screens/Drawer/Report'
import Wallet from '../screens/Drawer/Wallet'
import ResetPassword from '../screens/Drawer/ResetPassword'
import MyAccount from '../screens/Drawer/MyAccount'
import { selectConfig } from '../redux/reducers/configReducer'
import Sender from '../screens/WebView/Sender'
import EditMyAccount from '../screens/Drawer/EditMyAccount'
import AppSettings from '../screens/Drawer/AppSettings'
import SelectExternalMap from '../screens/Drawer/SelectExternalMap'
import SelectMapStyle from '../screens/Drawer/SelectMapStyle'
import MultiOrder from '../screens/Drawer/MultiOrder'
import ChatScreen from '../screens/Drawer/ChatScreen'
import ChatListScreen from '../screens/Drawer/ChatListScreen'

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
    const config = useSelector(selectConfig);

    return (
        <Drawer.Navigator
            initialRouteName={config?.selectVehicle == null ? routes.CHOOSEVEHICLE : routes.HOMEMAIN}
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
                name={routes.NEXTTRIP}
                component={MultiOrder}
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
            <Drawer.Screen
                name={routes.SENDER}
                component={Sender}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.MYACCOUNT}
                component={MyAccount}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHANGELANGUAGE}
                component={ChangeLanguage}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHANGEPASSWORD}
                component={ResetPassword}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.EDITMYACCOUNT}
                component={EditMyAccount}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.APPSETTINGS}
                component={AppSettings}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.SELECTEXTERNALMAP}
                component={SelectExternalMap}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.MAPSTYLE}
                component={SelectMapStyle}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHAT}
                component={ChatScreen}
                options={{ fullScreenGestureEnabled: false }}
            />
            <Drawer.Screen
                name={routes.CHATLIST}
                component={ChatListScreen}
                options={{ fullScreenGestureEnabled: false }}
            />
        </Drawer.Navigator>
    )
}

export default DrawerNavigator

