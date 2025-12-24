import React, { memo } from "react";
import Modal from "react-native-modal";

const CustomModal = ({
	children,
	isVisible,
	onBackdropPress,
	backdropOpacity = 0.7,
	style,
	...props
}) => {
	return (
		<Modal
			isVisible={isVisible}
			onBackdropPress={onBackdropPress}
			onBackButtonPress={onBackdropPress}
			backdropOpacity={backdropOpacity}
			style={style ? style : { alignItems: "center", justifyContent: "center" }}
  			animationInTiming={300}
			animationOutTiming={300}
			{...props}
		>
			{children}
		</Modal>
	);
};


export default memo(CustomModal);
