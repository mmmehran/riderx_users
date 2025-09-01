import React, {memo} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import CustomModal from '../components/common/CustomModal';
import colors from '../config/colors';
import CustomText from '../components/common/CustomText';

const REASONS = [
  {key: 'request_new_driver', label: 'Request new driver'},
  {key: 'shipment_destroyed', label: 'Shipment destroyed'},
  {key: 'address_not_found', label: 'Address not found'},
];

const CancelModal = ({isVisible, onSelectReason, onClose}) => {
  return (
    <CustomModal isVisible={isVisible} backdropOpacity={0}>
      <View style={styles.container}>
        <CustomText style={styles.title}>Reason for cancellation</CustomText>

        {REASONS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={styles.reasonButton}
            onPress={() => onSelectReason?.(item.key)}>
            <CustomText style={styles.reasonText}>{item.label}</CustomText>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CustomText style={styles.closeText}>Close</CustomText>
        </TouchableOpacity>
      </View>
    </CustomModal>
  );
};

export default memo(CancelModal);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: wp(70),
    backgroundColor: colors.white,
    borderRadius: wp(2),
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
  },
  title: {
    fontSize: wp(5),
    fontWeight: 'bold',
    marginBottom: hp(2),
    color: colors.black,
  },
  reasonButton: {
    width: '100%',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(1),
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: hp(1),
  },
  reasonText: {
    fontSize: wp(4),
    color: colors.black,
  },
  closeButton: {
    marginTop: hp(2),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: wp(1),
    backgroundColor: '#f2f2f2',
  },
  closeText: {
    fontSize: wp(4),
    color: colors.black,
    fontWeight: 'bold',
  },
});
