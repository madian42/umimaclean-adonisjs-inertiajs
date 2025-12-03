import OrderStatuses from '#enums/order_status_enum'
import Address from '#models/address'
import Order from '#models/order'
import OrderStatus from '#models/order_status'
import { orderValidator } from '#validators/order_validator'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

/**
 * OrderController (User)
 *
 * Handles ONLINE order creation and management for customers.
 * Users create their own orders for pickup and delivery service.
 *
 * Business Logic:
 * - ALL orders created here are ONLINE type (with delivery)
 * - Users must have created address before placing order
 * - Shoes are picked up from customer's address
 * - Shoes are cleaned and delivered back to same address
 * - Address must be within service area (validated)
 * - All orders start with WAITING_DEPOSIT status
 * - Orders are identified by unique number (ORD{YY}{MM}{DD}-{NNN})
 *
 * Routes:
 * - GET /order - Show order creation form
 * - POST /order - Create new online order
 * - GET /orders - List user's orders
 * - GET /orders/:number - Show order details
 * - GET /orders/status/:number - Show order status history
 */
export default class OrderController {
  /**
   * Show online order creation form
   *
   * Business Logic:
   * - Fetches user's addresses to select delivery location
   * - User MUST have created address first (required for online orders)
   * - Address must be within service area
   * - If user has no addresses, redirect to address creation
   *
   * @returns Inertia page with addresses list
   */
  async create({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    // Fetch user's addresses
    const address = await Address.query().where('user_id', user.id).first()

    return inertia.render('user/order/create', {
      addressId: address?.id,
    })
  }

  /**
   * Create a new ONLINE order
   *
   * Business Logic:
   * 1. Validates order data (addressId, date)
   * 2. Validates addressId is provided and belongs to user
   * 3. Validates address is within service area
   * 4. Creates order record
   * 5. Creates initial status (WAITING_DEPOSIT)
   * 6. Redirects to order details page
   *
   * IMPORTANT:
   * - type is ALWAYS 'online' (no conditional logic)
   * - addressId is REQUIRED (user must select delivery address)
   * - Address must belong to authenticated user
   * - Address must be within service area
   *
   * Transaction Safety:
   * - Uses database transaction to ensure atomicity
   * - If any step fails, entire order creation is rolled back
   *
   * @throws Error if validation fails or database operation fails
   * @returns Redirect to order details page on success
   */
  async store({ request, response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(orderValidator)

    // Validate that address exists and belongs to user
    const address = await Address.query()
      .where('id', payload.addressId)
      .andWhere('user_id', user.id)
      .first()

    if (!address) {
      session.flash('general_errors', 'Alamat tidak ditemukan atau bukan milik Anda')
      return response.redirect().back()
    }

    // Create online order with transaction
    const trx = await db.transaction()
    try {
      // Create the order
      // Order belongs to authenticated user, uses their selected address
      const order = await Order.create(
        {
          addressId: payload.addressId, // User's delivery address
          type: 'online', // ALWAYS online for user-created orders
          date: payload.date,
          userId: user.id, // Order belongs to authenticated user
        },
        { client: trx }
      )

      // Create initial status (all orders start with WAITING_DEPOSIT)
      await OrderStatus.create(
        {
          orderId: order.id,
          name: OrderStatuses.WAITING_DEPOSIT,
        },
        { client: trx }
      )

      await trx.commit()

      // Redirect to order details page
      return response.redirect().toRoute('orders.show', {
        id: order.number,
      })
    } catch (error) {
      await trx.rollback()

      logger.error(`Error creating online order: ${error.message}`)
      session.flash('general_errors', 'Gagal membuat pesanan')
      return response.redirect().back()
    }
  }

  /**
   * List user's orders with filtering and pagination
   *
   * Business Logic:
   * - Shows only ONLINE orders belonging to authenticated user
   * - Supports search by order number, address name, phone, street
   * - Supports filtering by status (active/completed)
   * - Paginates results (10 per page)
   * - Preloads address and statuses for display
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - search: Search term (optional)
   * - status: 'active' or 'completed' (default: 'active')
   *
   * Status Filtering:
   * - 'active': Orders that are NOT completed or cancelled
   * - 'completed': Orders with COMPLETED or CANCELLED status
   *
   * @returns Inertia page with paginated orders and filters
   */
  async index({ request, auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get query parameters
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', 'active') // 'completed', 'active'

    // Build the base query - only user's online orders
    const query = Order.query()
      .preload('address') // User's delivery address
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })
      .where('user_id', user.id) // Only user's orders
      .where('type', 'online') // Only online orders

    // Apply search filter across multiple fields
    if (search) {
      query.where((builder) => {
        builder
          .where('number', 'like', `%${search}%`) // Search by order number
          .orWhereHas('address', (addressBuilder) => {
            // Search by address details
            addressBuilder
              .where('name', 'like', `%${search}%`)
              .orWhere('phone', 'like', `%${search}%`)
              .orWhere('street', 'like', `%${search}%`)
          })
      })
    }

    // Apply status filter
    if (status === 'completed') {
      // Show only completed or cancelled orders
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .where('name', OrderStatuses.COMPLETED)
          .orWhere('name', OrderStatuses.CANCELLED)
      })
    } else if (status === 'active') {
      // Show orders that are in progress (not completed or cancelled)
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .whereNot('name', OrderStatuses.COMPLETED)
          .andWhereNot('name', OrderStatuses.CANCELLED)
      })
    }

    // Execute query with pagination
    const orders = await query.orderBy('created_at', 'desc').paginate(page, 10)

    return inertia.render('user/order/index', {
      orders: orders.serialize(),
      filters: {
        search,
        status,
        page,
      },
    })
  }

  /**
   * Show order details
   *
   * Business Logic:
   * - Displays full order information
   * - Shows delivery address
   * - Shows status history
   * - Shows uploaded photos (at pickup, inspection, delivery stages)
   * - Shows transaction/payment information
   * - Only accessible by order owner
   *
   * @param params.id - Order number (e.g., ORD241201-001)
   * @returns Inertia page with order details
   * @throws 404 if order not found or doesn't belong to user
   */
  async show({ params, inertia, auth, session, response }: HttpContext) {
    const orderNumber = params.id
    const user = auth.getUserOrFail()

    // Fetch order with all related data
    const order = await Order.query()
      .preload('address') // User's delivery address
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc') // Latest status first
      })
      .preload('photos') // Photos taken at pickup/check/delivery
      .preload('transactions') // Payment transactions
      .where('number', orderNumber)
      .andWhere('user_id', user.id) // Security: ensure order belongs to user
      .andWhere('type', 'online') // Security: only online orders
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('orders.index')
    }

    return inertia.render('user/order/show', {
      order,
    })
  }

  /**
   * Show order status history
   *
   * Business Logic:
   * - Displays chronological history of all status changes
   * - Each status change may have an optional note
   * - Useful for tracking order progress
   * - Only accessible by order owner
   *
   * Status Flow (typical for online orders):
   * 1. WAITING_DEPOSIT - Order created, awaiting down payment
   * 2. PICKUP_SCHEDULED - Payment received, pickup scheduled
   * 3. PICKUP_PROGRESS - Staff on the way to pickup location
   * 4. INSPECTION - Shoes being inspected at store
   * 5. WAITING_PAYMENT - Full payment required
   * 6. IN_PROCESS - Shoes being cleaned
   * 7. PROCESS_COMPLETED - Cleaning done
   * 8. DELIVERY - Out for delivery
   * 9. COMPLETED - Order successfully completed
   *
   * @param params.id - Order number
   * @returns Inertia page with status history
   * @throws 404 if order not found or doesn't belong to user
   */
  async status({ params, inertia, auth, session, response }: HttpContext) {
    const orderNumber = params.id
    const user = auth.getUserOrFail()

    // Fetch order to verify ownership
    const order = await Order.query()
      .where('number', orderNumber)
      .andWhere('user_id', user.id) // Security: ensure order belongs to user
      .andWhere('type', 'online') // Security: only online orders
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan tidak ditemukan.')
      return response.redirect().toRoute('orders.index')
    }

    // Fetch all statuses for this order
    const statuses = await OrderStatus.query()
      .where('order_id', order.id)
      .orderBy('updated_at', 'desc') // Latest status first

    return inertia.render('user/order/status', {
      statuses,
      order,
    })
  }
}
