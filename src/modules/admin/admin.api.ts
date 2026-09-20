import api from '../../shared/lib/axios'
import type { ApiResponse, Client, Sport } from '../../shared/types'

export const getClients = (params?: { name?: string; doc?: string }) =>
  api.get<ApiResponse<Client[]>>('/clients', { params })

export const getClientById = (id: number) =>
  api.get<ApiResponse<Client>>(`/clients/${id}`)

export const deleteClient = (id: number) =>
  api.delete<ApiResponse<null>>(`/clients/${id}`)

// Deportes
export const getSports = () =>
  api.get<ApiResponse<Sport[]>>('/sports')

export const getSportById = (id: number) =>
  api.get<ApiResponse<Sport>>(`/sports/${id}`)

export const createSport = (data: { name: string }) =>
  api.post<ApiResponse<Sport>>('/sports', data)

export const updateSport = (id: number, data: { name: string }) =>
  api.put<ApiResponse<Sport>>(`/sports/${id}`, data)

export const deleteSport = (id: number) =>
  api.delete<ApiResponse<null>>(`/sports/${id}`)


