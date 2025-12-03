/**
 * Order Photo Stage Enum
 *
 * Defines the stages at which staff can upload photos during order processing.
 * Photos serve as evidence and documentation of the order's progress.
 *
 * Stages:
 * 1. PICKUP - Photos taken when shoes are picked up from customer (online orders)
 *             or received at store (offline orders). Shows condition upon receipt.
 * 2. CHECK - Photos taken during inspection/assessment phase. Documents any damage,
 *            stains, or special conditions found during inspection.
 * 3. DELIVERY - Photos taken when shoes are delivered back to customer (online orders)
 *               or handed over at store (offline orders). Shows final cleaned condition.
 *
 * Business Logic:
 * - Each stage can have multiple photos
 * - Photos are linked to staff member who uploaded them
 * - Photos can include optional notes for additional context
 * - Used for quality control, dispute resolution, and customer transparency
 */
enum OrderPhotoStages {
  PICKUP = 'pickup',
  CHECK = 'check',
  DELIVERY = 'delivery',
}

export default OrderPhotoStages
