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

const ProfileController = () => import('#controllers/user/profile_controller')
const AddressController = () => import('#controllers/user/address_controller')
const OrderController = () => import('#controllers/user/order_controller')
const DownPaymentController = () => import('#controllers/user/transactions/down_payment_controller')
const FullPaymentController = () => import('#controllers/user/transactions/full_payment_controller')
const NotificationTransactionController = () =>
  import('#controllers/user/transactions/notification_transaction_controller')
const DownloadTransactionController = () =>
  import('#controllers/user/transactions/download_controller')

router
  .group(() => {
    router.get('/order', [OrderController, 'create']).as('orders.create')
    router.post('/order', [OrderController, 'store']).as('orders.store')

    router.get('/orders', [OrderController, 'index']).as('orders.index')
    router.get('/orders/:id', [OrderController, 'show']).as('orders.show')
    router.get('/orders/:id/status', [OrderController, 'status']).as('orders.status')
  })
  .use([middleware.auth(), middleware.role({ role: 'user' })])

router
  .group(() => {
    router.get('/profile', [ProfileController, 'index']).as('profile.show')
    router.post('/profile', [ProfileController, 'updateName']).as('profile.update')
    router
      .post('/profile/change-password', [ProfileController, 'updatePassword'])
      .as('profile.change_password.handle')

    router.get('/profile/address', [AddressController, 'index']).as('profile.address')
    router.put('/profile/address', [AddressController, 'store']).as('profile.address.handle')
  })
  .use([middleware.auth(), middleware.role({ role: 'user' })])

router
  .group(() => {
    router
      .get('/transactions/down-payment/:id', [DownPaymentController, 'index'])
      .as('transactions.dp.show')
    router
      .post('/transactions/down-payment/:id', [DownPaymentController])
      .as('transactions.dp.handle')

    router
      .get('/transactions/full-payment/:id', [FullPaymentController, 'index'])
      .as('transactions.full.show')
    router
      .post('/transactions/full-payment/:id', [DownPaymentController])
      .as('transactions.full.handle')

    router.get('/download-qris/:qr/:id', [DownloadTransactionController]).as('download.qris')
  })
  .use([middleware.auth(), middleware.role({ role: 'user' })])

router
  .post('/transaction/callback', [NotificationTransactionController])
  .as('transactions.callback')
