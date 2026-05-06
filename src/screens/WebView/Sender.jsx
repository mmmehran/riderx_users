import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  Linking,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import InAppBrowser from 'react-native-inappbrowser-reborn';


import colors from '../../config/colors';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';

export default function Sender({ route }) {
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const webViewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const lastBackPress = useRef(0);

  const [webUrl, setWebUrl] = useState('');

  const onMessage = useCallback(
    e => {
      try {
        const data = JSON.parse(e.nativeEvent.data);
        if (data?.type === 'LOGOUT') {
          dispatch(logout());
        }
      } catch { }
    },
    [dispatch],
  );

  const handlePaymentUrl = async url => {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, {
        showTitle: true,
        enableUrlBarHiding: false,
        enableDefaultShare: false,
      });
      return;
    } else {
      Linking.openURL(url);
    }
  };

  useEffect(() => {
    setWebUrl(user?.social_auth_callback_url ?? '');

    const handleUrl = ({ url }) => {
      const normalizedUrl = url.replace('riderxapp://', 'https://')
      if (normalizedUrl.includes('/payment/success') || normalizedUrl.includes('/payment/cancel')) {
        setWebUrl(normalizedUrl);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    return () => {
      subscription.remove();
    };
  }, [user?.social_auth_callback_url]);

  // ✅ BACK HANDLER (WebView + Double back exit)
  useEffect(() => {
    const onBackPress = () => {
      // 1. If WebView can go back
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      // 2. Double back to exit
      const now = Date.now();
      if (lastBackPress.current && now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPress.current = now;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screen}>
        <View style={{ flex: 1 }}>
          {webUrl.length > 0 && (
            <WebView
              ref={webViewRef}
              key={user?.user_id || 'guest'}
              style={{ flex: 1 }}
              source={{ uri: webUrl }}
              javaScriptEnabled={true}
              onMessage={onMessage}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              incognito
              cacheEnabled={false}
              thirdPartyCookiesEnabled={false}
              domStorageEnabled={false}
              setSupportMultipleWindows={true}
              javaScriptCanOpenWindowsAutomatically={true}
              onShouldStartLoadWithRequest={request => {
                if (request.url.includes('vivapayments')) {
                  handlePaymentUrl(request.url);
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={navState => {
                canGoBackRef.current = navState.canGoBack;
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
  },
});
