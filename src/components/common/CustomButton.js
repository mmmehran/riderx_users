/* eslint-disable prettier/prettier */
import React from 'react';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import CustomText from './CustomText';
import colors from '../../config/colors';

const CustomButton = ({
    onPress,
    children,
    style,
    disabled,
    textStyle,
    loading,
    loadingColor
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, style, disabled && styles.disable]}
            onPress={onPress}
            disabled={disabled}
        >
            {loading && <View style={styles.loadingStyle}>
                <ActivityIndicator color={loadingColor ? loadingColor : colors.white}></ActivityIndicator>
            </View>}
            <CustomText style={[styles.text, textStyle, disabled && styles.disableText]}>{children}</CustomText>
        </TouchableOpacity>
    )
}

export default CustomButton

const styles = StyleSheet.create({
    container: {
        width: wp(92),
        height: hp(5.4),
        backgroundColor: colors.black,
        borderRadius: wp(3),
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: wp(4),
        flexDirection: "row",
    },
    text: {
        color: colors.screenBackGround,
        fontWeight:"bold"
    },
    disable: {
        backgroundColor: colors.disable
    },
    disableText: {
        color: colors.disableText
    },
    loadingStyle: {
        marginRight: wp(2)
    }
});