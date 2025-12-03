/**
 * Order Action Enum
 *
 * Defines all possible actions that staff can perform on an order.
 * These actions track staff workflow and prevent concurrent work on the same order stage.
 *
 * Action Types:
 * 1. ATTEMPT_* - Staff claims a stage to work on it (locks the stage to that staff member)
 * 2. *_ACTION - Staff completes the stage (unlocks and marks as done)
 * 3. RELEASE_* - Staff releases a claimed stage without completing it (unlocks for others)
 *
 * Business Logic:
 * - Staff must ATTEMPT before performing the actual action
 * - Only the staff who ATTEMPTED can complete or RELEASE
 * - Prevents multiple staff from working on the same stage simultaneously
 * - Used in conjunction with StageMiddleware to enforce workflow
 *
 * Stage Workflow:
 * PICKUP (Online orders only):
 *   - ATTEMPT_PICKUP → staff claims pickup task
 *   - PICKUP → staff successfully picks up shoes from customer
 *   - RELEASE_PICKUP → staff releases pickup task (if unable to complete)
 *
 * CHECK (All orders):
 *   - ATTEMPT_CHECK → staff claims inspection task
 *   - CHECK → staff completes inspection and assessment
 *   - RELEASE_CHECK → staff releases inspection task
 *
 * DELIVERY (All orders):
 *   - ATTEMPT_DELIVERY → staff claims delivery task
 *   - DELIVERY → staff successfully delivers/hands over shoes to customer
 *   - RELEASE_DELIVERY → staff releases delivery task
 */
enum OrderActions {
  // Completion actions - marks stage as done
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  CHECK = 'CHECK',

  // Attempt actions - claims stage for work
  ATTEMPT_PICKUP = 'ATTEMPT_PICKUP',
  ATTEMPT_DELIVERY = 'ATTEMPT_DELIVERY',
  ATTEMPT_CHECK = 'ATTEMPT_CHECK',

  // Release actions - unclaims stage without completion
  RELEASE_PICKUP = 'RELEASE_PICKUP',
  RELEASE_DELIVERY = 'RELEASE_DELIVERY',
  RELEASE_CHECK = 'RELEASE_CHECK',
}

export default OrderActions
