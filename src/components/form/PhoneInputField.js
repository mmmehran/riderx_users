import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFormikContext } from 'formik';
import PhoneInput from 'react-native-international-phone-number';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import colors from '../../config/colors';
import Alert from './CustomFormError';
import CustomText from '../common/CustomText';

const PhoneFormField = ({
  name = 'phoneNumber',
  countryField = 'phoneCountry',
  dialCodeField = 'phoneDialCode',
  title,
  star,
  placeholder = 'Enter your Phone Number',
  defaultCode = 'IT',
  stylesInput,
  stylesText,
  alertStyle,
}) => {
  const { setFieldValue, setFieldTouched, touched, errors, values } =
    useFormikContext();

  const value = values?.[name] ?? '';
  const iso = values?.[countryField] ?? defaultCode;

  const [selectedCountry, setSelectedCountry] = useState(null);

  const error = useMemo(
    () => touched?.[name] && errors?.[name],
    [touched, errors, name]
  );

  const extractDialCode = country => {
    // library-dependent – try multiple shapes
    if (!country) return '';
    // some versions use "callingCode: '+43'"
    if (country.callingCode) {
      return String(country.callingCode).replace(/^\+/, '');
    }
    // generic "root"
    if (country.idd?.root) {
      return String(country.idd.root).replace(/^\+/, '');
    }
    return '';
  };

  return (
    <>
      <View style={[styles.fieldWrapper, stylesInput]}>
        <PhoneInput
          value={value}
          placeholder={placeholder}
          defaultCountry={iso}          // ex: "AT"
          selectedCountry={selectedCountry}
          onChangeSelectedCountry={country => {
            setSelectedCountry(country);

            const newIso =
              country?.cca2 ||
              country?.code ||
              country?.countryCode ||
              defaultCode;

            const dial = extractDialCode(country);

            setFieldValue(countryField, newIso);   // ex: "AT"
            setFieldValue(dialCodeField, dial);    // ex: "43"
          }}
          onChangePhoneNumber={phoneNumber => {
            // store ONLY digits of the national number
            const digitsOnly = String(phoneNumber).replace(/\D/g, '');
            setFieldValue(name, digitsOnly);
          }}
          onBlur={() => setFieldTouched(name, true)}
          containerStyle={styles.phoneContainer}
          flagContainerStyle={styles.flagContainer}
          inputStyle={styles.phoneInput}
        />
      </View>

      <Alert error={error} visible={!!error} alertStyle={alertStyle} />
    </>
  );
};

export default PhoneFormField;

const styles = StyleSheet.create({
  title: {
    fontSize: wp(3),
    fontFamily: 'Poppins-Regular',
    marginLeft: wp(9),
    color: colors.dark950,
  },
  row: { flexDirection: 'row' },
  star: {
    color: colors.red,
    marginLeft: wp(0.3),
    fontSize: wp(3),
  },
  fieldWrapper: {
    width: wp(92),
    marginHorizontal: wp(4),
    marginTop: hp(0.5),
    borderRadius: wp(3),
  },
  phoneContainer: {
    width: '100%',
    alignItems: 'center',
  },
  flagContainer: {
    height: '100%',
    paddingHorizontal: wp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: wp(3.5),
    color: colors.neutral900,
    fontFamily: 'arial',
    paddingVertical: 0,
    marginLeft: wp(1.2),
    textAlignVertical: 'center',
  },
});
