import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PropertyDataDemo = () => {
  const properties = [
    { id: 1, address: "123 Main St", type: "Residential", value: "$450,000", lastAppraisal: "2024-02-15" },
    { id: 2, address: "456 Oak Ave", type: "Commercial", value: "$1,200,000", lastAppraisal: "2024-01-20" },
    { id: 3, address: "789 Pine Rd", type: "Residential", value: "$380,000", lastAppraisal: "2024-03-01" },
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Property Data Demo</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Sample Property Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Appraisal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell>{property.value}</TableCell>
                  <TableCell>{property.lastAppraisal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDataDemo; 