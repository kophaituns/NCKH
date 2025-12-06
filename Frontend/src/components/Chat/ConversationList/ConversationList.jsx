import React, { useState } from 'react';
import styles from './ConversationList.module.scss';

const ConversationList = ({ 
    conversations, 
    currentConversation, 
    onSelectConversation, 
    onDeleteConversation, 
    onNewConversation 
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        if (messageDate.getTime() === today.getTime()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (messageDate.getTime() === today.getTime() - 86400000) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const handleDeleteClick = (e, conversationId) => {
        e.stopPropagation();
        setShowDeleteConfirm(conversationId);
    };

    const confirmDelete = (conversationId) => {
        onDeleteConversation(conversationId);
        setShowDeleteConfirm(null);
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    return (
        <div className={styles.conversationList}>
            <div className={styles.header}>
                <h4>Conversations</h4>
                <button 
                    className={styles.newChatBtn}
                    onClick={onNewConversation}
                    title="Start new conversation"
                >
                    + New Chat
                </button>
            </div>
            
            <div className={styles.conversations}>
                {conversations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No conversations yet</p>
                        <button onClick={onNewConversation}>
                            Start your first chat
                        </button>
                    </div>
                ) : (
                    conversations.map(conversation => (
                        <div
                            key={conversation.id}
                            className={`${styles.conversationItem} ${
                                currentConversation?.id === conversation.id ? styles.active : ''
                            }`}
                            onClick={() => onSelectConversation(conversation)}
                        >
                            <div className={styles.conversationContent}>
                                <div className={styles.title}>
                                    {conversation.title}
                                </div>
                                <div className={styles.lastMessage}>
                                    {conversation.messages?.[0]?.message && (
                                        <span className={styles.messagePreview}>
                                            {conversation.messages[0].sender_type === 'user' ? 'You: ' : 'AI: '}
                                            {conversation.messages[0].message.slice(0, 50)}
                                            {conversation.messages[0].message.length > 50 ? '...' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.conversationMeta}>
                                <span className={styles.timestamp}>
                                    {formatDate(conversation.last_message_at || conversation.created_at)}
                                </span>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                                    title="Delete conversation"
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 5.883 16h4.234a2 2 0 0 0 1.992-1.84L12.962 3.5H13.5a.5.5 0 0 0 0-1H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92H5.883a1 1 0 0 1-.997-.92L4.042 3.5h7.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53L10.5 13.5a.5.5 0 0 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z" fill="currentColor"/>
                                    </svg>
                                </button>
                            </div>

                            {/* Delete confirmation */}
                            {showDeleteConfirm === conversation.id && (
                                <div className={styles.deleteConfirm} onClick={(e) => e.stopPropagation()}>
                                    <p>Delete this conversation?</p>
                                    <div className={styles.confirmButtons}>
                                        <button 
                                            onClick={() => confirmDelete(conversation.id)}
                                            className={styles.confirmDelete}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            onClick={cancelDelete}
                                            className={styles.confirmCancel}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationList;
