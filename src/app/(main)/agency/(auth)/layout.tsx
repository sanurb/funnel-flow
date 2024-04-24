import type React from 'react'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="layout-auth h-full flex items-center justify-center">{children}</div>
  )
}

export default AuthLayout