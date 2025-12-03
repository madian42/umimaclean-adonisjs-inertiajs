import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import env from '#start/env'
import Tables from '#enums/table_enum'
import { DateTime } from 'luxon'

/**
 * Address Model
 *
 * Stores customer addresses for both online and offline orders.
 * Required for ALL orders - both online and offline.
 *
 * Business Logic:
 * - Each user can have MULTIPLE addresses (hasMany relationship)
 * - ONLINE orders: Address is customer's delivery/pickup location (validated against service area)
 * - offline orders: Address represents store location with customer's contact info
 * - Service area has directional limits (North: 30km, South: 10km, East: 30km, West: 20km)
 *
 * offline Address Creation:
 * - When customer places offline order, staff creates address with:
 *   - userId: Staff user's ID (owner of address)
 *   - name: Customer's actual name
 *   - phone: Customer's actual phone (for pickup notification)
 *   - latitude/longitude: STORE's coordinates (service center)
 *   - radius: 0 (customer is at the store)
 *   - street: Store's address
 * - This allows offline customers to later add real addresses for online delivery
 *
 * Address Validation:
 * - Before online order creation, validateRadius() checks if address is in service area
 * - Uses Haversine formula to calculate distance from service center
 * - Directional limits prevent service outside coverage area
 * - Validation failure = customer cannot place order from that address
 * - offline addresses (at store location) always pass validation (radius = 0)
 *
 * Fields:
 * - userId: Owner of this address
 * - name: Contact name (customer's real name for both online and offline)
 * - phone: Contact phone number (for delivery coordination or pickup notification)
 * - street: Full street address (customer's for online, store's for offline)
 * - latitude/longitude: GPS coordinates (customer's for online, store's for offline)
 * - radius: Calculated distance from service center (km) - 0 for offline
 * - note: Optional delivery instructions or notes
 */
export default class Address extends BaseModel {
  static table = Tables.ADDRESSES

  @column({ isPrimary: true })
  declare id: string

  /**
   * User who owns this address
   * One user can have many address for staff when offline order
   */
  @column()
  declare userId: string

  /**
   * Contact name for delivery
   * May differ from user's name (e.g., family member, office receptionist)
   */
  @column()
  declare name: string

  /**
   * Contact phone number for delivery coordination
   * Staff calls this number when arriving for pickup/delivery
   */
  @column()
  declare phone: string

  /**
   * Full street address
   * Example: "Jl. Sudirman No. 123, RT 01/RW 02, Kelurahan ABC, Kecamatan XYZ"
   */
  @column()
  declare street: string

  /**
   * GPS latitude coordinate
   * Used for distance calculation and service area validation
   * Critical for determining if address is within coverage
   */
  @column()
  declare latitude: number

  /**
   * GPS longitude coordinate
   * Used for distance calculation and service area validation
   * Critical for determining if address is within coverage
   */
  @column()
  declare longitude: number

  /**
   * Calculated distance from service center in kilometers
   * Computed during address creation/update
   * Used for delivery fee calculation and service area validation
   */
  @column()
  declare radius: number

  /**
   * Optional delivery instructions
   * Examples:
   * - "Ring doorbell twice"
   * - "Call upon arrival, gate is locked"
   * - "Leave with security guard"
   * - "Available after 5 PM only"
   */
  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * User relationship
   */
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  /**
   * Validate if order location is within service area with directional limits
   *
   * Business Logic:
   * - Service area is NOT a simple circle - it has directional limits
   * - North: 30km, South: 10km, East: 30km, West: 20km from service center
   * - This accommodates real-world factors (traffic, urban density, etc.)
   * - Must be called before creating online order
   *
   * Returns:
   * - true if address is within service area
   * - false if address is outside service area
   *
   * Throws:
   * - Error if validation fails (e.g., invalid coordinates)
   *
   * Usage:
   * ```typescript
   * const isValid = await Address.validateRadius(latitude, longitude)
   * if (!isValid) {
   *   throw new Error('Address is outside service area')
   * }
   * ```
   *
   * NOTE:
   * - For ONLINE orders: validates customer's actual delivery location
   * - For offline orders: always passes (uses store coordinates, radius = 0)
   */
  public static async validateRadius(latitude: number, longitude: number) {
    try {
      // Get business/service center coordinates
      const serviceCenterLat = env.get('SERVICE_CENTER_LATITUDE')
      const serviceCenterLng = env.get('SERVICE_CENTER_LONGITUDE')

      // Service area limits in kilometers
      const limits = {
        north: 30,
        south: 10,
        east: 30,
        west: 20,
      }

      const result = this.checkDirectionalLimits(
        serviceCenterLat,
        serviceCenterLng,
        latitude,
        longitude,
        limits
      )

      return result.isWithinArea
    } catch (error) {
      throw new Error('Gagal memvalidasi radius order')
    }
  }

