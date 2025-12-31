import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useStickyState } from '../hooks/useStickyState';

type OperationType = 'INSERT' | 'UPDATE' | 'DELETE';

interface QueueItem {
    id: string; // Unique ID for the queue item
    timestamp: number;
    type: OperationType;
    table: string; // 'patients', 'analysis_requests', etc.
    payload: any;
    match?: any; // For updates/deletes: { id: 'uuid' }
}

interface SyncContextType {
    isOnline: boolean;
    queue: QueueItem[];
    isSyncing: boolean;
    enqueue: (type: OperationType, table: string, payload: any, match?: any) => void;
    syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [queue, setQueue] = useStickyState<QueueItem[]>([], 'lims_sync_queue');
    const [isSyncing, setIsSyncing] = useState(false);

    // 1. Network Status Listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue(); // Auto-sync on reconnect
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 2. Queue Processor
    const processQueue = useCallback(async () => {
        if (isSyncing || queue.length === 0 || !navigator.onLine) return;

        setIsSyncing(true);
        console.log(`[Sync] Processing ${queue.length} items...`);

        // Process sequentially to maintain order dependencies
        // (e.g. Create Patient -> Create Request for that patient)
        let newQueue = [...queue];
        const itemsProcessed: string[] = [];

        try {
            for (const item of queue) {
                try {
                    // If Item is older than 24h, maybe warn? For now just process.

                    let error = null;

                    if (item.type === 'INSERT') {
                        const { error: err } = await supabase.from(item.table).insert([item.payload]);
                        error = err;
                    } else if (item.type === 'UPDATE') {
                        const { error: err } = await supabase.from(item.table).update(item.payload).match(item.match);
                        error = err;
                    } else if (item.type === 'DELETE') {
                        const { error: err } = await supabase.from(item.table).delete().match(item.match);
                        error = err;
                    }

                    if (error) {
                        console.error(`[Sync] Failed item ${item.id}`, error);
                        // If conflict or specific error, maybe keep in queue? 
                        // For now, if error is terminal (500, or duplicate key that implies success), remove it?
                        // Safe approach: Keep in queue if network error. Remove if logic error?
                        // Supabase JS Error doesn't explicitly separate Network vs Logic nicely.
                        // Assuming if we are here, we are "Online". So error is likely logic/conflict.
                        // If conflict (e.g. duplicate key), we assume it's already done?
                        // Let's Retry ONCE per session.

                        // Ideally we only remove on SUCCESS.
                        // But if it blocks the queue forever, that's bad.
                        // For now: Keep it. 
                        throw error; // Stop processing rest of queue to preserve order
                    } else {
                        itemsProcessed.push(item.id);
                    }

                } catch (err) {
                    // Stop processing if one fails, to preserve dependency order
                    console.error("[Sync] Batch interrupted", err);
                    break;
                }
            }
        } finally {
            // Remove processed items
            if (itemsProcessed.length > 0) {
                setQueue(prev => prev.filter(i => !itemsProcessed.includes(i.id)));
                console.log(`[Sync] Successfully synced ${itemsProcessed.length} items.`);
            }
            setIsSyncing(false);
        }
    }, [queue, isSyncing, setQueue]);

    // Periodic Sync Attempt (every 60s) just in case
    useEffect(() => {
        const interval = setInterval(() => {
            if (navigator.onLine && queue.length > 0) processQueue();
        }, 60000);
        return () => clearInterval(interval);
    }, [processQueue, queue.length]);

    const enqueue = (type: OperationType, table: string, payload: any, match?: any) => {
        const newItem: QueueItem = {
            id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type,
            table,
            payload,
            match
        };
        setQueue(prev => [...prev, newItem]);
    };

    const syncNow = async () => {
        await processQueue();
    };

    return (
        <SyncContext.Provider value={{
            isOnline, queue, isSyncing, enqueue, syncNow
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
