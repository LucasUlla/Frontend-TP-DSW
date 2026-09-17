export type TypeUser = 'Admin' | 'Socio'
export type TypeDoc = 'DNI' | 'Pasaporte'

export interface Client {
  id: number
  name: string
  surname: string
  email: string
  doc: string
  type_doc: TypeDoc
  birth_date: string
  type_user: TypeUser
  //password
}

export interface ApiResponse<T> {
  message: string
  data: T
}