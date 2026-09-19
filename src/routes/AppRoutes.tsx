import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../modules/auth/LoginPage'
import RegisterPage from '../modules/auth/RegisterPage'
import ProtectedRoute from './ProtectedRoute'
import MenuAdmin from '../features/menu/MenuAdmin.tsx'
import MenuSocio from '../features/menu/MenuSocio.tsx'
import ProfileSocio from '../features/socio/ProfileSocio.tsx'
import SportsSocio from '../features/socio/SportsSocio.tsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['Socio']} />}>
        <Route path="/socio" element={<MenuSocio />} />
        <Route path="/socio/profile" element={<ProfileSocio />} />
        <Route path="/socio/sports" element={<SportsSocio />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<MenuAdmin />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}