import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
  View,
} from 'react-native';
import colors from '../../config/colors';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {isAndroid15Plus} from '../../utils/helpers';

const CustomScreen = ({ children }) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.screenBackGround}
      />
      <View style={[styles.container, isAndroid15Plus && { marginBottom: hp(6) }]}>
        <SafeAreaView style={styles.screen}>{children}</SafeAreaView>
      </View>
    </>
  );
};

export default CustomScreen;

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
