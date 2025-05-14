import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import '../../styles/responsive-utilities.css';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  mobileLabel?: string;
  priority?: 'high' | 'medium' | 'low'; // Used to determine visibility on smaller screens
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  className?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

// Helper function to safely convert any value to ReactNode
const toReactNode = (value: unknown): ReactNode => {
  if (value === null || value === undefined) return '';
  if (React.isValidElement(value)) return value;
  return String(value);
};

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available"
}: ResponsiveTableProps<T>) {
  // Render for desktop/tablet screens
  const renderDesktopTable = () => (
    <div className="hidden md:block w-full responsive-table">
      <table className={cn("w-full border-collapse", className)}>
        <thead>
          <tr className="border-b">
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  "px-4 py-3 text-left font-medium text-sm",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {isLoading ? "Loading..." : emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "border-b",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, index) => {
                  const cellValue = typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : toReactNode(item[column.accessor as keyof T]);
                    
                  return (
                    <td
                      key={index}
                      className={cn("px-4 py-4", column.className)}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Render for mobile screens (card-based layout)
  const renderMobileCards = () => (
    <div className="block md:hidden space-y-4">
      {data.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          {isLoading ? "Loading..." : emptyMessage}
        </div>
      ) : (
        data.map((item) => {
          const key = keyExtractor(item);
          
          return (
            <div
              key={key}
              className={cn(
                "border rounded-md p-4 space-y-3",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns
                .filter(col => col.priority !== 'low') // Hide low priority columns on mobile
                .map((column, index) => {
                  const cellValue = typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : toReactNode(item[column.accessor as keyof T]);
                  
                  return (
                    <div key={index} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className={cn("text-sm text-right", column.className)}>
                        {cellValue}
                      </span>
                    </div>
                  );
                })}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className="w-full">
      {renderDesktopTable()}
      {renderMobileCards()}
    </div>
  );
}

// Horizontal scrollable table variant for many columns
export function ScrollableTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available"
}: ResponsiveTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full min-w-[800px] border-collapse", className)}>
        <thead>
          <tr className="border-b">
            {columns.map((column, index) => (
              <th
                key={index}
                className={cn(
                  "px-4 py-3 text-left font-medium text-sm",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {isLoading ? "Loading..." : emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  "border-b",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((column, index) => {
                  const cellValue = typeof column.accessor === 'function'
                    ? column.accessor(item)
                    : toReactNode(item[column.accessor as keyof T]);
                    
                  return (
                    <td
                      key={index}
                      className={cn("px-4 py-4", column.className)}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {/* Mobile indicator that table is scrollable */}
      <div className="md:hidden flex justify-center text-sm text-muted-foreground py-2">
        Swipe horizontally to view more data
      </div>
    </div>
  );
}

// Example usage:
// 
// const columns = [
//   { 
//     header: 'Name', 
//     accessor: 'name',
//     priority: 'high'
//   },
//   { 
//     header: 'Email', 
//     accessor: 'email',
//     priority: 'medium'
//   },
//   { 
//     header: 'Status', 
//     accessor: (user) => (
//       <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
//         {user.status}
//       </Badge>
//     ),
//     priority: 'high',
//     className: 'text-right',
//     mobileLabel: 'Status'
//   },
// ];
// 
// return (
//   <ResponsiveTable
//     data={users}
//     columns={columns}
//     keyExtractor={(user) => user.id}
//     onRowClick={(user) => navigate(`/users/${user.id}`)}
//   />
// ); 