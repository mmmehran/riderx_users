import React, {memo, useState} from 'react';
import {StyleSheet, View, TouchableOpacity, TextInput} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';

import CustomModal from '../components/common/CustomModal';
import colors from '../config/colors';
import CustomText from '../components/common/CustomText';
import {CancelIcon2} from '../../assets/svg/index';

const CancelModal = ({isVisible, onSelectReason, onClose}) => {
  const {t} = useTranslation();
  const [selectedReason, setSelectedReason] = useState(null);
  const [text, setText] = useState('');

  const REASONS = [
    {key: 'request_new_driver', label: t('Requestnewdriver')},
    {key: 'shipment_destroyed', label: t('shipmentDestroyed')},
    {key: 'address_not_found', label: t('addressNotFound')},
  ];

  return (
    <CustomModal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={onClose}
      backdropOpacity={0.5}>
      <View style={styles.container}>
        <View style={styles.rowHeader}>
          <TouchableOpacity onPress={onClose}>
            <CancelIcon2 width={wp(6.5)} height={wp(6.5)}></CancelIcon2>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('cancelRide')}</CustomText>
        </View>
        <View style={styles.line}> </View>
        <CustomText style={styles.content}>{t('cancelContent1')}</CustomText>
        {REASONS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.reasonButton}
            onPress={() => setSelectedReason(item.key)}>
            <View
              style={[
                styles.checkContainer,
                selectedReason === item.key && {
                  backgroundColor: colors.neutral300,
                },
              ]}></View>
            <CustomText style={styles.reasonText}>{item.label}</CustomText>
          </TouchableOpacity>
        ))}
        <TextInput
          multiline={true}
          style={styles.input}
          placeholder={t('tellUs')}
          placeholderTextColor={colors.neutral200}
          onChangeText={setText}
          value={text}
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            disabled={selectedReason ? false : true}
            style={[
              styles.closeButton,
              !selectedReason && {backgroundColor: colors.neutral300},
            ]}
            onPress={() => onSelectReason(selectedReason, text)}>
            <CustomText style={styles.closeText}>{t('NextStep')}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(CancelModal);

const styles = StyleSheet.create({
  container: {
    width: wp(100),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    height: hp(75),
    // bottom: hp(-2.5),
  },
  input: {
    height: hp(12),
    width: wp(92),
    textAlign: 'left',
    borderColor: colors.neutral200,
    borderWidth: wp(0.3),
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    fontSize: wp(3.8),
    fontFamily: 'YaldeviJaffna-Medium',
    color: colors.neutral900,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: hp(2),
  },
  line: {
    backgroundColor: colors.neutral200,
    width: wp(92),
    height: wp(0.3),
    marginVertical: hp(2),
  },
  checkContainer: {
    width: wp(4.5),
    height: wp(4.5),
    borderRadius: wp(1),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(0.5),
    borderColor: colors.neutral300,
    marginRight: wp(3),
    marginLeft: wp(2),
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  modal: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: wp(4.5),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
    marginLeft: wp(1.5),
  },
  content: {
    fontSize: wp(4),
    color: colors.neutral600,
    marginLeft: wp(1.5),
    lineHeight: hp(2.8),
    marginBottom: hp(2),
  },
  reasonButton: {
    width: '100%',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    borderWidth: wp(0.3),
    borderColor: colors.neutral100,
    marginBottom: hp(2),
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: wp(4),
    color: colors.neutral800,
  },
  closeButton: {
    marginTop: hp(2),
    borderRadius: wp(2.3),
    backgroundColor: colors.black,
    width: wp(92),
    height: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: 'YaldeviJaffna-Bold',
  },
});
