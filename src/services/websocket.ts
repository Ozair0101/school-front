/**
 * WebSocket Service for Real-time Monitoring
 * Handles connection to Laravel WebSocket server for live exam monitoring
 */

import { io, Socket } from 'socket.io-client';

export type WebSocketEventType = 
  | 'attempt_started'
  | 'attempt_updated'
  | 'attempt_submitted'
  | 'proctor_event'
  | 'connection_status';

export interface WebSocketEvent {
  event: WebSocketEventType;
  data: any;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(url: string = 'http://localhost:8000') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.url, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connection_status', { connected: true });
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.emit('connection_status', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      // Listen for exam monitoring events
      this.socket.on('exam.monitor', (event: WebSocketEvent) => {
        this.emit(event.event, event.data);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Subscribe to exam monitoring channel
   */
  subscribeToExam(examId: string): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected. Cannot subscribe to exam.');
      return;
    }

    this.socket.emit('subscribe', { channel: `exam.${examId}.monitor` });
  }

  /**
   * Unsubscribe from exam monitoring channel
   */
  unsubscribeFromExam(examId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe', { channel: `exam.${examId}.monitor` });
  }

  /**
   * Listen to a specific event
   */
  on(event: WebSocketEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: WebSocketEventType, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Send a custom event to server
   */
  send(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send event: WebSocket not connected');
      return;
    }

    this.socket.emit(event, data);
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
export const websocketService = new WebSocketService(wsUrl);

export default websocketService;