  /**
   * Check if location is within directional service limits
   *
   * Business Logic:
   * - Determines primary direction of address from service center
   * - Applies appropriate distance limit based on direction
   * - Uses Haversine formula for accurate distance calculation
   *
   * Directional Limits:
   * - North: 30km (less traffic, easier access)
   * - South: 10km (heavy traffic, limited staff)
   * - East: 30km (urban area, good roads)
   * - West: 20km (mixed conditions)
   *
   * Algorithm:
   * 1. Calculate lat/lng difference from center
   * 2. Determine if movement is primarily N/S or E/W
   * 3. Apply corresponding limit
   * 4. Calculate actual distance using Haversine
   * 5. Check if distance exceeds limit for that direction
   *
   * Returns:
   * - direction: Primary direction ('north', 'south', 'east', 'west')
   * - distance: Actual distance in km
   * - limit: Maximum allowed distance for that direction
   * - isWithinArea: true if within limit, false otherwise
   */
  private static checkDirectionalLimits(
    centerLat: number,
    centerLng: number,
    targetLat: number,
    targetLng: number,
    limits: { north: number; south: number; east: number; west: number }
  ) {
    // Calculate distances in each direction
    const latDiff = targetLat - centerLat
    const lngDiff = targetLng - centerLng

    // Determine primary direction
    let direction: string

    if (Math.abs(latDiff) > Math.abs(lngDiff)) {
      // Primary movement is North/South
      if (latDiff > 0) {
        direction = 'north'
      } else {
        direction = 'south'
      }
    } else {
      // Primary movement is East/West
      if (lngDiff > 0) {
        direction = 'east'
      } else {
        direction = 'west'
      }
    }

    // For more accurate validation, also check if the total distance respects the limits
    // This handles diagonal movements better
    const totalDistance = this.calculateDistance(centerLat, centerLng, targetLat, targetLng)
    const maxAllowedDistance = this.calculateMaxAllowedDistance(latDiff, lngDiff, limits)

    const isWithinArea = totalDistance <= maxAllowedDistance

    return {
      direction,
      distance: totalDistance,
      limit: maxAllowedDistance,
      isWithinArea,
    }
  }

  /**
   * Calculate maximum allowed distance based on direction ratios
   *
   * For diagonal movements, this calculates a weighted maximum distance.
   * If address is northeast, it considers both north and east limits.
   *
   * Example:
   * - Address is 45 degrees northeast (equal north and east movement)
   * - North limit: 30km, East limit: 30km
   * - Effective limit: ~42km (using Pythagorean theorem)
   *
   * This prevents exploitation of directional limits by going diagonally.
   */
  private static calculateMaxAllowedDistance(
    latDiff: number,
    lngDiff: number,
    limits: { north: number; south: number; east: number; west: number }
  ) {
    // Calculate ratios for each direction
    const totalLatDiff = Math.abs(latDiff)
    const totalLngDiff = Math.abs(lngDiff)
    const totalDiff = totalLatDiff + totalLngDiff

    if (totalDiff === 0) return Math.max(...Object.values(limits))

    const latRatio = totalLatDiff / totalDiff
    const lngRatio = totalLngDiff / totalDiff

    // Determine effective limits based on direction
    const verticalLimit = latDiff >= 0 ? limits.north : limits.south
    const horizontalLimit = lngDiff >= 0 ? limits.east : limits.west

    // Calculate weighted maximum distance
    const maxDistance = Math.sqrt(
      Math.pow(verticalLimit * latRatio, 2) + Math.pow(horizontalLimit * lngRatio, 2)
    )

    return maxDistance
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   *
   * Haversine formula accounts for Earth's curvature.
   * More accurate than simple Pythagorean distance for geographic coordinates.
   *
   * Parameters:
   * - lat1, lon1: Starting point (service center)
   * - lat2, lon2: Target point (customer address)
   *
   * Returns:
   * - Distance in kilometers, rounded to 2 decimal places
   *
   * Formula:
   * a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
   * c = 2 × atan2(√a, √(1−a))
   * distance = R × c (where R = Earth's radius = 6371 km)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   *
   * Required for trigonometric calculations in Haversine formula.
   * JavaScript's Math functions use radians, but GPS coordinates are in degrees.
   */
  private static toRadians(degrees: number) {
    return degrees * (Math.PI / 180)
  }
}
