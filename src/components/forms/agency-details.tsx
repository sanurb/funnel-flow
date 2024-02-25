'use client'
import { Agency } from '@prisma/client'
import React, { useRouter } from 'next/router'
import { useState } from 'react'
import { AlertDialog } from '../ui/alert-dialog'
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { useToast } from '../ui/use-toast'

type Props = {
    data?: Partial<Agency>
}

const AgencyDetails = ({ data }: Props) => {
  const { toast } = useToast()
//   const router = useRouter()
  const [deletingAgency, setDeletingAgency] = useState(false)
   return (
    <AlertDialog>
        <Card className='w-full'>
            <CardHeader>
                <CardTitle>Agency Information</CardTitle>
                <CardDescription>
                    Lets create an agency for you business. You can edit agency settings
                    later from the agency settings tab.
                </CardDescription>
            </CardHeader>
        </Card>
    </AlertDialog>
  )
}

export default AgencyDetails