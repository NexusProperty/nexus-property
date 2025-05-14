import React from 'react'
import { useParams } from 'react-router-dom'
import { ClientDetail } from '@/components/clients/ClientDetail'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  
  return (
    <div className="container mx-auto px-4 py-6">
      <ClientDetail />
    </div>
  )
} 