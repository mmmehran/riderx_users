import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import CustomHeaderChat from '../../components/custom/CustomHeaderChat';
import { Message1, VoiceIcon, ArrowSend } from '../../../assets/svg';


// Dummy data for initial visualization
const INITIAL_MESSAGES = [
  { id: '1', text: 'Hello! How are you?', sender: 'other', time: '10:00 AM' },
  { id: '2', text: 'I am good, thanks! How about you?', sender: 'me', time: '10:01 AM' },
  { id: '3', text: 'I am doing great. Are you ready for the ride?', sender: 'other', time: '10:02 AM' },
  { id: '4', text: 'Yes, I will be there in 5 minutes.', sender: 'me', time: '10:03 AM' },
];

const ChatScreen = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const sendMessage = () => {
    if (inputText.trim().length === 0) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Scroll to bottom after state update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.otherMessageBubble
        ]}>
          <CustomText style={[
            styles.messageText
          ]}>
            {item.text}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <CustomScreen>
      <CustomHeaderChat />
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.input}>
              <TextInput
                style={styles.input1}
                value={inputText}
                onChangeText={setInputText}
                placeholder={"Type a message"}
                placeholderTextColor={colors.neutral400}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              >
              </TextInput>
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton1}>
                <ArrowSend width={wp(5)} height={wp(5)} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.sendButton}>
              <VoiceIcon width={wp(11.5)} height={wp(11.5)} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </CustomScreen>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    paddingTop: hp(1),
  },
  messageContainer: {
    marginVertical: hp(0.6),
    flexDirection: 'row',
    width: '100%',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: wp(75),
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(4),
    borderRadius: wp(7),
  },
  myMessageBubble: {
    backgroundColor: "#B4E0D7", // Fallback if neonTeal300 is undefined or use a different color
    borderBottomRightRadius: wp(0.5),
  },
  otherMessageBubble: {
    backgroundColor: colors.neutral100,
    borderBottomLeftRadius: wp(0.5),
  },
  messageText: {
    fontSize: wp(4),
    lineHeight: wp(5),
    color: colors.neutral800
  },
  myMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.neutral900,
  },
  timeText: {
    fontSize: wp(3),
    marginTop: hp(0.5),
    textAlign: 'right',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(3),
    backgroundColor: colors.white,
    paddingBottom: hp(2),
  },
  input: {
    flex: 1,
    height: hp(5.5),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingHorizontal: wp(4),
    fontSize: wp(4),
    color: colors.neutral900,
    marginRight: wp(3),
    borderWidth: 1,
    borderColor: colors.neutral200,
    flexDirection: "row"
  },
  input1: {
    height: hp(5.5),
    fontSize: wp(4),
    color: colors.neutral900,
    width: wp(62)
  },
  sendButton: {
    width: hp(5.5),
    height: hp(5.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(3),
  },
  sendButton1: {
    width: hp(5.5),
    height: hp(5.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
