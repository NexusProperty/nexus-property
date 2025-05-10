import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CustomerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Get Your Free Appraisal</h1>
        <p className="text-muted-foreground">
          Find out the current market value of your property.
        </p>
      </div>
      
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-100">
        <CardHeader>
          <CardTitle>Start a New Property Appraisal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Get an instant, AI-powered market appraisal for your property in just a few minutes.
            </p>
            <Button size="lg" asChild>
              <Link to="/appraisals/create">Start Free Appraisal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Recent Appraisals</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="font-medium">123 Example Street, Auckland</p>
              <p className="text-muted-foreground text-sm mt-1">Generated on May 1, 2025</p>
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/appraisals">View All Appraisals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center bg-gray-50 border rounded-lg p-8 text-center">
            <p className="text-muted-foreground text-sm">
              You haven't generated any other appraisals yet.
            </p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Connect with Real Estate Professionals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Want a more detailed property valuation and expert advice? 
            Connect with a licensed real estate agent in your area.
          </p>
          <Button variant="outline">Find an Agent</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
