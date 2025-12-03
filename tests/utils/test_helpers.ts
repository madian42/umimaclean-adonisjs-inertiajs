import Roles from '#enums/role_enum'
import Address from '#models/address'
import Order from '#models/order'
import User from '#models/user'
import { ApiClient } from '@japa/api-client'

/**
 * Shared test helpers to reduce repetition across functional tests.
 *
 * - Entity factory helpers: create users, addresses, orders with sensible defaults.
 * - Client request helpers: wrap common request patterns (Inertia + CSRF + referer).
 *
 * These helpers keep the specs clean and make it easier to debug where failures occur.
 */

/**
 * Create a user with sensible defaults. Override any field via `overrides`.
 */
export async function createUser(
  overrides: Partial<{
    email: string
    name: string
    password: string
    roleId: Roles
  }> = {}
) {
  const user = await User.create({
    email: overrides.email ?? `user-${Date.now()}@example.com`,
    name: overrides.name ?? 'Test User',
    password: overrides.password ?? 'secret123',
    roleId: overrides.roleId ?? Roles.USER,
  })

  return user
}

/**
 * Create an address for a given user. Override any field via `overrides`.
 */
export async function createAddressFor(
  userId: string,
  overrides: Partial<{
    name: string
    phone: string
    street: string
    latitude: number
    longitude: number
    radius: number
    note: string | null
  }> = {}
) {
  const address = await Address.create({
    userId,
    name: overrides.name ?? 'John',
    phone: overrides.phone ?? '62811',
    street: overrides.street ?? 'Street',
    latitude: overrides.latitude ?? -6.9555305,
    longitude: overrides.longitude ?? 107.6540353,
    radius: overrides.radius ?? 0,
    note: overrides.note ?? null,
  })

  return address
}

/**
 * Create an order for a given user. Override any field via `overrides`.
 */
export async function createOrderFor(
  userId: string,
  overrides: Partial<{
    addressId: string
    date: Date
    type: 'online' | 'offline'
  }> = {}
) {
  const order = await Order.create({
    userId,
    addressId: overrides.addressId,
    date: overrides.date ?? new Date(),
    type: overrides.type ?? 'online',
  })

  return order
}

/**
 * Perform an Inertia GET request with common headers.
 *
 * Optionally logs in before the request.
 */
export function inertiaGet(
  client: ApiClient,
  url: string,
  options: {
    loginAs?: User
    withCsrf?: boolean
  } = {}
) {
  let req = client.get(url)
  if (options.loginAs) {
    req = req.loginAs(options.loginAs)
  }
  if (options.withCsrf) {
    req = req.withCsrfToken()
  }
  return req.withInertia()
}

/**
 * Perform an Inertia POST request with referer and CSRF headers.
 *
 * Optionally logs in before the request.
 */
export function inertiaPost(
  client: ApiClient,
  url: string,
  form: Record<string, unknown>,
  options: {
    referer?: string
    loginAs?: User
    withCsrf?: boolean
  } = {}
) {
  let req = client.post(url)

  if (options.loginAs) {
    req = req.loginAs(options.loginAs)
  }
  if (options.referer) {
    req = req.header('referer', options.referer)
  }
  if (options.withCsrf !== false) {
    // Default to true
    req = req.withCsrfToken()
  }

  return req.form(form).withInertia()
}
