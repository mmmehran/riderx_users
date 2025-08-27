import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';

const Screen = ({ children, style, visibleBlur, normal }) => {
    return (
        <>
            <StatusBar
                barStyle={"dark-content"}
                backgroundColor={colors.background}
            ></StatusBar>
            {visibleBlur && <View style={styles.visible}></View>}
            {normal ?
                <View style={[styles.screen, style]}>{children}</View>
                :
                <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>}
        </>
    )
}

export default Screen;

const styles = StyleSheet.create({
    screen: {
        backgroundColor: colors.background,
        flex: 1,
        zIndex: 1
    },
    visible: {
        width: wp(100),
        height: hp(100),
        backgroundColor: colors.gray800,
        position: "absolute",
        zIndex: 2,
        opacity: 0.5
    }
});