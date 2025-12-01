import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  Alert,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import ImagePicker from 'react-native-image-crop-picker';

import colors from '../config/colors';
import CustomModal from '../components/common/CustomModal';
import CustomText from '../components/common/CustomText';
import { CameraIcon2, AboutusIcon } from '../../assets/svg/index';

const TakePictureModal = ({
  isVisible,
  onBackdropPress,
  onSelect,
  cameraType = 'photo',
  cropWidth = 500,
  cropHeight = 500,
  cropperCircle = false,
  compressQuality = 0.7,
}) => {
  const { t } = useTranslation();

  const requestAndroidCameraPermission = async () => {
    try {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const requestAndroidLibraryPermission = async () => {
    try {
      const isTiramisuOrAbove =
        Platform.OS === 'android' && Platform.Version >= 33;
      if (isTiramisuOrAbove) {
        // Android 13+: scoped media
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );
        return res === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Older Android
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
        return res === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  };

  const ensureCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const ok = await requestAndroidCameraPermission();
      if (!ok) {
        Alert.alert(
          'Permission required',
          'Please enable Camera permission in Settings.',
        );
      }
      return ok;
    }

    // iOS
    try {
      const result = await check(PERMISSIONS.IOS.CAMERA);
      if (result === RESULTS.GRANTED) return true;
      if (result === RESULTS.DENIED) {
        const req = await request(PERMISSIONS.IOS.CAMERA);
        return req === RESULTS.GRANTED;
      }
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Please enable Camera access in your phone Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return false;
      }
      return false;
    } catch (e) {
      console.log('iOS Camera perm error:', e);
      return false;
    }
  };

  const ensureLibraryPermission = async () => {
    if (Platform.OS === 'android') {
      const ok = await requestAndroidLibraryPermission();
      if (!ok) {
        Alert.alert(
          'Permission required',
          'Please enable Photos/Files permission in Settings.',
        );
      }
      return ok;
    }

    // iOS
    try {
      const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) return true;
      if (result === RESULTS.DENIED) {
        const req = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return req === RESULTS.GRANTED || req === RESULTS.LIMITED;
      }
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          'Please enable Photo Library access in your phone Settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return false;
      }
      return false;
    } catch (e) {
      console.log('iOS Library perm error:', e);
      return false;
    }
  };

  const normalizeResult = img => {
    const asset = {
      uri: img?.path,
      width: img?.width,
      height: img?.height,
      type: img?.mime,
      fileName:
        img?.filename || (img?.path ? img.path.split('/').pop() : 'image.jpg'),
      fileSize: img?.size,
      base64: img?.data,
    };
    return { assets: [asset] };
  };

  const pickFromLibrary = async () => {
    try {
      const ok = await ensureLibraryPermission();
      if (!ok) {
        return;
      }

      const image = await ImagePicker.openPicker({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: cropperCircle,
        width: cropWidth,
        height: cropHeight,
        compressImageQuality: compressQuality,
        includeBase64: true,
      });
      onSelect(normalizeResult(image));
      onBackdropPress();
    } catch (e) {
      console.log('Library error:', e);
      Alert.alert('Error', e.message || 'Failed to open library');
    }
  };

  const openCamera = async () => {
    try {
      const ok = await ensureCameraPermission();
      if (!ok) {
        return;
      }

      const image = await ImagePicker.openCamera({
        mediaType: 'photo',
        cropping: true,
        cropperCircleOverlay: cropperCircle,
        width: cropWidth,
        height: cropHeight,
        compressImageQuality: compressQuality,
        includeBase64: true,
      });

      onSelect(normalizeResult(image));
      onBackdropPress();
    } catch (e) {
      console.log('Camera error:', e);
      Alert.alert('Error', e.message || 'Failed to open camera');
    }
  };

  const list = [
    {
      icon: <CameraIcon2 width={wp(6)} height={wp(6)} />,
      title: t('Take_photo'),
      onPress: openCamera,
    },
    {
      icon: <AboutusIcon width={wp(5)} height={wp(5)} />,
      title: t('Choose_from_library'),
      onPress: pickFromLibrary,
    },
  ];

  return (
    <CustomModal
      isVisible={isVisible}
      onBackdropPress={onBackdropPress}
      backdropOpacity={0.8}
      style={styles.modal}
      animationOutTiming={1000}
      animationInTiming={1000}>
      <View style={styles.container}>
        <TouchableOpacity onPress={onBackdropPress} style={styles.line} />
        <CustomText style={styles.text}>{t('profilePhotoTitle')}</CustomText>
        <View style={styles.row}>
          {list.map((item, index) => (
            <View style={styles.boxContainer} key={index}>
              <TouchableOpacity onPress={item.onPress} style={styles.box}>
                {item.icon}
              </TouchableOpacity>
              <CustomText style={styles.textBox}>{item.title}</CustomText>
            </View>
          ))}
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(TakePictureModal);

const styles = StyleSheet.create({
  container: {
    height: hp(25),
    width: wp(100),
    backgroundColor: '#fff',
    bottom: hp(-4),
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
  },
  modal: { justifyContent: 'flex-end', alignItems: 'center' },
  line: {
    width: wp(9),
    height: hp(0.4),
    backgroundColor: colors.dark500,
    marginHorizontal: wp(45.5),
    marginTop: hp(1.5),
    borderRadius: wp(10),
  },
  text: {
    marginLeft: wp(6),
    marginTop: hp(2),
    fontSize: wp(5.3),
    fontWeight: 'bold',
  },
  box: {
    width: wp(14),
    height: wp(14),
    borderColor: colors.orange1,
    borderWidth: wp(0.3),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', marginLeft: wp(6), marginTop: hp(2.5) },
  boxContainer: { alignItems: 'center', marginRight: wp(10) },
  textBox: { marginTop: hp(0.8), fontSize: wp(3.5) },
});
