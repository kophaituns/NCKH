# Chat Module

This module handles real-time chat functionality with AI integration.

## Features

- **Multi-AI Support**: Supports both Super Dev and Gemini APIs
- **Real-time Chat**: WebSocket-based real-time messaging
- **Conversation Management**: Create, manage, and archive chat conversations
- **Message History**: Persistent storage of chat messages
- **Error Handling**: Robust error handling with fallback mechanisms
- **Performance Monitoring**: Track response times and token usage

## API Endpoints

### Conversations
- `GET /api/modules/chat/conversations` - Get user's conversations
- `POST /api/modules/chat/conversations` - Create new conversation
- `GET /api/modules/chat/conversations/:id` - Get conversation details
- `PUT /api/modules/chat/conversations/:id` - Update conversation
- `DELETE /api/modules/chat/conversations/:id` - Delete conversation

### Messages
- `GET /api/modules/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/modules/chat/conversations/:id/messages` - Send message
- `PUT /api/modules/chat/messages/:id` - Update message
- `DELETE /api/modules/chat/messages/:id` - Delete message

### AI Chat
- `POST /api/modules/chat/ai/super-dev` - Send message to Super Dev API
- `POST /api/modules/chat/ai/gemini` - Send message to Gemini API
- `POST /api/modules/chat/ai/auto` - Auto-select best AI provider

