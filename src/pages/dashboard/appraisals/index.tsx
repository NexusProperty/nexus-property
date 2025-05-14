import React, { useEffect } from 'react';
import { AppraisalList } from '@/components/appraisals/AppraisalList';

export default function AppraisalsIndexPage() {
  useEffect(() => {
    // Set page title
    document.title = 'Appraisals | AppraisalHub';
  }, []);
  
  return (
    <AppraisalList />
  );
} 