import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useFormikContext } from "formik";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import colors from '../../config/colors';
import Alert from './CustomFormError';
import { EyeOff, EyeOn } from '../../../assets/svg/index';
import CustomText from '../common/CustomText';

const CustomFormField = ({
    onChangeText,
    placeholder,
    stylesInput,
    name,
    inputName,
    alertStyle,
    input,
    placeholderShow,
    eye,
    icon,
    title,
    stylesText,
    editable,
    onPress,
    password = false,
    star,
    noIcon,
    ...otherprops }) => {

    const [focus, setFocus] = useState(false);
    const { handleChange, setFieldTouched, touched, errors, } = useFormikContext();
    const [showPassword, setShowPassword] = useState(false)

    return (
        <>
            {title &&
                <View style={styles.row}>
                    <CustomText style={styles.title}>{title}</CustomText>
                    {star && <CustomText style={styles.star}>*</CustomText>}
                </View>
            }
            <View style={[styles.inputContainer, stylesInput, password && styles.disableContainer,
            !errors[name] || !touched[name] ? null : styles.errorStyle,
            noIcon && { paddingLeft: wp(2) }
            ]}>
                {icon}
                <TextInput
                    {...otherprops}
                    onChangeText={handleChange(name)}
                    placeholderTextColor={colors.text}
                    placeholder={inputName}
                    value={otherprops?.value}
                    onFocus={() => setFocus(true)}
                    onBlur={() => {
                        setFieldTouched(name);
                        setFocus(false);
                    }}
                    style={[styles.input, input,
                    noIcon && { width: wp(85) },
                    password && { width: wp(75) },
                    eye && { width: wp(63) }]}
                    secureTextEntry={password ? !showPassword : false}
                ></TextInput>
                {password ?
                    showPassword ?
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <EyeOn />
                        </TouchableOpacity>
                        :
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <EyeOff></EyeOff>
                        </TouchableOpacity>
                    : null
                }
            </View>
            <View>
                <Alert error={errors[name]} visible={touched[name]} alertStyle={alertStyle} />
            </View>
        </>
    );
};

export default CustomFormField;

const styles = StyleSheet.create({
    inputContainer: {
        width: wp(89),
        height: hp(6),
        backgroundColor: colors.darkGray,
        paddingVertical: hp(0),
        marginHorizontal: wp(5.5),
        borderRadius: wp(3),
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(4),
        marginTop:hp(0.5)
    },
    errorStyle: {
        borderColor: colors.red
    },
    input: {
        height: hp(6),
        color: colors.text,
        textAlign: "left",
        width: wp(80),
        paddingHorizontal: wp(4),
        fontSize: wp(3.5),
        fontFamily: "Poppins-Regular",
    },
    disableContainer: {
        paddingLeft: wp(3),
        backgroundColor: colors.disableFill,
        borderWidth: 0
    },
    title: {
        fontSize: wp(3.5),
        fontFamily: "Poppins-Regular",
        marginLeft: wp(5.5),
        marginBottom: hp(0.5)
    },
    row: {
        flexDirection: "row"
    },
    star: {
        color: colors.red,
        marginLeft: wp(1)
    }
});

