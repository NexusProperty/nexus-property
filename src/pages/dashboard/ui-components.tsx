import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormElementsDemo } from "@/components/ui/form-elements-demo";
import { DataTableDemo } from "@/components/ui/data-table-demo";
import { ModalSystemDemo } from "@/components/ui/modal-system-demo";

export default function UIComponentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">UI Components Library</h1>
        <p className="text-muted-foreground">
          Showcase of reusable UI components for AppraisalHub
        </p>
      </div>

      <Tabs defaultValue="form-elements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="form-elements">Form Elements</TabsTrigger>
          <TabsTrigger value="data-table">Data Table</TabsTrigger>
          <TabsTrigger value="modal-system">Modal System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form-elements" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Form Elements Library</CardTitle>
              <CardDescription>
                A comprehensive set of form components with validation support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormElementsDemo />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data-table" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Data Table Component</CardTitle>
              <CardDescription>
                Advanced data table with sorting, filtering, and pagination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTableDemo />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="modal-system" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Modal System</CardTitle>
              <CardDescription>
                Flexible modal system for confirmations, forms, and information displays
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModalSystemDemo />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 