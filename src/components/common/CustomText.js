import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';

const CustomText = ({ children, style, ...rest }) => {

    return (
        <Text
            style={[styles.default, style]}
            {...rest}
        >{children}</Text>
    )
}

export default CustomText

const styles = StyleSheet.create({
    default: {
        color: colors.black,
        fontSize: wp(4),
     //   fontFamily: "Poppins-Regular",
    }
});