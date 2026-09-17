import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '../modules/auth/LoginPage'
import RegisterPage from '../modules/auth/RegisterPage'
import ProtectedRoute from './ProtectedRoute'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<div>Panel Admin (placeholder)</div>} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['Socio']} />}>
        <Route path="/socio" element={<div>Panel Socio (placeholder)</div>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}