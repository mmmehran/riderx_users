/* eslint-disable prettier/prettier */
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    messages: {}, // structured as { chatId: [message1, message2, ...] }
};

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        addMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            // Avoid duplicate messages if socket echoes or multiple events
            const exists = state.messages[chatId].some((m) => m.id === message.id);
            if (!exists) {
                state.messages[chatId].push(message);
            }
        },
        setMessages: (state, action) => {
            const { chatId, messages } = action.payload;
            state.messages[chatId] = messages;
        },
        clearChat: (state, action) => {
            const { chatId } = action.payload;
            delete state.messages[chatId];
        },
    },
});

export const { addMessage, setMessages, clearChat } = chatSlice.actions;

export const selectChatMessages = (chatId) => (state) => state.chat.messages[chatId] || [];

export default chatSlice.reducer;
