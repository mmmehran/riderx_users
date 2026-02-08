import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/core';

import CustomScreen from '../../components/common/CustomScreen';
import CustomText from '../../components/common/CustomText';
import colors from '../../config/colors';
import CustomHeaderChat from '../../components/custom/CustomHeaderChat';
import { VoiceIcon, ArrowSend, PaperClip, VoiceRecord } from '../../../assets/svg';
import { postData, getData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { selectConfig } from '../../redux/reducers/configReducer';
import { authenticated } from '../../redux/reducers/authenticationReducer';
import { postFormData } from '../../services/file.services';
import { addMessage, setMessages, selectChatMessages } from '../../redux/reducers/chatReducer';
import routes from '../../navigation/routes';

const ChatScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const { senderId, back } = route.params || {};
  const navigation = useNavigation();

  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);
  const dispatch = useDispatch();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [partner, setPartner] = useState(null);
  const [chatId, setChatId] = useState(null);

  const messages = useSelector(selectChatMessages(chatId));

  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (senderId) {
        startChat();
      }
    }, [senderId]),
  );



  const startChat = async () => {
    setLoading(true);
    const response = await postData(urls.STARTPRIVATECHAT, { user_id: senderId });
    if (response?.data?.status) {
      const chatDetail = response.data.data;
      setChatId(chatDetail.id);
      const participants = chatDetail.participants;
      const otherUser = participants.find(p => String(p.user.id) === String(senderId));
      if (otherUser) {
        setPartner(otherUser.user);
      } else {
        setPartner(participants[0].user);
      }
      await fetchMessages(chatDetail.id);
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  const fetchMessages = async (currentChatId) => {
    const response = await getData(`${urls.GETCHATMSGS}${currentChatId}/messages/?vehicle_id=${config?.selectVehicle?.id}`);
    if (response?.data?.status) {
      dispatch(setMessages({
        chatId: currentChatId,
        messages: [...response.data.data.items].reverse()
      }));
    } else {
      errorHandler(response);
    }
  };

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || !chatId) return;
    try {
      const formData = new FormData();
      formData.append('content', inputText);
      const url = `${urls.GETCHATMSGS}${chatId}/send_message?vehicle_id=${config?.selectVehicle?.id}`;
      const response = await postFormData(url, formData);
      if (response && response.data && response.data.status) {
        const newMessage = response.data.data;
        dispatch(addMessage({ chatId, message: newMessage }));
        setInputText('');
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        console.log('Send Message Error Response:', response);
        errorHandler(response || { message: 'Network Error' });
      }
    } catch (error) {
      console.log('Send Message Catch Error:', error);
      errorHandler(error);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = String(item.sender.id) === String(user.user_id);
    const time = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMe ? styles.myMessageBubble : styles.otherMessageBubble,
          { alignItems: isMe ? 'flex-end' : 'flex-start' }
        ]}>
          <CustomText style={styles.messageText}>
            {item.content}
          </CustomText>
          <CustomText style={[
            styles.timeText,
            isMe ? styles.myTimeText : styles.otherTimeText
          ]}>
            {time}
          </CustomText>
        </View>
      </View>
    );
  };

  return (
    <CustomScreen>
      <CustomHeaderChat
        name={partner ? `${partner.first_name} ${partner.last_name}` : ''}
        image={partner?.profile_image}
        status={partner ? 'Online' : 'Offline'}
        backPress={() => navigation.goBack()}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.neonTeal300} />
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? hp(8) : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

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
                />
                <TouchableOpacity
                  // onPress={sendMessage}
                  style={styles.sendButton1}>
                  <PaperClip width={wp(4.6)} height={wp(4.6)} />
                </TouchableOpacity>
                <TouchableOpacity
                  // onPress={sendMessage}
                  style={[styles.sendButton1, { marginLeft: wp(1) }]}>
                  <VoiceRecord width={wp(7.5)} height={wp(7.5)} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={sendMessage}
                style={styles.sendButton}>
                <ArrowSend width={wp(5)} height={wp(5)} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
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
    backgroundColor: "#D1FFF4",
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
  },
  myTimeText: {
    color: colors.neutral600,
  },
  otherTimeText: {
    color: colors.neutral500,
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
    height: hp(5.1),
    backgroundColor: colors.white,
    borderRadius: wp(3),
    paddingHorizontal: wp(2),
    fontSize: wp(4),
    color: colors.neutral900,
    marginRight: wp(2),
    borderWidth: 1,
    borderColor: colors.neutral200,
    flexDirection: "row"
  },
  input1: {
    height: hp(5.1),
    fontSize: wp(4),
    color: colors.neutral900,
    width: wp(61)
  },
  sendButton: {
    width: hp(5.1),
    height: hp(5.1),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(20),
    backgroundColor: colors.black,
  },
  sendButton1: {
    width: hp(3.2),
    height: hp(5.1),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
