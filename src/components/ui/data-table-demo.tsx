import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

// Sample data types
type Status = "pending" | "processing" | "completed" | "failed";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  status: Status;
  createdAt: Date;
}

// Generate sample data
const data: Property[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `PROP-${1000 + i}`,
  address: `${1000 + i} Main St`,
  city: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"][
    Math.floor(Math.random() * 5)
  ],
  state: ["NY", "CA", "IL", "TX", "AZ"][Math.floor(Math.random() * 5)],
  price: Math.floor(Math.random() * 500000) + 200000,
  status: ["pending", "processing", "completed", "failed"][
    Math.floor(Math.random() * 4)
  ] as Status,
  createdAt: new Date(
    Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)
  ),
}));

export function DataTableDemo() {
  // Define columns
  const columns: ColumnDef<Property>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "Property ID",
      cell: ({ row }) => <div>{row.getValue("id")}</div>,
    },
    {
      accessorKey: "address",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Address
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div>{row.getValue("address")}</div>,
    },
    {
      accessorKey: "city",
      header: "City",
      cell: ({ row }) => <div>{row.getValue("city")}</div>,
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }) => <div>{row.getValue("state")}</div>,
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(price);
        return <div className="font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status: Status = row.getValue("status");
        return (
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "processing"
                ? "outline"
                : status === "pending"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created At
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div>
            {new Date(row.getValue("createdAt")).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const property = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(property.id)}
              >
                Copy property ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View property</DropdownMenuItem>
              <DropdownMenuItem>Edit property</DropdownMenuItem>
              <DropdownMenuItem>Delete property</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-2xl font-bold mb-4">Properties</h2>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="address"
        searchPlaceholder="Search by address..."
      />
    </div>
  );
} 