import React from 'react'
import { getMedia } from '@/lib/queries'

type Props = {
    params: { subaccountId: string }
}

const MediaPage = async ({ params }: Props) => {
  const data = await getMedia(params.subaccountId)
  return (
    <div>MediaPage</div>
  )
}

export default MediaPage