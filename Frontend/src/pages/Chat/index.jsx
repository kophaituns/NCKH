import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import chatService from '../../api/services/chat.service';
import styles from './Chat.module.scss';
import Message from '../../components/Chat/Message/Message';
import ConversationList from '../../components/Chat/ConversationList/ConversationList';
import ChatInput from '../../components/Chat/ChatInput/ChatInput';
import Loader from '../../components/common/Loader/Loader';

const Chat = () => {
    const { state } = useAuth();
    const { showSuccess, showError } = useToast();
    const { t } = useLanguage();
    const messagesEndRef = useRef(null);
    
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [apiProvider, setApiProvider] = useState('auto');

    useEffect(() => {
        if (state.isAuthenticated && state.user) {
            loadConversations();
        }
    }, [state.isAuthenticated, state.user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            setIsLoading(true);
            console.log('Loading conversations...');
            const response = await chatService.getConversations();
            const conversations = response.data || response.conversations || [];
            console.log('Conversations loaded:', conversations);
            setConversations(conversations);
            
            // Auto-select the first conversation instead of creating new one
            if (conversations.length > 0) {
                console.log('Auto-selecting first conversation:', conversations[0]);
                setCurrentConversation(conversations[0]);
                await loadMessages(conversations[0].id);
            }
            // Only create new conversation if user explicitly clicks "New Chat"
        } catch (error) {
            console.error('Failed to load conversations:', error);
            showError('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    };

    const createNewConversation = async (title = 'New Chat') => {
        try {
            // Ensure title is a string
            const conversationTitle = typeof title === 'string' ? title : 'New Chat';
            
            console.log('Creating conversation with title:', conversationTitle);
            console.log('Current user:', state.user);
            console.log('Auth token exists:', !!localStorage.getItem('authToken'));
            
            const response = await chatService.createConversation(conversationTitle);
            const newConversation = response.data || response;
            
            console.log('Conversation created successfully:', newConversation);
            setConversations(prev => [newConversation, ...prev]);
            setCurrentConversation(newConversation);
            setMessages([]);
            
            return newConversation;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            console.error('Error details:', error.response?.data);
            showError(error.message || 'Failed to create conversation');
            throw error;
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const response = await chatService.getMessages(conversationId);
            setMessages(response.data || response || []);
        } catch (error) {
            console.error('Failed to load messages:', error);
            showError('Failed to load messages');
        }
    };

    const selectConversation = async (conversation) => {
        setCurrentConversation(conversation);
        await loadMessages(conversation.id);
    };

    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        try {
            setIsSending(true);
            
            let conversation = currentConversation;
            
            // Create new conversation if none exists
            if (!conversation) {
                conversation = await createNewConversation();
            }

            // Add user message immediately to UI
            const userMessage = {
                id: 'temp-' + Date.now(),
                conversation_id: conversation.id,
                sender_type: 'user',
                message: messageText,
                created_at: new Date().toISOString(),
                status: 'sending'
            };
            
            setMessages(prev => [...prev, userMessage]);

            // Send message to backend
            const response = await chatService.sendMessage(conversation.id, messageText, apiProvider);
            
            // Update messages with the actual saved messages
            if (response.data) {
                const { userMessage, aiMessage } = response.data;
                setMessages(prev => {
                    // Remove temporary message and add actual messages
                    const withoutTemp = prev.filter(msg => msg.id !== userMessage.id);
                    const newMessages = [];
                    if (userMessage) newMessages.push(userMessage);
                    if (aiMessage) newMessages.push(aiMessage);
                    return [...withoutTemp, ...newMessages];
                });
            }

            // Update conversation in list if title should change
            if (conversation.title === 'New Chat' && messageText.length > 0) {
                const newTitle = messageText.slice(0, 30) + (messageText.length > 30 ? '...' : '');
                try {
                    await chatService.updateConversation(conversation.id, { title: newTitle });
                    setConversations(prev => 
                        prev.map(conv => 
                            conv.id === conversation.id 
                                ? { ...conv, title: newTitle }
                                : conv
                        )
                    );
                    setCurrentConversation(prev => ({ ...prev, title: newTitle }));
                } catch (titleError) {
                    console.warn('Failed to update conversation title:', titleError);
                }
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            showError('Failed to send message');
            
            // Remove the temporary message if sending failed
            setMessages(prev => prev.filter(msg => msg.status !== 'sending'));
        } finally {
            setIsSending(false);
        }
    };

    const deleteConversation = async (conversationId) => {
        try {
            console.log('Deleting conversation:', conversationId);
            await chatService.deleteConversation(conversationId);
            
            // Update conversations list first
            const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
            setConversations(updatedConversations);
            
            // If the deleted conversation was currently selected
            if (currentConversation?.id === conversationId) {
                if (updatedConversations.length > 0) {
                    // Select the first remaining conversation
                    const nextConversation = updatedConversations[0];
                    setCurrentConversation(nextConversation);
                    await loadMessages(nextConversation.id);
                } else {
                    // No conversations left
                    setCurrentConversation(null);
                    setMessages([]);
                }
            }
            
            showSuccess(t('conversation_deleted') || 'Conversation deleted successfully');
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            showError(t('failed_to_delete_conversation') || 'Failed to delete conversation');
        }
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    // Show login prompt if not authenticated
    if (!state.isAuthenticated) {
        return (
            <div className={styles.chatPage}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('chat_assistant') || 'Chat Assistant'}</h1>
                </div>
                <div className={styles.notAuthenticated}>
                    <h2>{t('login_required') || 'Login Required'}</h2>
                    <p>{t('please_login_to_continue') || 'Please login to continue'}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={styles.chatPage}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('chat_assistant') || 'Chat Assistant'}</h1>
                </div>
                <Loader fullScreen message="Loading chat..." />
            </div>
        );
    }

    return (
        <div className={styles.chatPage}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.sidebarToggle}
                        onClick={toggleSidebar}
                        title="Toggle conversations"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 12h14M3 6h14M3 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                    <h1 className={styles.title}>
                        {t('chat') || 'Chat Assistant'}
                    </h1>
                </div>
                <div className={styles.headerRight}>
                    <select 
                        value={apiProvider} 
                        onChange={(e) => setApiProvider(e.target.value)}
                        className={styles.providerSelect}
                        title="Select AI provider"
                    >
                        <option value="auto">Auto</option>
                        <option value="serper">Serper</option>
                        <option value="gemini">Gemini</option>
                    </select>
                    <button 
                        className={styles.newChatBtn}
                        onClick={() => createNewConversation('New Chat')}
                        title="New conversation"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        New Chat
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                {/* Sidebar - Conversation List */}
                {showSidebar && (
                    <div className={styles.sidebar}>
                        <ConversationList
                            conversations={conversations}
                            currentConversation={currentConversation}
                            onSelectConversation={selectConversation}
                            onDeleteConversation={deleteConversation}
                            onNewConversation={createNewConversation}
                        />
                    </div>
                )}

                {/* Chat Area */}
                <div className={`${styles.chatArea} ${!showSidebar ? styles.chatAreaFull : ''}`}>
                    {currentConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className={styles.chatHeader}>
                                <h2>{currentConversation.title}</h2>
                                <span className={styles.chatInfo}>
                                    AI Provider: {apiProvider}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className={styles.messagesContainer}>
                                {messages.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIcon}>
                                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                                <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24c4.2 0 8.1-1.1 11.5-3L56 56l-3-12.5c1.9-3.4 3-7.3 3-11.5C56 18.7 45.3 8 32 8z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M24 28h16M24 36h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <h3>Start a conversation</h3>
                                        <p>Ask me anything! I can help with coding, general questions, and more.</p>
                                        <div className={styles.suggestions}>
                                            <button onClick={() => sendMessage("What can you help me with?")}>
                                                What can you help me with?
                                            </button>
                                            <button onClick={() => sendMessage("Help me write some code")}>
                                                Help me write some code
                                            </button>
                                            <button onClick={() => sendMessage("Explain a technical concept")}>
                                                Explain a technical concept
                                            </button>
                                            <button onClick={() => sendMessage("Create a survey question")}>
                                                Create a survey question
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.messages}>
                                        {messages.map((message) => (
                                            <Message
                                                key={message.id}
                                                message={message}
                                                user={state.user}
                                            />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className={styles.inputArea}>
                                <ChatInput
                                    onSendMessage={sendMessage}
                                    isSending={isSending}
                                    disabled={false}
                                    placeholder="Type your message..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className={styles.noConversation}>
                            <div className={styles.emptyIcon}>
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                    <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24c4.2 0 8.1-1.1 11.5-3L56 56l-3-12.5c1.9-3.4 3-7.3 3-11.5C56 18.7 45.3 8 32 8z" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                            </div>
                            <h3>No conversation selected</h3>
                            <p>Select a conversation from the sidebar or create a new one to start chatting.</p>
                            <button 
                                className={styles.primaryButton}
                                onClick={() => createNewConversation()}
                            >
                                Start New Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
