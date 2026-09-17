import api from '../../shared/lib/axios'
import type { Client, ApiResponse, TypeDoc } from '../../shared/types'

interface LoginResponse {
  client: Client
  token: string
}

export const loginRequest = (email: string, password: string) =>
  api.post<ApiResponse<LoginResponse>>('/clients/login', { email, password })

export interface RegisterPayload {
  name: string
  surname: string
  email: string
  doc: string
  type_doc: TypeDoc
  password: string
  birth_date: string
  type_user: 'Socio'
}

export const registerRequest = (payload: RegisterPayload) =>
  api.post<ApiResponse<Client>>('/clients', payload)