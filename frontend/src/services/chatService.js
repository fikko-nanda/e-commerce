import api from './api';

// Chat Service - API untuk Live Chat (real-time dengan WebSocket)

export const chatService = {
  // Get all my chats (messages with other users)
  getChats: async () => {
    const response = await api.get('/chats/');
    return response.data;
  },

  // Send message ke user lain
  sendMessage: async (data) => {
    const response = await api.post('/chats/', data);
    return response.data;
  },

  // Get chat history dengan user tertentu
  getChatWithUser: async (userId) => {
    const response = await api.get(`/chats/?receiver=${userId}`);
    return response.data;
  },

  // Create new chat conversation
  createChat: async (data) => {
    const response = await api.post('/chats/create/', data);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (chatId) => {
    const response = await api.patch(`/chats/${chatId}/read/`);
    return response.data;
  },
};

// WebSocket connection untuk real-time chat
class ChatWebSocket {
  constructor(token) {
    this.token = token;
    this.socket = null;
    this.reconnectDelay = 3000;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = import.meta.env.VITE_WS_BASE_URL || `${protocol}//localhost:8000/ws`;
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'guest';
    const wsUrl = `${base}/chat/room_${userId}/`;

    this.socket = new WebSocket(wsUrl);
    this.socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      if (this.onOpen) this.onOpen();
    });

    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (this.onMessage) this.onMessage(data);
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectDelay);
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const chatWebSocket = new ChatWebSocket(localStorage.getItem('access_token'));
export default chatService;
