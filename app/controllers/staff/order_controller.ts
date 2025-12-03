import OrderStatuses from '#enums/order_status_enum'
import Order from '#models/order'
import OrderStatus from '#models/order_status'
import User from '#models/user'
import { orderWithShoesValidator } from '#validators/order_validator'
import { createofflineAddress } from '#utils/walk_in_address'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

/**
 * OrderController (Staff)
 *
 * Handles OFFLINE/offline order creation by staff members.
 * Staff creates orders on behalf of customers who visit the store.
 *
 * Business Logic:
 * - ALL orders created here are offline type (offline)
 * - Staff member creates order for customer at the store
 * - Address is created with store location + customer contact info
 * - Address belongs to staff, order belongs to customer
 * - Customers drop off shoes at store and pick up when ready
 * - All orders start with WAITING_DEPOSIT status
 *
 * Routes:
 * - GET /staff/orders/create - Show order creation form
 * - POST /staff/orders - Create new offline order
 * - GET /staff/orders - List all offline orders
 * - GET /staff/orders/:number - Show order details
 */
export default class OrderController {
  /**
   * Show offline order creation form
   *
   * Business Logic:
   * - Staff can search for existing customers by phone/email
   * - Or create order for new customer
   * - Form collects customer contact info (name, phone)
   * - No address selection needed (customer is at store)
   *
   * @returns Inertia page with customer search form
   */
  async create({ inertia }: HttpContext) {
    // Fetch list of customers for quick selection
    const customers = await User.query()
      .where('role', 'customer')
      .orderBy('created_at', 'desc')
      .limit(100)

    return inertia.render('staff/order/create', {
      customers: customers,
    })
  }

  /**
   * Create a new offline order
   *
   * Business Logic:
   * 1. Validates order data (customer info, contact details, date)
   * 2. Creates address with STORE location + CUSTOMER contact info
   * 3. Address belongs to STAFF member (authenticated user)
   * 4. Creates order record belonging to CUSTOMER
   * 5. Creates initial status (WAITING_DEPOSIT)
   * 6. Redirects to order details page
   *
   * IMPORTANT:
   * - type is ALWAYS 'offline' (no conditional logic)
   * - customerUserId is REQUIRED (staff must specify which customer)
   * - contactName and contactPhone are REQUIRED (customer contact info)
   * - No addressId from request (created automatically)
   *
   * Transaction Safety:
   * - Uses database transaction to ensure atomicity
   * - If any step fails, entire order creation is rolled back
   *
   * @throws Error if validation fails or database operation fails
   * @returns Redirect to order details page on success
   */
  async store({ request, response, session, auth }: HttpContext) {
    const staffMember = auth.getUserOrFail()
    const payload = await request.validateUsing(orderWithShoesValidator)

    // Create offline order with transaction
    const trx = await db.transaction()
    try {
      // Create address with STORE location + CUSTOMER contact info
      // Address belongs to STAFF member, contains customer's contact info
      const offlineAddress = await createofflineAddress(
        staffMember.id, // Address belongs to staff member
        payload.contactName, // Customer's name
        payload.contactPhone, // Customer's phone
        'offline order - customer at store'
      )

      // Create the order
      // Order belongs to CUSTOMER, uses offline address
      const order = await Order.create(
        {
          addressId: offlineAddress.id, // Store location with customer contact
          type: 'offline', // ALWAYS offline for staff-created orders
          date: payload.date,
          userId: staffMember.id, // Order belongs to customer
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
      return response.redirect().toRoute('staff.orders.show', {
        id: order.number,
      })
    } catch (error) {
      await trx.rollback()

      logger.error(`Error creating offline order: ${error.message}`)
      session.flash('general_errors', 'Gagal membuat pesanan offline')
      return response.redirect().back()
    }
  }

  /**
   * List all offline orders with filtering and pagination
   *
   * Business Logic:
   * - Shows ALL offline orders (not filtered by staff member)
   * - Supports search by order number, customer name, phone
   * - Supports filtering by status (active/completed)
   * - Paginates results (10 per page)
   * - Preloads customer, address, and statuses for display
   *
   * Query Parameters:
   * - page: Page number (default: 1)
   * - search: Search term (optional)
   * - status: 'active' or 'completed' (default: 'active')
   *
   * @returns Inertia page with paginated orders and filters
   */
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')
    const status = request.input('status', 'active')

    // Build the base query - only offline orders
    const query = Order.query()
      .preload('user') // Customer who owns the order
      .preload('address') // Store location with customer contact
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc')
      })
      .where('type', 'offline') // ONLY offline orders

    // Apply search filter
    if (search) {
      query.where((builder) => {
        builder
          .where('number', 'like', `%${search}%`)
          .orWhereHas('user', (userBuilder) => {
            userBuilder.where('name', 'like', `%${search}%`).orWhere('email', 'like', `%${search}%`)
          })
          .orWhereHas('address', (addressBuilder) => {
            addressBuilder
              .where('name', 'like', `%${search}%`)
              .orWhere('phone', 'like', `%${search}%`)
          })
      })
    }

    // Apply status filter
    if (status === 'completed') {
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .where('name', OrderStatuses.COMPLETED)
          .orWhere('name', OrderStatuses.CANCELLED)
      })
    } else if (status === 'active') {
      query.whereHas('statuses', (statusBuilder) => {
        statusBuilder
          .whereNot('name', OrderStatuses.COMPLETED)
          .andWhereNot('name', OrderStatuses.CANCELLED)
      })
    }

    const orders = await query.orderBy('created_at', 'desc').paginate(page, 10)

    return inertia.render('staff/order/index', {
      orders: orders.serialize(),
      filters: {
        search,
        status,
        page,
      },
    })
  }

  /**
   * Show offline order details
   *
   * Business Logic:
   * - Displays full order information
   * - Shows customer info
   * - Shows status history
   * - Shows uploaded photos
   * - Shows transaction/payment information
   * - Accessible by all staff members
   *
   * @param params.id - Order number (e.g., ORD241201-001)
   * @returns Inertia page with order details
   * @throws 404 if order not found or not offline type
   */
  async show({ params, inertia, session, response }: HttpContext) {
    const orderNumber = params.id

    // Fetch order with all related data
    const order = await Order.query()
      .preload('user') // Customer who owns the order
      .preload('address') // Store location with customer contact
      .preload('statuses', (statusQuery) => {
        statusQuery.orderBy('updated_at', 'desc')
      })
      .preload('photos')
      .preload('transactions')
      .where('number', orderNumber)
      .andWhere('type', 'offline') // Security: only offline orders
      .first()

    if (!order) {
      session.flash('general_errors', 'Pesanan offline tidak ditemukan.')
      return response.redirect().toRoute('staff.orders.index')
    }

    return inertia.render('staff/order/show', {
      order,
    })
  }
}
