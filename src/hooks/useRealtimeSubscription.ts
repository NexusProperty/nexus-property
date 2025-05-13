import { useEffect, useState } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

/**
 * A hook that provides real-time updates for Supabase tables
 * 
 * @param table The table to subscribe to
 * @param schema The schema the table belongs to (defaults to 'public')
 * @param filters Optional filters for the subscription (e.g., eq: { column: 'id', value: 'some-id' })
 * @returns The subscription status and last received change
 */
export function useRealtimeSubscription<T = unknown>(
  table: string,
  schema: string = 'public',
  filters?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
    eq?: { column: string; value: string | number };
  }
) {
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [lastChange, setLastChange] = useState<RealtimePostgresChangesPayload<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Build the channel configuration
    let channel = supabase.channel(`table-changes-${table}`);
    
    // Create the subscription configuration
    const subscriptionConfig: {
      schema: string;
      table: string;
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
    } = {
      schema,
      table,
    };
    
    // Add filters if provided
    if (filters) {
      if (filters.event) {
        subscriptionConfig.event = filters.event;
      }
      
      if (filters.filter) {
        subscriptionConfig.filter = filters.filter;
      }
      
      if (filters.eq) {
        subscriptionConfig.filter = `${filters.eq.column}=eq.${filters.eq.value}`;
      }
    }
    
    // Subscribe to changes - use any type to avoid the type error with 'postgres_changes'
    // This is a typing issue with the Supabase JS client
    channel = channel
      .on(
        'postgres_changes' as any,
        subscriptionConfig,
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log('Realtime update received:', payload);
          setLastChange(payload);
          
          // You can add toast notifications for specific events
          if (payload.eventType === 'UPDATE') {
            toast({
              title: 'Update Received',
              description: `The ${table} data has been updated.`,
              variant: 'default',
            });
          }
        }
      )
      .on('broadcast', { event: 'sync' }, (payload) => {
        console.log('Sync event received:', payload);
      })
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .on('system', { event: 'connection_error' }, (err) => {
        console.error('Realtime connection error:', err);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      })
      .on('system', { event: 'connected' }, () => {
        console.log('Realtime connected');
        setIsConnected(true);
        setError(null);
      })
      .on('system', { event: 'disconnected' }, () => {
        console.log('Realtime disconnected');
        setIsConnected(false);
      });
      
    // Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${table} changes!`);
        setIsConnected(true);
      }
    });
    
    // Save the subscription
    setSubscription(channel);
    
    // Cleanup function
    return () => {
      console.log(`Unsubscribing from ${table} changes`);
      channel.unsubscribe();
    };
  }, [table, schema, JSON.stringify(filters), toast]);

  return {
    isConnected,
    lastChange,
    error,
    subscription,
  };
}

/**
 * A hook specifically for appraisal real-time updates
 * 
 * @param appraisalId The ID of the appraisal to subscribe to
 * @returns The subscription status and last received change
 */
export function useAppraisalRealtimeUpdates(appraisalId: string) {
  return useRealtimeSubscription('appraisals', 'public', {
    event: 'UPDATE',
    eq: { column: 'id', value: appraisalId },
  });
}

/**
 * A hook for subscribing to comparable properties real-time updates
 * 
 * @param appraisalId The ID of the appraisal to subscribe to comparable properties for
 * @returns The subscription status and last received change
 */
export function useComparablesRealtimeUpdates(appraisalId: string) {
  return useRealtimeSubscription('comparable_properties', 'public', {
    event: '*',
    eq: { column: 'appraisal_id', value: appraisalId },
  });
}

/**
 * A hook for subscribing to all appraisals for a specific user
 * 
 * @param userId The ID of the user to subscribe to appraisals for
 * @returns The subscription status and last received change
 */
export function useUserAppraisalsRealtimeUpdates(userId: string) {
  return useRealtimeSubscription('appraisals', 'public', {
    event: '*',
    eq: { column: 'user_id', value: userId },
  });
} 