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
            <View style={[styles.inputContainer, stylesInput,
            !errors[name] || !touched[name] ? null : styles.errorStyle,
            noIcon && { paddingLeft: wp(2) }
            ]}>
                {icon}
                <TextInput
                    {...otherprops}
                    onChangeText={handleChange(name)}
                    placeholderTextColor={colors.neutral400}
                    placeholder={inputName}
                    value={otherprops?.value}
                    onFocus={() => setFocus(true)}
                    onBlur={() => {
                        setFieldTouched(name);
                        setFocus(false);
                    }}
                    style={[styles.input, input,
                    noIcon && { width: wp(85) },
                    password && { width: wp(72), paddingRight:wp(2) },
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
        width: wp(92),
        height: hp(5.4),
        backgroundColor: colors.white,
        paddingVertical: hp(0),
        marginHorizontal: wp(4),
        borderRadius: wp(3),
        flexDirection: "row",
        alignItems: "center",
        marginTop:hp(0.5),
        borderWidth:wp(0.33),
        borderColor:colors.neutral200,
        paddingLeft:wp(3)
    },
    errorStyle: {
        borderColor: colors.error900
    },
    input: {
        height: hp(5.4),
        color: colors.neutral900,
        textAlign: "left",
        width: wp(77),
        fontSize: wp(3.8),
        fontFamily: "YaldeviJaffna-Medium",
        marginLeft:wp(2),
    },
    title: {
        fontSize: wp(3.5),
        marginLeft: wp(5.5),
        marginBottom: hp(0.5)
    },
    row: {
        flexDirection: "row"
    },
    star: {
        color: colors.error900,
        marginLeft: wp(1)
    }
});

