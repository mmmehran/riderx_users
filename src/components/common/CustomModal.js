import React, { memo } from "react";
import Modal from "react-native-modal";

const CustomModal = ({
	children,
	isVisible,
	onBackdropPress,
	backdropOpacity = 0.7,
	style
}) => {
	return (
		<Modal
			isVisible={isVisible}
			onBackdropPress={onBackdropPress}
			onBackButtonPress={onBackdropPress}
			backdropOpacity={backdropOpacity}
			style={style ? style : { alignItems: "center", justifyContent: "center" }}
		  	animationIn="fadeInUp"
			animationOut="fadeOutDown" 
  			animationInTiming={700}
			animationOutTiming={500}
		>
			{children}
		</Modal>
	);
};


export default memo(CustomModal);
