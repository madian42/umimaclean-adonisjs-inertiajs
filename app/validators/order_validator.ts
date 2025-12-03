import OrderPhotoStages from '#enums/order_photo_stage_enum'
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * Order Validator
 *
 * Validates order creation and update requests.
 *
 * Business Logic:
 * - Online orders REQUIRE addressId (for pickup/delivery)
 * - offline orders MUST NOT have addressId (customer comes to store)
 * - Type field determines which validation rules apply
 * - Shoes can have multiple services (primary + additional)
 *
 * Validation Rules:
 * 1. type: Must be 'online' or 'offline'
 * 2. addressId: Required if type='online', must be null if type='offline'
 * 3. date: Must be valid future date
 * 4. shoes: Array of shoe objects with services
 */

/**
 * Custom error messages in Indonesian
 */
const messages = {
  'required': '{{ field }} harus diisi',
  'string': '{{ field }} harus berupa teks',
  'uuid': '{{ field }} harus berupa UUID yang valid',
  'date': '{{ field }} harus berupa tanggal yang valid',
  'enum': '{{ field }} harus berupa salah satu dari nilai yang diizinkan',
  'image.size': '{{ field }} harus berukuran maksimal {{ options.size }}',
  'image.extnames':
    '{{ field }} harus berupa salah satu dari ekstensi yang diizinkan: {{ options.extnames }}',
  'addressId.requiredWhen': 'Alamat harus diisi untuk pesanan online',
  'addressId.requiredIfMissing': 'Alamat tidak boleh diisi untuk pesanan offline',
}

/**
 * Field name translations for error messages
 */
const fields = {
  type: 'Tipe Pesanan',
  addressId: 'ID Alamat',
  date: 'Tanggal',
  contactName: 'Nama Kontak',
  contactPhone: 'Nomor Telepon Kontak',
  customerUserId: 'ID Pelanggan',
  stage: 'Tahap',
  brand: 'Merek',
  size: 'Ukuran',
  material: 'Material',
  category: 'Kategori',
  condition: 'Kondisi',
  services: 'Layanan',
  additionalServices: 'Layanan Tambahan',
}

vine.messagesProvider = new SimpleMessagesProvider(messages, fields)

/**
 * Order Creation Validator
 *
 * Validates data when creating a new order.
 *
 * Fields:
 * - type: 'online' or 'offline' - determines workflow
 * - addressId: UUID of delivery address (required for online)
 * - contactName: Contact person name (required for offline, used to create address)
 * - contactPhone: Contact phone number (required for offline, used to create address)
 * - customerUserId: Customer's user ID (required for offline when staff creates order)
 * - date: Scheduled completion date
 *
 * Business Rules:
 * - If type === 'online': addressId is REQUIRED
 * - If type === 'offline': contactName, contactPhone, and customerUserId REQUIRED
 *   - Address belongs to staff member (authenticated user)
 *   - Order belongs to customer (customerUserId)
 * - Date should be in the future (validated in controller)
 *
 * Usage Example:
 * ```typescript
 * // Online order
 * const data = await request.validateUsing(orderValidator, {
 *   type: 'online',
 *   addressId: 'uuid-here',
 *   date: '2024-12-10'
 * })
 *
 * // offline order (staff creates for customer)
 * const data = await request.validateUsing(orderValidator, {
 *   type: 'offline',
 *   contactName: 'John Doe',
 *   contactPhone: '+62-812-3456-7890',
 *   customerUserId: 'customer-uuid-here',
 *   date: '2024-12-10'
 * })
 * ```
 */
