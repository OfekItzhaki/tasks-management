import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../config/api';
import { TokenStorage } from './storage';

let socket: Socket | null = null;

export const getSocket = async (): Promise<Socket> => {
    if (socket) return socket;

    const url = getApiUrl('').replace('/api', ''); // Socket usually at root
    const token = await TokenStorage.getToken();

    socket = io(url, {
        auth: {
            token: `Bearer ${token}`,
        },
        transports: ['websocket'],
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
