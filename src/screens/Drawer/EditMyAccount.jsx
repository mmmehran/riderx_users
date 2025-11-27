import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import * as Yup from 'yup';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import {
  EditIcon,
  CallUserIcon,
  MessageUserIcon,
  UserNameIcon,
} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import {getData, sendData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {
  setUserProfile,
  authenticated,
} from '../../redux/reducers/authenticationReducer';
import routes from '../../navigation/routes';
import {Form, Input, Button} from '../../components/form/index';
import CustomButton from '../../components/common/CustomButton';
import TakePictureModal from '../../modal/TakePictureModal';
import {showToast} from '../../utils/helpers';
import {uploadFile} from '../../services/file.services';

const EditMyAccount = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const user = useSelector(authenticated);
  const dispatch = useDispatch();
  const formikRef = useRef(null);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required(),
    lastName: Yup.string().required(),
    phone: Yup.string().required(),
    email: Yup.string().email().required(),
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toggleSheet, setToggleSheet] = useState(false);
  const [images, setImages] = useState(null);

  const [initialValues, setInitialValues] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  const onSubmit = async values => {
    try {
      setLoading(true);

      const rawPhone = (values?.phone || '').trim();

      let country_code = user?.userProfile?.phone?.country_code || '+98';
      let number = user?.userProfile?.phone?.number || '';

      if (rawPhone) {
        const match = rawPhone.match(/^(\+\d+)\s*(.*)$/);
        if (match) {
          country_code = match[1];
          number = match[2]?.replace(/\s+/g, '') || '';
        } else {
          number = rawPhone.replace(/\s+/g, '');
        }
      }

      const payload = {
        email: values?.email,
        first_name: values?.firstName,
        last_name: values?.lastName,
        address: user?.userProfile?.address || null,
        postal_code: user?.userProfile?.postal_code || null,
        latitude: user?.userProfile?.latitude || null,
        longitude: user?.userProfile?.longitude || null,
        city_id: user?.userProfile?.city_id || null,
        gender: user?.userProfile?.gender || null,
        language: user?.userProfile?.language || null,
        phone: {
          country_code,
          number,
        },
      };

      const response = await sendData(urls.GETUSER, payload);
      if (response?.data?.status) {
        getUserData();
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  const getUserData = async () => {
    setLoadingData(true);
    try {
      const response = await getData(urls.GETUSER);
      if (response?.data?.status) {
        const data = response.data.data;
        dispatch(setUserProfile(data));

        const phone =
          data?.phone?.country_code && data?.phone?.number
            ? `${data.phone.country_code} ${data.phone.number}`
            : '';

        setInitialValues({
          firstName: data?.first_name || '',
          lastName: data?.last_name || '',
          phone: phone,
          email: data?.email || '',
        });
      } else {
        errorHandler(response);
      }
    } catch (error) {
      errorHandler(error);
    } finally {
      setLoadingData(false);
    }
  };

  const uploadFileAPi = async data => {
    setLoading(true);
    const profileResponse = await uploadFile(urls.GETUSER, data);
    if (profileResponse?.data) {
      showToast(t('imageChanged'));
      setImages(null);
      await getUserData();
    } else {
      errorHandler(profileResponse);
    }
    setLoading(false);
  };

  return (
    <CustomScreen>
      <CustomHeaderApp
        backPress={() => navigation.navigate(routes.MYACCOUNT)}
        title={t('editMyAccount')}
      />
      {loadingData ? (
        <ActivityIndicator
          size="large"
          color={colors.neutral900}
          style={{marginTop: hp(5)}}
        />
      ) : (
        <>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: images?.assets[0]?.uri
                  ? images?.assets[0]?.uri
                  : user?.userProfile?.profile_image,
              }}
              style={{width: wp(30), height: wp(30), borderRadius: wp(50)}}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              setToggleSheet(true);
            }}
            style={styles.editContainer}>
            <EditIcon width={wp(6)} height={wp(6)} />
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <Form
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
              innerRef={formikRef}
              enableReinitialize>
              {({values}) => (
                <>
                  <Input
                    name="firstName"
                    inputName={t('enterYourFirstName')}
                    input={{textAlign: 'left'}}
                    autoCapitalize="none"
                    value={values?.firstName}
                    icon={<UserNameIcon width={wp(4.5)} height={wp(4.5)} />}
                  />

                  <Input
                    name="lastName"
                    inputName={t('enterYourLastName')}
                    input={{textAlign: 'left'}}
                    autoCapitalize="none"
                    value={values?.lastName}
                    icon={<UserNameIcon width={wp(4.5)} height={wp(4.5)} />}
                  />

                  <Input
                    name="phone"
                    inputName={t('enterYourPhone')}
                    input={{textAlign: 'left'}}
                    autoCapitalize="none"
                    value={values?.phone}
                    icon={<CallUserIcon width={wp(4.5)} height={wp(4.5)} />}
                  />

                  <Input
                    name="email"
                    inputName={t('enterYourEmail')}
                    input={{textAlign: 'left'}}
                    autoCapitalize="none"
                    value={values?.email}
                    icon={<MessageUserIcon width={wp(4.5)} height={wp(4.5)} />}
                  />

                  <View style={styles.buttonContainer}>
                    <Button
                      loading={loading}
                      style={{width: wp(42), marginHorizontal: 0}}>
                      {t('saveChanges')}
                    </Button>

                    <CustomButton
                      onPress={() => navigation.navigate(routes.MYACCOUNT)}
                      style={styles.buttonCancel}
                      textStyle={{color: colors.neutral900}}>
                      {t('cancel')}
                    </CustomButton>
                  </View>
                </>
              )}
            </Form>
          </View>
        </>
      )}

      <TakePictureModal
        isVisible={toggleSheet}
        onBackdropPress={() => setToggleSheet(false)}
        onSelect={cameraObject => {
          //  setToggleSheet(false);
          setImages(cameraObject);
          uploadFileAPi(cameraObject);
        }}
      />
    </CustomScreen>
  );
};

export default EditMyAccount;

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(3),
  },
  editContainer: {
    width: wp(10.5),
    height: wp(10.5),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neonYellow,
    position: 'absolute',
    overflow: 'hidden',
    top: hp(18),
    right: wp(33),
  },
  formContainer: {
    marginTop: hp(3),
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginBottom: hp(3),
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginHorizontal: wp(5),
  },
  buttonCancel: {
    width: wp(42),
    marginHorizontal: 0,
    borderColor: colors.neutral900,
    borderWidth: wp(0.3),
    backgroundColor: 'transparent',
  },
});
