import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../modules/auth/authStore'
import type { TypeUser } from '../shared/types'

interface Props {
  allowedRoles?: TypeUser[]
}

//componente que protege rutas según el estado de autenticación y los roles permitidos
export default function ProtectedRoute({ allowedRoles }: Props) {
  const { isAuthenticated, client } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (allowedRoles && client && !allowedRoles.includes(client.type_user)) {
    return <Navigate to="/" replace />
  }

  return <Outlet /> //placeholder que React Router reemplaza por la ruta hija que corresponda
}