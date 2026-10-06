import api from '../../shared/lib/axios'
import type { ApiResponse, Client, Sport, Course } from '../../shared/types'

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
  sched: string
  professor: string
  start_date: string
  finish_date: string
  quota: number
  sport: number // id del sport
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
