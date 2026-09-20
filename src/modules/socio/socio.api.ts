import api from '../../shared/lib/axios'
import type { ApiResponse, Client, Course, Inscription, Sport, Fee } from '../../shared/types'

export const getInscriptionsByClient = (clientId: number) =>
  api.get<ApiResponse<Inscription[]>>(`/inscriptions?clientId=${clientId}`)

export const getFeesByClient = (clientId: number) =>
  api.get<ApiResponse<Fee[]>>(`/fees?clientId=${clientId}`)

export const updateClientProfile = (id: number, data: Partial<Client>) =>
  api.put<ApiResponse<Client>>(`/clients/${id}`, data)

// Deportes y cursos
export const getSports = () =>
  api.get<ApiResponse<Sport[]>>('/sports')

export const getCourses = () =>
  api.get<ApiResponse<Course[]>>('/courses')

export const getInscriptionsByCourse = (courseId: number) =>
  api.get<ApiResponse<Inscription[]>>(`/inscriptions?courseId=${courseId}`)

// Inscribir al socio en un curso
export const createInscription = (courseId: number, clientId: number) =>
  api.post<ApiResponse<Inscription>>('/inscriptions', { course: courseId, client: clientId })

// Desinscribir al socio de un curso
export const deleteInscription = (courseId: number, clientId: number) =>
  api.delete(`/inscriptions/${courseId}/${clientId}`)
