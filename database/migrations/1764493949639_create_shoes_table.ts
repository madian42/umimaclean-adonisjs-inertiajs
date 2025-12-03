import Tables from '#enums/table_enum'
import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Shoes and Services Migration
 *
 * Creates two tables:
 * 1. shoes - Individual shoes submitted for cleaning
 * 2. services - Available cleaning services
 *
 * Business Logic:
 * - Each order can have multiple shoes
 * - Each shoe can have multiple services applied
 * - Services are linked to shoes through transaction_items table
 * - Shoe details help determine appropriate cleaning method and pricing
 */
export default class extends BaseSchema {
  async up() {
    /**
     * SHOES Table
     *
     * Stores information about individual shoes submitted for cleaning.
     * Each shoe belongs to an order (online or offline).
     *
     * Fields:
     * - id: UUID primary key
     * - order_id: Reference to order (changed from booking_id)
     * - brand: Manufacturer (Nike, Adidas, etc.)
     * - size: Shoe size
     * - type: Style (sneakers, boots, etc.)
     * - material: Primary material (leather, canvas, suede, mesh, etc.)
     * - category: Usage type (sports, casual, formal, etc.)
     * - condition: Current state (good, worn, heavily stained, etc.)
     * - created_at: When shoe record was created
     * - updated_at: Last modification timestamp
     *
     * Why We Track Shoe Details:
     * - Material determines cleaning method (suede needs special care)
     * - Condition affects pricing and sets expectations
     * - Brand/type helps with identification and storage
     * - Used for quality control and customer reference
     *
     * IMPORTANT: order_id references ORDERS table (renamed from bookings)
     */
    this.schema.createTable(Tables.SHOES, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Reference to order (changed from booking_id to order_id)
      table
        .uuid('order_id')
        .notNullable()
        .references('id')
        .inTable(Tables.ORDERS) // Changed from BOOKINGS to ORDERS
        .onDelete('CASCADE')

      // Shoe identification
      table.string('brand').notNullable()
      table.integer('size').notNullable()
      table.string('type').notNullable()

      // Critical for determining cleaning method
      table.string('material').notNullable()

      // Additional categorization
      table.string('category').notNullable()

      // Condition when received - important for expectations and disputes
      table.string('condition').notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    /**
     * SERVICES Table
     *
     * Catalog of available cleaning services.
     * Services are applied to shoes through transaction_items.
     *
     * Fields:
     * - id: UUID primary key
     * - name: Service name (e.g., "Deep Cleaning", "Basic Wash")
     * - description: Detailed explanation of service
     * - type: Pricing type
     *   - 'primary': Standard service with fixed price
     *   - 'additional': Add-on service (waterproofing, deodorizing)
     *   - 'start_from': Variable pricing (final price determined after inspection)
     * - price: Base price in smallest currency unit (IDR without decimals)
     * - created_at: When service was created
     * - updated_at: Last modification
     *
     * Service Types Explained:
     * - PRIMARY: Main cleaning services (Deep Clean, Basic Wash, etc.)
     *   Customer must choose at least one primary service
     *   Fixed price known upfront
     *
     * - ADDITIONAL: Optional add-ons (Waterproofing, Deodorizing, etc.)
     *   Can be added to any primary service
     *   Fixed additional cost
     *
     * - START_FROM: Services with variable pricing (Repair, Restoration, etc.)
     *   Price depends on damage assessment during inspection
     *   Listed price is minimum/starting price
     *   Final price determined after CHECK stage
     *
     * Business Logic:
     * - Services are global (not order-specific)
     * - Same service can be applied to multiple shoes
     * - Pricing stored at transaction_item level (captures price at time of order)
     * - Allows price changes over time without affecting historical orders
     */
    this.schema.createTable(Tables.SERVICES, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      // Service identification
      table.string('name').notNullable()
      table.text('description').nullable()

      // Pricing type - determines how price is calculated
      table.enum('type', ['primary', 'additional', 'start_from']).notNullable()

      // Base price (for start_from, this is minimum price)
      table.decimal('price', 8, 2).notNullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    // Drop in reverse order due to foreign key constraints
    this.schema.dropTable(Tables.SERVICES)
    this.schema.dropTable(Tables.SHOES)
  }
}
