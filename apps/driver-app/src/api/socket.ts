import { io, Socket } from 'socket.io-client';
import { WS_URL } from './client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    socket = io(WS_URL, {
      auth: { token: localStorage.getItem('drv_access_token') },
      transports: ['websocket'],
    });
  }
  return socket;
}
