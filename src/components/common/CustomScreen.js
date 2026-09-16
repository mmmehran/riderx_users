import React from 'react';
import {StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../../config/colors';

const CustomScreen = ({children}) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.screenBackGround}
      />
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'bottom', 'left', 'right']}>
        {children}
      </SafeAreaView>
    </>
  );
};

export default CustomScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.screenBackGround,
  },
});
