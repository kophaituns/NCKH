import React, { useState } from 'react';
import Chatbox from '../../components/Chat/Chatbox';
import styles from './Chat.module.scss';

const Chat = () => {
    return (
        <div className={styles.chatPage}>
            <div className={styles.header}>
                <h1>AI Chat Assistant</h1>
                <p>Chat with our AI assistants powered by Super Dev and Gemini APIs</p>
            </div>
            
            <div className={styles.content}>
                <Chatbox isOpen={true} onClose={() => {}} />
            </div>
        </div>
    );
};

export default Chat;