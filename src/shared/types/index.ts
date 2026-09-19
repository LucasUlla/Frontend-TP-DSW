export type TypeUser = 'Admin' | 'Socio'
export type TipoDocumento = 'DNI' | 'Pasaporte'

export interface Client {
  id: number
  name: string
  surname: string
  email: string
  doc: string
  type_doc?: TipoDocumento | string
  birth_date: string
  type_user: TypeUser
  phone?: string
  address?: string
}

export interface Sport {
  id: number
  name: string
}

export interface Course {
  id: number
  course_no: number
  sched: string
  professor: string
  start_date: string
  finish_date: string
  quota: number
  sport?: Sport
}

export interface Inscription {
  course: Course
  client: Client | number
  insc_date?: string
}

export interface Fee {
  id: number
  client: Client | number
  period: string
  base_amount: number
  courses_amount: number
  total: number
  paid: boolean
  generated_at?: string
}

export interface ApiResponse<T> {
  message: string
  data: T
}