import React from 'react'
import { useParams } from 'react-router-dom'
import { ReportDetail } from '@/components/reports/ReportDetail'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  
  return (
    <div className="container mx-auto px-4 py-6">
      <ReportDetail />
    </div>
  )
} 