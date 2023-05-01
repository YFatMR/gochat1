import { FC, useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { Chat, ChatProps } from "../components/chat/Chat";
import { Message, MessageProps } from "../components/chat/Message";
import { ChatService } from "../services/ChatService";
import { ChatsResponse, MessagesResponse } from "../types/Chats"
import "../styles/css/Chats.css";
import { useInView } from 'react-intersection-observer';


const chatsFromResponse = (response: ChatsResponse, onClickHandler: any): ChatProps[] => {
    return response.dialogs ? response.dialogs.map(dialog => {
        const date = new Date(dialog.lastMessage.createdAt);
        const messagesCount = parseInt(dialog.messagesCount) || 0
        const messageID = parseInt(dialog.lastMessage.messageID.ID)
        return {
            key: dialog.dialogID.ID,
            id: parseInt(dialog.dialogID.ID),
            messageID: messageID,
            name: dialog.name,
            messageText: dialog.lastMessage.text,
            messageTimestamp: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
            unreadMessagesCount: parseInt(dialog.unreadMessagesCount) || 0,
            messagesCount: messagesCount,
            onClick: onClickHandler(dialog.dialogID.ID, messageID), //handleDialogClick(dialog.dialogID.ID, messagesCount),
            observerBottomRef: null,
            active: false,
        }
    }) : []
}

const messagesFromResponse = (response: MessagesResponse): MessageProps[] => {
    return response.messages ? response.messages.map(message => {
        const date = new Date(message.createdAt);
        return {
            key: message.messageID.ID,
            id: parseInt(message.messageID.ID),
            senderID: parseInt(message.senderID.ID),
            text: message.text,
            createdAt: `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
            selfMessage: message.selfMessage,
            observerTopRef: null,
        }
    }) : []
}


const ChatsPage: FC = () => {
    const { ref: bottomDialogRef, inView: bottomDialogInView } = useInView({
        threshold: 0,
    });
    const { ref: topMessageRef, inView: topMessageInView } = useInView({
        threshold: 0,
    });

    const navigate = useNavigate();
    const [chats, setChats] = useState<ChatProps[]>([]);
    const [messages, setMessages] = useState<MessageProps[]>([]);

    // const [activeDialog, setActiveDialog] = useState<string>("");



    const dialogMessagesPerRequest = 40;
    const chatsCountPerRequest = 30

    const handleDialogClick = async (chatID: number, topMessageID: number): Promise<() => Promise<void>> => {
        return async () => {
            const newMessagesResponse = await ChatService.getMessagesBefore(chatID, topMessageID, dialogMessagesPerRequest);
            console.log("newMessagesResponse", newMessagesResponse)
            if (newMessagesResponse.status != 200) {
                return
            }
            const newMessages = messagesFromResponse(newMessagesResponse.data)
            if (newMessages.length === 0) {
                return
            }
            newMessages[0].observerTopRef = topMessageRef
            setMessages(newMessages)
            // setActiveDialog(chatID)
        }
    }

    const fetchBottomChats = async () => {
        const response = await ChatService.getDialogs(chatsCountPerRequest, chats.length);
        console.log("fetchBottomChats response", response, "chat length", chats.length)
        if (response.status != 200) {
            navigate("")
            return
        }
        const newChats = chatsFromResponse(response.data, handleDialogClick)
        if (newChats.length === 0) {
            return
        }
        newChats[newChats.length - 1].observerBottomRef = bottomDialogRef
        if (chats.length === 0) {
            setChats(newChats)
            return
        }
        chats[chats.length - 1].observerBottomRef = null
        setChats([...chats, ...newChats]);
    }

    const fetchTopDialogMessages = async (chatID: number, topMessageID: number) => {
        const response = await ChatService.getMessagesBefore(chatID, topMessageID, dialogMessagesPerRequest);
        console.log("fetchTopDialogMessages response", response)
        if (response.status != 200) {
            navigate("")
            return
        }
        const newMessages = messagesFromResponse(response.data)
        if (newMessages.length === 0) {
            return
        }
        newMessages[0].observerTopRef = topMessageRef
        if (messages.length === 0) {
            setMessages(newMessages)
            return
        }
        messages[0].observerTopRef = null
        setMessages([...newMessages, ...messages]);
    }

    // init list of dialogs
    useEffect(() => {
        fetchBottomChats()
    }, []);

    // dialog list updating
    useEffect(() => {
        if (!bottomDialogInView) {
            return
        }
        fetchBottomChats()
    }, [bottomDialogInView])

    // messages list updating
    useEffect(() => {
        if (!topMessageInView) {
            return
        }
        const id = parseInt(topMessageRef.arguments?.id);
        console.log("messages list updating with id", id)
        fetchTopDialogMessages(id, messages[0].id)
    }, [topMessageInView])

    // active dialog updating
    // useEffect(() => {
    //     if (activeDialog == "") {
    //         return
    //     }
    //     fetchBottomChats()
    // }, [activeDialog])

    return (
        <div className="main-container">
            <div className="chats-container">
                {chats.map((chat) => (
                    <Chat
                        key={chat.key}
                        id={chat.id}
                        messageID={chat.messageID}
                        name={chat.name}
                        messageText={chat.messageText}
                        unreadMessagesCount={chat.unreadMessagesCount}
                        messageTimestamp={chat.messageTimestamp}
                        messagesCount={chat.messagesCount}
                        onClick={chat.onClick}
                        observerBottomRef={chat.observerBottomRef}
                        active={chat.active}
                    />
                ))}
            </div>
            <div className="messages-container">
                {messages.map((message) => (
                    <Message
                        key={message.key}
                        senderID={message.senderID}
                        text={message.text}
                        createdAt={message.createdAt}
                        selfMessage={message.selfMessage}
                        id={message.id}
                        observerTopRef={message.observerTopRef}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChatsPage;