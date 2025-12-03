import Address from '#models/address'
import env from '#start/env'

/**
 * offline Address Utility
 *
 * Provides helper function to create addresses for offline orders.
 * offline addresses use the store's coordinates with the customer's contact information.
 *
 * Business Logic:
 * - offline customers come to the physical store (no delivery needed)
 * - Address belongs to STORE STAFF (userId = staff member's ID)
 * - Address contains CUSTOMER's name and phone (for contact)
 * - Store staff can track how many offline customers they've served
 * - Regular online customers maintain their own addresses (hasOne or hasMany)
 * - Order.userId = actual customer, Address.userId = store staff
 */

/**
 * Create a offline address for a customer
 *
 * Creates an address record with:
 * - userId: STORE STAFF's ID (who is serving this customer)
 * - Store's location (latitude, longitude from service center)
 * - Customer's contact info (name, phone)
 * - Store's street address
 * - Radius of 0 (customer is at the store)
 *
 * This allows tracking which store staff member served which offline customers.
 * The order itself still belongs to the customer (Order.userId = customer's ID).
 *
 * @param storeStaffId - Store staff member's user ID (not the customer's!)
 * @param customerName - Customer's actual name (for pickup notification)
 * @param customerPhone - Customer's phone number (for pickup notification)
 * @param note - Optional notes (e.g., "offline order - customer at store")
 * @returns Created address record
 *
 * @example
 * ```typescript
 * // Staff member (authenticated) creates offline order
 * const storeStaff = auth.getUserOrFail() // Staff member
 * const offlineAddress = await createofflineAddress(
 *   storeStaff.id,           // Address belongs to staff
 *   'John Doe',              // Customer's name
 *   '+62-812-3456-7890',     // Customer's phone
 *   'offline customer'
 * )
 *
 * const order = await Order.create({
 *   userId: offlineCustomer.id,    // Order belongs to customer
 *   addressId: offlineAddress.id,  // Address belongs to staff
 *   type: 'offline',
 *   date: new Date(),
 * })
 * ```
 */
export async function createofflineAddress(
  storeStaffId: string,
  customerName: string,
  customerPhone: string,
  note?: string
): Promise<Address> {
  // Get store's coordinates from environment
  const serviceCenterLat = env.get('SERVICE_CENTER_LATITUDE')
  const serviceCenterLng = env.get('SERVICE_CENTER_LONGITUDE')

  // TODO: Update this with your actual store address
  const storeStreet = 'Jl. Margasari No. 132, Margasari, Kec. Buahbatu, Kota Bandung'

  // Create address with store location and customer contact info
  // Address belongs to STORE STAFF, but contains CUSTOMER's contact info
  const address = await Address.create({
    userId: storeStaffId, // IMPORTANT: Staff member's ID, not customer's!
    name: customerName, // Customer's actual name for pickup notification
    phone: customerPhone, // Customer's phone for pickup notification
    street: storeStreet, // Store's physical address
    latitude: serviceCenterLat, // Store's latitude
    longitude: serviceCenterLng, // Store's longitude
    radius: 0, // Customer is at the store, no delivery distance
    note: note || 'Transaksi di toko',
  })

  return address
}

/**
 * Check if an address is a offline address
 *
 * offline addresses have radius = 0 and are at the service center coordinates.
 * Useful for determining if an order is offline based on its address.
 *
 * @param address - Address to check
 * @returns true if address is a offline address (at store location)
 *
 * @example
 * ```typescript
 * const order = await Order.query().preload('address').first()
 * if (isofflineAddress(order.address)) {
 *   console.log('This is a offline order')
 * } else {
 *   console.log('This is an online order')
 * }
 * ```
 */
export function isofflineAddress(address: Address): boolean {
  // offline addresses have radius 0 (at the store)
  return address.radius === 0
}

/**
 * Get or create offline address for a customer served by specific staff
 *
 * Checks if store staff already has a offline address for this customer.
 * Useful for tracking repeat offline customers per staff member.
 *
 * Note: Each time the same customer visits, you can either:
 * - Reuse existing address (this function)
 * - Create new address (call createofflineAddress directly)
 *
 * @param storeStaffId - Store staff member's user ID
 * @param customerName - Customer's name (for searching/creating)
 * @param customerPhone - Customer's phone (for searching/creating)
 * @returns Existing or newly created offline address
 *
 * @example
 * ```typescript
 * // Staff member serving repeat offline customer
 * const storeStaff = auth.getUserOrFail()
 * const address = await getOrCreateofflineAddress(
 *   storeStaff.id,        // Staff's ID
 *   'John Doe',           // Customer's name
 *   '+62-812-3456-7890'   // Customer's phone
 * )
 * ```
 */
export async function getOrCreateofflineAddress(
  storeStaffId: string,
  customerName: string,
  customerPhone: string
): Promise<Address> {
  // Look for existing offline address by this staff for this customer
  // Match by staff ID, customer name, and radius = 0
  const existingofflineAddress = await Address.query()
    .where('user_id', storeStaffId)
    .where('name', customerName)
    .where('radius', 0)
    .first()

  if (existingofflineAddress) {
    // Update phone in case it changed
    existingofflineAddress.phone = customerPhone
    await existingofflineAddress.save()
    return existingofflineAddress
  }

  // Create new offline address
  return await createofflineAddress(storeStaffId, customerName, customerPhone)
}
