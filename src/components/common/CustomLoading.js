import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';

const CustomLoading = ({ children, style, ...rest }) => {

    return (
        <View style={styles.container}>
            <ActivityIndicator color={colors.primary} size={"large"}></ActivityIndicator>
        </View>
    )
}

export default CustomLoading

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});