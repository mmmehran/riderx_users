import React, {useRef, useState} from 'react';
import {View, StyleSheet, Keyboard} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import * as Yup from 'yup';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import {KeyboardIcon} from '../../../assets/svg/index';
import routes from '../../navigation/routes';
import {Form, Input, Button} from '../../components/form/index';
import {PassCancel, PassSuc} from '../../../assets/svg/index';
import {sendData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {showToast} from '../../utils/helpers';

const hasUppercase = s => /[A-Z]/.test(s || '');
const hasNumber = s => /\d/.test(s || '');
const hasMinLen = s => (s || '').length >= 8;

const ResetPassword = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const formikRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object().shape({
    oldPassword: Yup.string().required().min(8, t('min8Chars')),
    password: Yup.string()
      .required()
      .min(8, t('min8Chars'))
      .matches(/[A-Z]/, t('atLeastOneUpper'))
      .matches(/\d/, t('atLeastOneNumber')),
    rePassword: Yup.string()
      .oneOf(
        [Yup.ref('password'), null],
        t('passwordsMustMatch') || 'Passwords must match',
      )
      .required(t('required') || 'Required'),
  });

  const onSubmit = async value => {
    setLoading(true);
    Keyboard.dismiss();
    const response = await sendData(urls.UPDATEOLDPASSWORD, {
      old_password: value?.oldPassword,
      password: value?.password,
      confirm_password: value?.rePassword,
    });
    if (response?.data?.status) {
      showToast(response?.data?.message);
      navigation.navigate(routes.MYACCOUNT);
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.MYACCOUNT)}
        title={t('password')}
      />

      <CustomText style={styles.textContent}>
        {t('resetPassContent')}
      </CustomText>

      <View style={styles.formContainer}>
        <Form
          initialValues={{oldPassword: '', password: '', rePassword: ''}}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
          innerRef={formikRef}
          enableReinitialize>
          {({values}) => {
            const pw = values?.password || '';
            const okUpper = hasUppercase(pw);
            const okNum = hasNumber(pw);
            const okLen = hasMinLen(pw);
            const passedCount =
              (okUpper ? 1 : 0) + (okNum ? 1 : 0) + (okLen ? 1 : 0);
            const allOk =
              passedCount === 3 && values?.password === values?.rePassword;

            return (
              <>
                <Input
                  name="oldPassword"
                  inputName={t('oldPassword')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                  value={values?.oldPassword}
                  icon={<KeyboardIcon width={wp(4.5)} height={wp(4.5)} />}
                />
                <Input
                  name="password"
                  inputName={t('createPassword')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                  value={values?.password}
                  icon={<KeyboardIcon width={wp(4.5)} height={wp(4.5)} />}
                />

                <Input
                  name="rePassword"
                  inputName={t('Confirmpassword')}
                  input={{textAlign: 'left'}}
                  password
                  autoCapitalize="none"
                  value={values?.rePassword}
                  icon={<KeyboardIcon width={wp(4.5)} height={wp(4.5)} />}
                />
                <View style={styles.meterWrap}>
                  <View
                    style={[
                      styles.meterBar,
                      {
                        backgroundColor:
                          passedCount >= 1 ? colors.errorBase : colors.soft200,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.meterBar,
                      {
                        backgroundColor:
                          passedCount >= 2 ? colors.errorBase : colors.soft200,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.meterBar,
                      {
                        backgroundColor:
                          passedCount >= 3 ? colors.errorBase : colors.soft200,
                      },
                    ]}
                  />
                </View>
                <View style={styles.ruleBox}>
                  <CustomText style={styles.ruleTitle}>
                    {t('mustContainAtLeast')}
                  </CustomText>

                  <RuleItem ok={okUpper} label={t('atLeastOneUpper')} />
                  <RuleItem ok={okNum} label={t('atLeastOneNumber')} />
                  <RuleItem ok={okLen} label={t('min8Chars')} />
                </View>

                <View style={styles.buttonContainer}>
                  <Button loading={loading} disabled={!allOk}>
                    {t('setPassword')}
                  </Button>
                </View>
              </>
            );
          }}
        </Form>
      </View>
    </CustomScreen>
  );
};

export default ResetPassword;

const RuleItem = ({ok, label}) => (
  <View style={styles.ruleRow}>
    {ok ? <PassSuc></PassSuc> : <PassCancel></PassCancel>}
    <CustomText style={styles.ruleText}>{label}</CustomText>
  </View>
);

const styles = StyleSheet.create({
  buttonContainer: {
    justifyContent: 'flex-end',
    marginBottom: hp(3),
    alignItems: 'center',
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  textContent: {
    color: colors.neutral700,
    fontSize: wp(3.9),
    marginHorizontal: wp(4.5),
    marginTop: hp(1),
    marginBottom: hp(3),
    lineHeight: hp(2.5),
  },
  meterWrap: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: wp(4.5),
  },
  meterBar: {flex: 1, height: wp(1.4), borderRadius: 8},
  ruleBox: {
    marginHorizontal: wp(4.5),
    marginTop: hp(1),
    paddingVertical: hp(1),
  },
  ruleTitle: {
    color: colors.neutral900,
    marginBottom: hp(0.5),
    fontSize: wp(3.8),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: hp(0.3),
  },
  ruleText: {color: colors.neutral700, fontSize: wp(3.5), marginLeft: wp(1)},
});
