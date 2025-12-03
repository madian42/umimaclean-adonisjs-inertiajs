import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import Tables from '#enums/table_enum'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import TransactionItem from './transaction_item.js'

/**
 * Shoe Model
 *
 * Represents a shoe submitted for cleaning in an order.
 * Each order can contain multiple shoes, and each shoe can have multiple services applied.
 *
 * Business Logic:
 * - A shoe is always part of an order (online or offline)
 * - One order can have multiple shoes
 * - Each shoe can have different services (e.g., deep clean, repair, waterproofing)
 * - Shoe details are captured for:
 *   1. Service assessment - different materials/conditions need different treatments
 *   2. Customer reference - helps identify which shoe is which
 *   3. Pricing - some shoe types/materials cost more to clean
 *   4. Quality control - track which shoes need special care
 *
 * Shoe Information Captured:
 * - brand: Manufacturer (Nike, Adidas, Converse, etc.)
 * - size: Shoe size (helps with handling and storage)
 * - type: Style (sneakers, boots, sandals, formal, etc.)
 * - material: Primary material (leather, canvas, suede, mesh, etc.)
 * - category: Usage type (sports, casual, formal, outdoor, etc.)
 * - condition: Current state (good, worn, heavily stained, damaged, etc.)
 *
 * Usage Example:
 * ```typescript
 * // Customer submits 2 shoes in one order
 * const shoe1 = await Shoe.create({
 *   orderId: order.id,
 *   brand: 'Nike',
 *   size: 42,
 *   type: 'sneakers',
 *   material: 'mesh',
 *   category: 'sports',
 *   condition: 'worn'
 * })
 *
 * const shoe2 = await Shoe.create({
 *   orderId: order.id,
 *   brand: 'Adidas',
 *   size: 43,
 *   type: 'sneakers',
 *   material: 'leather',
 *   category: 'casual',
 *   condition: 'heavily stained'
 * })
 * ```
 */
export default class Shoe extends BaseModel {
  static table = Tables.SHOES

  @column({ isPrimary: true })
  declare id: string

  /**
   * Reference to the order this shoe belongs to
   * A shoe must always be part of an order
   */
  @column()
  declare orderId: string

  /**
   * Shoe manufacturer/brand
   * Examples: Nike, Adidas, Puma, Converse, New Balance, etc.
   * Helps staff identify shoe and determine appropriate cleaning methods
   */
  @column()
  declare brand: string

  /**
   * Shoe size
   * Used for identification and storage organization
   * Can be in various formats (US, EU, UK, etc.)
   */
  @column()
  declare size: number

  /**
   * Type/style of shoe
   * Examples: sneakers, boots, sandals, slip-ons, high-tops, etc.
   * Affects cleaning method and drying time
   */
  @column()
  declare type: string

  /**
   * Primary material of the shoe
   * Examples: leather, canvas, suede, mesh, synthetic, nubuck, etc.
   * CRITICAL: Different materials require different cleaning products and techniques
   * - Leather: needs conditioning after cleaning
   * - Suede: requires special brushes and cleaners
   * - Canvas: can handle more aggressive cleaning
   * - Mesh: delicate, needs gentle treatment
   */
  @column()
  declare material: string

  /**
   * Category/usage type
   * Examples: sports, casual, formal, outdoor, running, basketball, etc.
   * Helps determine expected wear patterns and cleaning approach
   */
  @column()
  declare category: string

  /**
   * Current condition of the shoe when received
   * Examples: 'good', 'worn', 'heavily stained', 'damaged', 'like new', etc.
   * Used for:
   * - Setting customer expectations
   * - Pricing adjustments (heavily damaged may cost more)
   * - Before/after comparison
   * - Dispute prevention (documented condition upon receipt)
   */
  @column()
  declare condition: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Order this shoe belongs to
   * Load with: await shoe.load('order')
   */
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * Transaction items for this shoe
   * Links shoe to services and pricing
   *
   * Example:
   * - Shoe: Nike Air Max (this record)
   * - TransactionItem 1: Deep Cleaning - 50,000 IDR
   * - TransactionItem 2: Waterproofing - 20,000 IDR
   * - Total for this shoe: 70,000 IDR
   *
   * One shoe can have multiple services applied
   */
  @hasMany(() => TransactionItem, {
    foreignKey: 'shoeId',
  })
  declare transactionItems: HasMany<typeof TransactionItem>
}
