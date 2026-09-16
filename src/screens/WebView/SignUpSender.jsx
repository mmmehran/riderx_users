import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import { appleAuth } from '@invertase/react-native-apple-authentication';

import CustomScreen from '../../components/common/CustomScreen';
import {
  logout,
  authenticated,
  login
} from '../../redux/reducers/authenticationReducer';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { IOS_CLIENT_ID, WEB_CLIENT_ID } from "@env";
import { postData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { showToast, showError } from '../../utils/helpers';
import { setConfig, setConfigTest } from '../../services/defaultAxios';
import { trackLogin, trackLogout } from '../../utils/webengage';



export default function SignUpSender({ route }) {
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const onMessage = useCallback(e => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.type === 'LOGOUT') {
        dispatch(logout());
        trackLogout()
      }
      if (data?.type === 'google_auth') {
        handleGoogleLogin()
      }
      if (data?.type === 'apple_auth') {
        handleAppleLogin()
      }
    } catch { }
  }, []);


  useEffect(() => {
    GoogleSignin.configure({
      iosClientId: IOS_CLIENT_ID,
      webClientId: WEB_CLIENT_ID,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
      }
      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();
      const token = await GoogleSignin.getTokens();

      setConfig();
      await new Promise(r => setTimeout(r, 300));

      const response = await postData(
        urls.SOCIALLOGIN,
        {
          access_token: token?.accessToken,
        },
        false,
      );

      if (response?.data?.status) {
        if (response?.data?.data) {
          dispatch(login(response?.data?.data));
          trackLogin(response?.data?.data)
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
    } catch (error) {
      showError(error?.message || 'Something went wrong');
    } finally {
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== 'ios' || !appleAuth.isSupported) {
        showError('Sign in with Apple is not supported.');
        return;
      }
      const appleResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      const { user, email, fullName, identityToken, authorizationCode } =
        appleResponse;
      setConfig();
      await new Promise(r => setTimeout(r, 300));
      const response = await postData(
        urls.SOCIALLOGINAPPLE,
        {
          id_token: identityToken,
          apple_user: user,
          email,
          fullName,
        },
        false,
      );
      if (response?.data?.status) {
        if (response?.data?.data) {
          dispatch(login(response?.data?.data));
          trackLogin(response?.data?.data)
        }
        showToast(response?.data?.message);
      } else {
        errorHandler(response);
      }
    } catch (e) {
      if (e?.code !== appleAuth.Error.CANCELED) {
        console.log('Apple sign-in error', e);
        showError(e?.message || 'Apple Sign-In failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomScreen>
      <View style={styles.webviewWrap} collapsable={false}>
        <WebView
          key={user?.user_id || 'guest'}
          style={styles.webview}
          containerStyle={styles.webviewContainer}
          source={{ uri: 'https://s.riderx.me/register' }}
          javaScriptEnabled
          onMessage={onMessage}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          incognito
          cacheEnabled={false}
          thirdPartyCookiesEnabled={false}
          domStorageEnabled={false}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled
          scrollEnabled
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          showsHorizontalScrollIndicator={false}
          injectedJavaScript={PREVENT_WEBVIEW_OVERSCROLL}
        />
      </View>
    </CustomScreen>
  );
}

const PREVENT_WEBVIEW_OVERSCROLL = `
  (function() {
    try {
      var style = document.createElement('style');
      style.innerHTML = 'html, body { overscroll-behavior: none; }';
      document.head.appendChild(style);
    } catch (e) {}
    true;
  })();
`;

const styles = StyleSheet.create({
  webviewWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
