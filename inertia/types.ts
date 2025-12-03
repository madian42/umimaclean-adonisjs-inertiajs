interface SharedErrors {
  validation_errors?: Record<string, string>
  general_errors?: string
  limiter_errors?: string
  google_errors?: string
  [key: string]: unknown
}

export interface SharedData {
  auth: Auth
  errors?: SharedErrors
  [key: string]: unknown
}

export interface Auth {
  user: User
}

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
  isStaff: boolean
  isUser: boolean
  createdAt: Date
  updatedAt: Date
  [key: string]: unknown
}

export interface Address {
  id: string
  userId: string
  name: string
  phone: string
  street: string
  latitude: number
  longitude: number
  radius: number
  note: string
  [key: string]: unknown
}

export interface Order {
  id: string
  number: string
  date: string
  createdAt: string
  adminId?: string | null
  userId: string
  address: Address
  type: 'online' | 'offline'
  statuses: OrderStatus[]
  service?: ServiceItem[]
  photos: Photo[]
}

interface Photo {
  id: string
  orderId: string
  adminId: string
  stage: string
  path: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceItem {
  title: string
  attributes: string[]
  prices: PriceLine[]
}

interface PriceLine {
  label: string
  amount: number
}

export interface OrderStatus {
  id: string
  name: string
  note: string | null
  updatedAt: string
}

export interface PaginatedData<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
}

export interface Filters {
  search: string
  status: string
  page: number
  limit?: number
}

export interface Transaction {
  id: string
  orderId: string
  status: string
  amount: number
  type: string
  midtransStatus: string
  midtransId: string
  midtransQrCode: string
  expiredAt: string
  paymentAt: string | null
  createdAt: string
  updatedAt: string
  order: Order
}

export interface Service {
  id: string
  name: string
  price: number
  description: string
  type: string
  createdAt: string
  updatedAt: string
}
