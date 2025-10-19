/* eslint-disable prettier/prettier */
import React from 'react';
import { StyleSheet, Switch } from 'react-native';


const CustomSwitch = ({
    onSwitch,
    value
}) => {

    return (
        <Switch
            trackColor={{ false: "rgba(77, 129, 240, 1)", true: "rgba(77, 129, 240, 1)" }}
            thumbColor={"#FEFEFE"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={onSwitch}
            value={value}
            style={styles.switch}
        />
    )
}

export default CustomSwitch

const styles = StyleSheet.create({
    switch: {
        // This scales up the size of the Switch!
        transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }],
    },
});