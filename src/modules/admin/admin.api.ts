import api from '../../shared/lib/axios'
import type { ApiResponse, Client, Sport, Course, Weekday, Inscription } from '../../shared/types'

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

// Courses
export interface CoursePayload {
  course_no: number
  days: Weekday[]
  start_time: string
  end_time: string
  professor: string
  start_date: string
  finish_date: string
  quota: number
  sport: number
}//Lo podriamos mover este asi quedan solo las peticiones a la api

export const getCourses = (sportId?: number) =>
  api.get<ApiResponse<Course[]>>('/courses', {
    params: sportId ? { sportId } : undefined,
  })

export const getCourseById = (id: number) =>
  api.get<ApiResponse<Course>>(`/courses/${id}`)

export const createCourse = (data: CoursePayload) =>
  api.post<ApiResponse<Course>>('/courses', data)

export const updateCourse = (id: number, data: CoursePayload) =>
  api.put<ApiResponse<Course>>(`/courses/${id}`, data)

export const deleteCourse = (id: number) =>
  api.delete<ApiResponse<null>>(`/courses/${id}`)


export const getInscriptions = (params?: { courseId?: number; clientId?: number }) =>
  api.get<ApiResponse<Inscription[]>>('/inscriptions', { params })

export const createInscriptionAdmin = (courseId: number, clientId: number) =>
  api.post<ApiResponse<Inscription>>('/inscriptions', { course: courseId, client: clientId })

export const deleteInscriptionAdmin = (courseId: number, clientId: number) =>
  api.delete<ApiResponse<null>>(`/inscriptions/${courseId}/${clientId}`)
