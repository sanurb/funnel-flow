import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@clerk/nextjs'

const f = createUploadthing()

const authenticateUser = () => {
  const user = auth()
  // If you throw, the user will not be able to upload
  if (!user) throw new Error('Unauthorized')
  // Whatever is returned here is accessible in onUploadComplete as `metadata`
  return user
}

/**
 * Represents the file router configuration for uploading different types of files.
 */
export const ourFileRouter = {
  /**
   * File route for uploading subaccount logos.
   * @remarks
   * The uploaded file should be an image with a maximum file size of 4MB and only 1 file is allowed.
   */
  subaccountLogo: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(() => {}),
  
  /**
   * File route for uploading avatars.
   * @remarks
   * The uploaded file should be an image with a maximum file size of 4MB and only 1 file is allowed.
   */
  avatar: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(() => {}),
  
  /**
   * File route for uploading agency logos.
   * @remarks
   * The uploaded file should be an image with a maximum file size of 4MB and only 1 file is allowed.
   */
  agencyLogo: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(() => {}),
  
  /**
   * File route for uploading media files.
   * @remarks
   * The uploaded file should be an image with a maximum file size of 4MB and only 1 file is allowed.
   */
  media: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authenticateUser)
    .onUploadComplete(() => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
