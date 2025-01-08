import { Socket as ClientSocket } from 'socket.io-client';
import io from 'socket.io-client';

let socket: ClientSocket | null = null;

export const initializeSocket = (userId: string, userType: 'buyer' | 'lender'): ClientSocket | null => {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socket = io(socketUrl, {
      query: { userId, userType }
    });
  }

  return socket;
};

export const getSocket = (): ClientSocket | null => {
  if (typeof window === 'undefined') return null;
  return socket;
};

// Mock data and functions for when the server is not available
const mockChatRooms = new Map();

export const mockJoinChat = (requestId: string, userId: string, callback: (history: any[]) => void) => {
  console.log(`Mock: User ${userId} joined chat for request ${requestId}`);
  const chatHistory = mockChatRooms.get(requestId) || [];
  callback(chatHistory);
};

export const mockSendMessage = (messageData: any, callback: (message: any) => void) => {
  const { requestId, senderId, content } = messageData;
  console.log(`Mock: New message in request ${requestId} from ${senderId}`);
  
  const message = { 
    id: Date.now().toString(), 
    senderId, 
    content, 
    timestamp: new Date() 
  };

  if (!mockChatRooms.has(requestId)) {
    mockChatRooms.set(requestId, []);
  }
  mockChatRooms.get(requestId).push(message);

  callback(message);
};
