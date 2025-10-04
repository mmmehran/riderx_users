import React, {useCallback} from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useDispatch, useSelector} from 'react-redux';

import colors from '../../config/colors';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';

export default function Sender({route}) {
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const onMessage = useCallback(e => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data?.type === 'LOGOUT') {
        dispatch(logout());
      }
    } catch {}
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.screen}>
        <View style={{flex: 1}}>
          <WebView
            key="only-web"
            style={{flex: 1}}
            source={{uri: user?.sender_panel_direct_login_url}}
            javaScriptEnabled
            onMessage={onMessage}
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
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
