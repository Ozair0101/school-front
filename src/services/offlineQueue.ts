/**
 * Offline Queue Manager
 * Manages queued API requests when offline and syncs when back online
 */

import localforage from 'localforage';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'offline_request_queue';
const MAX_RETRIES = 3;

/**
 * Add a request to the offline queue
 */
export async function queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
  const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const queuedRequest: QueuedRequest = {
    ...request,
    id,
    timestamp: Date.now(),
    retries: 0,
  };

  const queue = await getQueue();
  queue.push(queuedRequest);
  await localforage.setItem(QUEUE_KEY, queue);

  return id;
}

/**
 * Get all queued requests
 */
export async function getQueue(): Promise<QueuedRequest[]> {
  return (await localforage.getItem<QueuedRequest[]>(QUEUE_KEY)) || [];
}

/**
 * Remove a request from the queue
 */
export async function removeRequest(requestId: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter(req => req.id !== requestId);
  await localforage.setItem(QUEUE_KEY, filtered);
}

/**
 * Clear all requests from queue
 */
export async function clearQueue(): Promise<void> {
  await localforage.removeItem(QUEUE_KEY);
}

/**
 * Mark a request as retried
 */
export async function incrementRetry(requestId: string): Promise<boolean> {
  const queue = await getQueue();
  const request = queue.find(req => req.id === requestId);
  
  if (!request) return false;
  
  request.retries += 1;
  
  // Remove if max retries exceeded
  if (request.retries >= MAX_RETRIES) {
    await removeRequest(requestId);
    return false;
  }
  
  await localforage.setItem(QUEUE_KEY, queue);
  return true;
}

/**
 * Process queue when back online
 */
export async function processQueue(
  executeRequest: (request: QueuedRequest) => Promise<any>
): Promise<{ successful: number; failed: number }> {
  const queue = await getQueue();
  let successful = 0;
  let failed = 0;

  for (const request of queue) {
    try {
      await executeRequest(request);
      await removeRequest(request.id);
      successful++;
    } catch (error) {
      console.error(`Failed to process queued request ${request.id}:`, error);
      const canRetry = await incrementRetry(request.id);
      if (!canRetry) {
        failed++;
      }
    }
  }

  return { successful, failed };
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ total: number; oldest: Date | null }> {
  const queue = await getQueue();
  const oldest = queue.length > 0 
    ? new Date(Math.min(...queue.map(req => req.timestamp)))
    : null;

  return {
    total: queue.length,
    oldest,
  };
}

