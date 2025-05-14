import React, { useEffect } from 'react';
import { AppraisalWizard } from '@/components/appraisals/AppraisalWizard';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewAppraisalPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Set page title
    document.title = 'New Appraisal | AppraisalHub';
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/appraisals')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Appraisals
          </Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-2">New Appraisal</h2>
        <p className="text-gray-500">
          Follow the steps below to create a new property appraisal
        </p>
      </div>
      
      <AppraisalWizard />
    </div>
  );
} 