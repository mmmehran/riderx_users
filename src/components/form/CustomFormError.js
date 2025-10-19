import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';

const CustomFormError = (props) => {
    return (
        <View style={[styles.container, props.alertStyle]}>
            {!props.error || !props.visible ? null : (<Text style={styles.text}>*{props.error}</Text>)}
        </View>
    )
}

export default CustomFormError

const styles = StyleSheet.create({
    container: {
        marginVertical: hp(0.4),
        height: hp(1.6),
        flexDirection: "row",
        marginHorizontal: wp(9),
        alignItems: "center"
    },
    text: {
        fontSize: wp(2.9),
        color: colors.red,
        lineHeight: hp(1.7),
        fontFamily: "Poppins-Medium",
    }
});