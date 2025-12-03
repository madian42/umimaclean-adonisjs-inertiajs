/**
 * Order Status Enum
 *
 * Defines all possible statuses for an order throughout its lifecycle.
 * Applies to both online orders (with delivery) and offline orders (customer drop-off/pickup).
 *
 * Status Flow:
 * 1. WAITING_DEPOSIT - Order created, waiting for down payment (online orders)
 * 2. PICKUP_SCHEDULED - Payment received, pickup scheduled (online orders only)
 * 3. PICKUP_PROGRESS - Staff en route to pickup location (online orders only)
 * 4. INSPECTION - Shoes received, being inspected and assessed
 * 5. WAITING_PAYMENT - Inspection complete, waiting for full payment
 * 6. IN_PROCESS - Full payment received, shoes being cleaned
 * 7. PROCESS_COMPLETED - Cleaning completed, ready for delivery/pickup
 * 8. DELIVERY - Out for delivery (online) or ready for customer pickup (offline)
 * 9. COMPLETED - Order completed, shoes delivered/picked up
 * 10. CANCELLED - Order cancelled by user or staff
 */
enum OrderStatuses {
  WAITING_DEPOSIT = 'waiting_deposit',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKUP_PROGRESS = 'pickup_progress',
  INSPECTION = 'inspection',
  WAITING_PAYMENT = 'waiting_payment',
  IN_PROCESS = 'in_process',
  PROCESS_COMPLETED = 'process_completed',
  DELIVERY = 'delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export default OrderStatuses
