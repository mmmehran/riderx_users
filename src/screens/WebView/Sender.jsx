import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
  Linking
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

  const onMessage = useCallback(e => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.type === 'LOGOUT') {
        dispatch(logout());
      }
    } catch { }
  }, [user]);

  const handlePaymentUrl = async (url) => {
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
  }

  const [webUrl, setWebUrl] = useState('');

  useEffect(() => {
    setWebUrl(user?.social_auth_callback_url ?? '')
    const handleUrl = ({ url }) => {
      // Example: myapp://payment-success?status=ok
      if (url.includes('/payment/success')) {
        // Convert to your web URL if needed
        const newUrl = url;

        setWebUrl(newUrl);
      }
      if (url.includes('/payment/cancel')) {
        // Convert to your web URL if needed
        const newUrl = url;

        setWebUrl(newUrl);
      }
    };

    Linking.addEventListener('url', handleUrl);

    return () => {
      Linking.removeAllListeners('url')
    };
  }, [user?.social_auth_callback_url]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screen}>
        <View style={{ flex: 1 }}>
          {webUrl.length > 0 && (
            <WebView
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
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.includes("vivapayments")) {
                  handlePaymentUrl(request.url)
                  return false;
                }
                return true;
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
