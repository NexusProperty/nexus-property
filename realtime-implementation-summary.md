# Supabase Realtime Implementation

This document outlines how Supabase Realtime has been implemented in the AppraisalHub application to provide real-time updates to users.

## Overview

Supabase Realtime enables the application to subscribe to changes in the database and update the UI in real-time without requiring page refreshes. This functionality is particularly important for:

1. Displaying status updates for appraisals that are being processed
2. Showing new comparable properties as they are added to an appraisal
3. Updating valuation results when they become available
4. Notifying users of changes to their appraisals

## Implementation Details

### 1. Reusable Hooks

Three reusable hooks have been created to facilitate Realtime subscriptions:

- `useRealtimeSubscription`: A generic hook that handles subscribing to any table
- `useAppraisalRealtimeUpdates`: A specific hook for subscribing to a single appraisal
- `useComparablesRealtimeUpdates`: A specific hook for subscribing to comparable properties for an appraisal
- `useUserAppraisalsRealtimeUpdates`: A hook for subscribing to all appraisals belonging to a user

These hooks handle:
- Setting up and cleaning up subscriptions
- Tracking connection state
- Managing and exposing changes
- Error handling

### 2. AppraisalDetail Component Integration

The AppraisalDetail component has been updated to use Realtime for:

- Receiving updates to appraisal status
- Getting real-time updates when valuation results are available
- Showing notifications when comparable properties are added or updated

When changes are received, the component updates its state and shows appropriate notifications to the user.

### 3. AppraisalList Component Integration

The AppraisalList component has been enhanced to:

- Show a real-time indicator when connected
- Receive updates to all appraisals for the current user
- Automatically add, update, or remove appraisals from the list

### 4. Visual Indicators

Several visual indicators have been added to improve the user experience:

- A pulsing green indicator when Realtime is connected
- A gray "Offline" indicator when disconnected
- Toast notifications for important updates
- Automatic UI updates when data changes

## Example Usage

### Example 1: Setting up a subscription in a component

```tsx
// Import the hook
import { useAppraisalRealtimeUpdates } from '@/hooks/useRealtimeSubscription';

function AppraisalComponent({ appraisalId }) {
  // Subscribe to real-time updates
  const { isConnected, lastChange } = useAppraisalRealtimeUpdates(appraisalId);
  
  // Update state when changes are received
  useEffect(() => {
    if (lastChange) {
      // Handle the change...
    }
  }, [lastChange]);
  
  return (
    <div>
      {isConnected ? (
        <span className="text-green-600">Connected</span>
      ) : (
        <span className="text-gray-500">Offline</span>
      )}
      
      {/* Rest of component */}
    </div>
  );
}
```

### Example 2: Processing different types of changes

```tsx
useEffect(() => {
  if (!lastChange) return;
  
  switch (lastChange.eventType) {
    case 'INSERT':
      // Handle new record
      break;
    case 'UPDATE':
      // Handle updated record
      break;
    case 'DELETE':
      // Handle deleted record
      break;
  }
}, [lastChange]);
```

## Technical Considerations

### Performance

- Subscriptions are only established when needed and cleaned up when the component unmounts
- Filters are used to limit the data received to only what's relevant to the current user
- Debouncing is applied to prevent excessive UI updates

### Security

- All Realtime subscriptions are subject to the same Row Level Security (RLS) policies as regular queries
- Users can only receive updates for data they have permission to access
- The client-side code verifies that updates are for the current user

### Error Handling

- Connection errors are gracefully handled with visual indicators
- The application can still function without Realtime by using regular polling as a fallback
- Reconnection is attempted automatically when the connection is lost

## Future Enhancements

1. Add support for presence detection to show when other users are viewing the same appraisal
2. Implement broadcast channels for system-wide notifications
3. Add offline queuing for operations performed while disconnected

## Conclusion

Supabase Realtime integration provides a significantly improved user experience by ensuring users always see the most up-to-date information without requiring manual refreshes. This is particularly important for the appraisal workflow, where statuses and data change as the appraisal is processed. 