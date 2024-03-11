'use client'
import {
  deleteSubAccount,
  getSubaccountDetails,
  saveActivityLogsNotification,
} from '@/lib/queries'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  subaccountId: string
}

const DeleteButton = ({ subaccountId }: Props) => {
  const router = useRouter()

  const handleDelete = async () => {
    try {
      const response = await getSubaccountDetails(subaccountId)
      await saveActivityLogsNotification({
        agencyId: undefined,
        description: `Deleted a subaccount | ${response?.name}`,
        subaccountId,
      })
      await deleteSubAccount(subaccountId)
      router.refresh()
    } catch (error) {
      console.error('Error deleting subaccount:', error)
    }
  }

  return (
    <div className="text-white" onClick={handleDelete}>
      Delete Sub Account
    </div>
  )
}

export default DeleteButton