export const orderValidator = vine.compile(
  vine.object({
    /**
     * Delivery address ID (only for online orders)
     * - Required when type === 'online'
     * - Must be null/undefined when type === 'offline'
     *
     * NOTE: Conditional validation is handled in controller
     * because VineJS doesn't support complex conditional rules well
     */
    addressId: vine.string().uuid(),

    /**
     * Scheduled completion/delivery date
     * Accepts ISO8601 format string from Inertia.js frontend
     * Inertia automatically serializes Date objects to ISO strings
     */
    date: vine.date({
      formats: ['iso8601', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'],
    }),
  })
)

/**
 * Shoe Schema
 *
 * Represents a single shoe submitted for cleaning.
 * Used as part of order creation (nested validation).
 *
 * Fields:
 * - brand: Manufacturer (Nike, Adidas, etc.)
 * - size: Shoe size (numeric)
 * - type: Style (sneakers, boots, etc.)
 * - material: Primary material (leather, canvas, suede, mesh)
 * - category: Usage type (sports, casual, formal)
 * - condition: Current state (good, worn, heavily stained)
 * - note: Optional special instructions
 * - services: Primary service ID (deep clean, basic wash, etc.)
 * - additionalServices: Array of add-on service IDs (waterproofing, etc.)
 *
 * Business Logic:
 * - Each shoe must have at least one primary service
 * - Additional services are optional
 * - Material is critical for determining cleaning method
 * - Condition helps set customer expectations
 *
 * Usage Example:
 * ```typescript
 * const shoeData = {
 *   brand: 'Nike',
 *   size: 42,
 *   type: 'sneakers',
 *   material: 'mesh',
 *   category: 'sports',
 *   condition: 'worn',
 *   note: 'Please be careful with the logo',
 *   services: 'service-uuid-here',
 *   additionalServices: ['waterproofing-uuid', 'deodorizing-uuid']
 * }
 * ```
 */
export const shoe = vine.object({
  /**
   * Shoe manufacturer/brand
   * Examples: Nike, Adidas, Puma, Converse, New Balance
   */
  brand: vine.string(),

  /**
   * Shoe size (numeric)
   * Can be in various formats (US, EU, UK)
   */
  size: vine.number(),

  /**
   * Shoe type/style
   * Examples: sneakers, boots, sandals, slip-ons, high-tops
   */
  type: vine.string(),

  /**
   * Primary material of the shoe
   * CRITICAL: Determines cleaning method and products
   * Examples: leather, canvas, suede, mesh, synthetic, nubuck
   *
   * Different materials require different treatments:
   * - Leather: needs conditioning after cleaning
   * - Suede: requires special brushes and cleaners
   * - Canvas: can handle more aggressive cleaning
   * - Mesh: delicate, needs gentle treatment
   */
  material: vine.string(),

  /**
   * Category/usage type
   * Examples: sports, casual, formal, outdoor, running, basketball
   * Helps determine expected wear patterns
   */
  category: vine.string(),

  /**
   * Current condition when received
   * Examples: good, worn, heavily stained, damaged, like new
   * Used for:
   * - Setting customer expectations
   * - Pricing adjustments
   * - Before/after comparison
   * - Dispute prevention
   */
  condition: vine.string(),

  /**
   * Optional special instructions or notes
   * Examples:
   * - "Please be careful with the logo"
   * - "There's a small tear on the side"
   * - "Rush service needed"
   */
  note: vine.string().optional(),

  /**
   * Primary service ID (UUID)
   * Must be a valid service from services table
   * Required - customer must choose at least one cleaning service
   */
  services: vine.string(),

  /**
   * Additional service IDs (array of UUIDs)
   * Optional add-on services like:
   * - Waterproofing
   * - Deodorizing
   * - Color restoration
   * - Lace replacement
   */
  additionalServices: vine.array(vine.string()).optional(),
})

/**
 * Order with Shoes Validator
 *
 * Validates complete order creation request including shoes.
 * Combines order validation with nested shoe validation.
 *
 * Usage Example:
 * ```typescript
 * const data = await request.validateUsing(orderWithShoesValidator, {
 *   type: 'online',
 *   addressId: 'address-uuid',
 *   date: '2024-12-10',
 *   shoes: [
 *     {
 *       brand: 'Nike',
 *       size: 42,
 *       type: 'sneakers',
 *       material: 'mesh',
 *       category: 'sports',
 *       condition: 'worn',
 *       services: 'service-uuid',
 *       additionalServices: ['waterproofing-uuid']
 *     },
 *     {
 *       brand: 'Adidas',
 *       size: 43,
 *       type: 'sneakers',
 *       material: 'leather',
 *       category: 'casual',
 *       condition: 'good',
 *       services: 'service-uuid'
 *     }
 *   ]
 * })
 * ```
 */
export const orderWithShoesValidator = vine.compile(
  vine.object({
    type: vine.enum(['online', 'offline']),
    addressId: vine.string().uuid(),
    contactName: vine.string(),
    contactPhone: vine.string(),
    date: vine.date({
      formats: ['iso8601', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss'],
    }),

    /**
     * Array of shoes to be cleaned
     * Customer can submit multiple shoes in one order
     * Each shoe can have different services
     */
    totalShoes: vine.number(),
    shoes: vine.array(shoe),
  })
)

/**
 * Photo Upload Validator
 *
 * Validates photo uploads during order processing.
 * Photos are taken at different stages: pickup, check (inspection), delivery.
 *
 * Fields:
 * - stage: When photo was taken (pickup, check, delivery)
 * - note: Optional description of what the photo shows
 *
 * File validation (image) should be handled separately in controller
 * using request.file() method.
 *
 * Usage Example:
 * ```typescript
 * const data = await request.validateUsing(photoUploadValidator, {
 *   stage: 'pickup',
 *   note: 'Heavy staining on toe area'
 * })
 *
 * const photo = request.file('photo', {
 *   size: '2mb',
 *   extnames: ['jpg', 'jpeg', 'png']
 * })
 * ```
 */
export const photoUploadValidator = vine.compile(
  vine.object({
    /**
     * Stage when photo was taken
     * Values: 'pickup', 'check', 'delivery'
     * See OrderPhotoStages enum for all possible values
     */
    stage: vine.enum(Object.values(OrderPhotoStages)),

    /**
     * Optional note about the photo
     * Examples:
     * - "Visible scuff marks on heel"
     * - "Deep stain requires special treatment"
     * - "Before and after comparison"
     */
    note: vine.string().optional(),
  })
)
