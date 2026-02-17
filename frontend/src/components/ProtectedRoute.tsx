import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
