import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { Json } from '../types/supabase';

/**
 * IMPORTANT: This is a placeholder for the notification service that will be implemented
 * after the database migrations have been run and TypeScript types regenerated.
 * 
 * The actual implementation will be added once the following changes are applied:
 * 1. Run the migration in 'supabase/migrations/20240701000000_notifications.sql'
 * 2. Regenerate TypeScript types with 'supabase gen types typescript --local > src/types/supabase.ts'
 * 
 * This file contains interface definitions and stub functions that will be properly
 * implemented after the migration.
 */

/**
 * NOTE: This service module contains code for notifications that will be added to the database in a future migration.
 * The tables 'notifications' and 'notification_preferences' will be created in the migration file
 * '20240701000000_notifications.sql', at which point TypeScript types will be regenerated.
 * 
 * Until then, we're using type casting and temp interfaces to handle typing.
 */

// Define notification types manually since they're not in the generated types yet
export interface Notification {
  id: string;
  created_at: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: Json;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  read_at: string | null;
}

export interface NotificationPreference {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  appraisal_status: boolean;
  valuation_complete: boolean;
  report_ready: boolean;
  team_invite: boolean;
  property_access: boolean;
  system_message: boolean;
  email_notifications: boolean;
  in_app_notifications: boolean;
}

export interface NotificationResponse<T = unknown> {
  success: boolean;
  error: string | null;
  data: T | null;
}

// Suppress TypeScript errors since these tables will be created in a future migration
// @ts-expect-error - Future implementation: suppress errors for tables that don't exist yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notificationsTable = 'notifications' as any;
// @ts-expect-error - Future implementation: suppress errors for tables that don't exist yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const preferencesTable = 'notification_preferences' as any;

// Stub functions to be implemented after migration
export async function getUserNotifications(): Promise<NotificationResponse<Notification[]>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function getUnreadNotificationsCount(): Promise<NotificationResponse<number>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function markNotificationAsRead(): Promise<NotificationResponse<Notification>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function markAllNotificationsAsRead(): Promise<NotificationResponse<null>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function getNotificationPreferences(): Promise<NotificationResponse<NotificationPreference>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function updateNotificationPreferences(): Promise<NotificationResponse<NotificationPreference>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function createNotification(): Promise<NotificationResponse<Notification>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
}

export async function deleteNotification(): Promise<NotificationResponse<null>> {
  return {
    success: false,
    error: 'Notification service not yet implemented',
    data: null,
  };
} 