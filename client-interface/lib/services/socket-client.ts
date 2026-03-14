import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(accessToken: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

  socket = io(baseUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: {
      token: accessToken,
    },
    withCredentials: true,
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
