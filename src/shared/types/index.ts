export type TypeUser = 'Admin' | 'Socio'

export interface Client {
  id: number
  name: string
  surname: string
  email: string
  doc: string
  birth_date: string
  type_user: TypeUser
  //password
}

export interface ApiResponse<T> {
  message: string
  data: T
}