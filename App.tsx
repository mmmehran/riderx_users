import React, { useState, useMemo, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import * as Sentry from '@sentry/react-native';
import { navigationRef, navigate } from './src/navigation/navigationRef';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';


import BaseNavigator from './src/navigation/BaseNavigator';
import toastConfig from './src/config/toastConfig';
import AppContext from './src/components/common/AppContext';
import store, { persistor } from './src/redux/store';
import i18n, { initLanguage } from './src/utils/i18n';
import { initDing } from './src/utils/sounds';
import routes from './src/navigation/routes';
import { Linking } from 'react-native';
import { setDeepLink } from './src/utils/deepLinkHolder';
import WebEngage from 'react-native-webengage';
import WebEngagePlugin from 'react-native-webengage';

const App = () => {
  const [userDevice, setUserDevice] = useState([]);

  useEffect(() => { initDing(); }, []);

  Sentry.init({
    dsn: 'https://517fd9838e281bbff678301e43f8df48@sentry2.pttp.me/29',

    // Adds more context data to events (IP address, cookies, user, etc.)
    // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
    sendDefaultPii: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });


  useEffect(() => {
    initLanguage(); // sets stored/device language + RTL
  }, []);

  useEffect(() => {
    // onMessage Firebase Method is invoked when a notification is displayed on foreground
    const onMessageHandler = messaging().onMessage(async remoteMessage => {
      const webengage: WebEngagePlugin = new WebEngage();
      // Pass push payload to WebEngage
      webengage.push.onMessageReceived(remoteMessage);     // Add This  
    });
    return () => {
      onMessageHandler();
    };
  }, []);


  useEffect(() => {
    const webengage = new WebEngage();
    const registerDeviceAndSendToken = async () => {
      await messaging().registerDeviceForRemoteMessages();
      // Get Token From Firebase
      const token = await messaging().getToken();
      // Pass Token to WebEngage
      webengage.push.sendFcmToken(token);                     // Add This
    };

    registerDeviceAndSendToken();

    // WebEngage iOS delivers push deeplinks here instead of via Linking
    webengage.push.onClick((notificationData: any) => {
      const deeplink = notificationData?.deeplink;
      if (deeplink) {
        setDeepLink(String(deeplink));
      }
    });
  }, []);


  const globalState = useMemo(
    () => ({
      userDevice,
      setUserDevice,
    }),
    [],
  );

  const goToHomeMainWith = (data?: any) => {
    if (!data) return;
    navigate(routes.DRAWERNAVIGATOR, {
      screen: routes.HOMEMAIN,
      params: data,
    });
  };

  const goToChatWith = (senderId: any) => {
    if (!senderId) return;
    navigate(routes.DRAWERNAVIGATOR, {
      screen: routes.CHAT,
      params: { senderId: String(senderId) },
    });
  };

  const handleNotificationPress = (data: any) => {
    if (!data) return;

    // Check if there is an active order
    const state = store.getState();
    const hasActiveOrder = !!state.config.selectedOrder;

    if (hasActiveOrder && data.id) {
      // Navigate to MultiOrder screen (NEXTTRIP)
      navigate(routes.DRAWERNAVIGATOR, {
        screen: routes.NEXTTRIP,
        params: { data: [data], show: false },
      });
    } else {
      // Navigate to Home screen
      goToHomeMainWith({ ...data, refreshDeliveries: true });
    }
  };

  useEffect(() => {
    // 1) Cold start from a push (FCM)
    messaging().getInitialNotification().then(initial => {
      console.log('FCM Initial Notification:', initial);
      if (initial?.data) handleNotificationPress(initial.data);
    });

    // 2) Background → foreground (user tapped FCM)
    const unsubOpen = messaging().onNotificationOpenedApp(msg => {
      console.log('FCM Background Notification:', msg);
      if (msg?.data) handleNotificationPress(msg.data);
    });

    // 3) Notifee Background/Foreground interaction
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const { notification } = detail;
        console.log('Notifee Foreground/Background Press:', detail);
        if (notification?.data?.type === 'chat') {
          goToChatWith(notification.data.senderId);
        } else if (notification?.data) {
          handleNotificationPress(notification.data);
        }
      }
    });

    // 4) Handle cold start from Notifee
    notifee.getInitialNotification().then(initial => {
      console.log('Notifee Initial Notification:', initial);
      const data = initial?.notification?.data;
      if (data?.type === 'chat') {
        goToChatWith(data.senderId);
      } else if (data) {
        handleNotificationPress(data);
      }
    });

    Linking.getInitialURL().then((v) => {
      if (v) {
        setDeepLink(v)
      }
    })

    // // 4) Handle cold start from Notifee
    // notifee.getInitialNotification().then(initial => {
    //   if (initial?.notification?.data?.type === 'chat') {
    //     goToChatWith(initial.notification.data.senderId);
    //   }
    // });

    return () => {
      unsubOpen();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <AppContext.Provider value={globalState}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <NavigationContainer ref={navigationRef} >
                  <BaseNavigator />
                </NavigationContainer>
              </GestureHandlerRootView>
            </PersistGate>
          </Provider>
        </AppContext.Provider>
      </I18nextProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
};

export default Sentry.wrap(App);

//token : glpat-1yEdC__VY7Ts-e9Mv8Xm
