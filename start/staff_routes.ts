/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const TaskController = () => import('#controllers/staff/task_controller')
const StaffProfileController = () => import('#controllers/staff/profile_controller')
const PickupController = () => import('#controllers/staff/pickup_controller')
const InspectionController = () => import('#controllers/staff/inspection_controller')
const DeliveryController = () => import('#controllers/staff/delivery_controller')
const OrderController = () => import('#controllers/staff/order_controller')

router
  .group(() => {
    router.get('/staff/tasks', [TaskController, 'index']).as('staff.tasks')

    // offline/Offline Order Management
    router.get('/staff/orders/create', [OrderController, 'create']).as('staff.orders.create')
    router.post('/staff/orders', [OrderController, 'store']).as('staff.orders.store')
    router.get('/staff/orders', [OrderController, 'index']).as('staff.orders.index')
    router.get('/staff/orders/:id', [OrderController, 'show']).as('staff.orders.show')

    router.get('/staff/pickup/:id', [PickupController, 'index']).as('staff.pickup')
    router.post('/staff/pickup/:id/claim', [PickupController]).as('staff.pickup.handle')
    router
      .post('/staff/pickup/:id/complete', [PickupController, 'complete'])
      .as('staff.pickup.complete')
    router.post('/staff/pickup/:id/cancel', [PickupController, 'cancel']).as('staff.pickup.cancel')

    router.get('/staff/inspection/:id', [InspectionController, 'index']).as('staff.inspection')
    router.post('/staff/inspection/:id/claim', [InspectionController]).as('staff.inspection.handle')
    router
      .post('/staff/inspection/:id/complete', [InspectionController, 'complete'])
      .as('staff.inspection.complete')
    router
      .post('/staff/inspection/:id/cancel', [InspectionController, 'cancel'])
      .as('staff.inspection.cancel')

    router.get('/staff/delivery/:id', [DeliveryController, 'index']).as('staff.delivery')
    router.post('/staff/delivery/:id/claim', [DeliveryController]).as('staff.delivery.handle')
    router
      .post('/staff/delivery/:id/complete', [DeliveryController, 'complete'])
      .as('staff.delivery.complete')
    router
      .post('/staff/delivery/:id/cancel', [DeliveryController, 'cancel'])
      .as('staff.delivery.cancel')
  })
  .use([middleware.auth(), middleware.role({ role: 'staff' }), middleware.stage()])

router
  .group(() => {
    router.get('/staff/profile', [StaffProfileController, 'index']).as('staff.profile.show')
    router
      .post('/staff/profile/change-password', [StaffProfileController, 'updatePassword'])
      .as('staff.profile.change_password.handle')
  })
  .use([middleware.auth(), middleware.role({ role: 'staff' })])
