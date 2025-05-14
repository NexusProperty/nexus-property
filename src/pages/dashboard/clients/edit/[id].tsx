import React from 'react'
import { useParams } from 'react-router-dom'
import { AddEditClientForm } from '@/components/clients/AddEditClientForm'

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>()
  
  // In a real app, we would fetch the client data based on the ID
  // For now, we'll just pass the isEditing flag
  
  return (
    <div className="container mx-auto px-4 py-6">
      <AddEditClientForm isEditing={true} clientId={id} />
    </div>
  )
} 