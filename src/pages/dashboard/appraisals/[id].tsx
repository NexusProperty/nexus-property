import React, { useEffect } from 'react';
import { AppraisalDetail } from '@/components/appraisals/AppraisalDetail';
import { useParams } from 'react-router-dom';

export default function AppraisalDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  useEffect(() => {
    // Set page title
    document.title = 'Appraisal Details | AppraisalHub';
  }, []);
  
  return (
    <AppraisalDetail />
  );
} 