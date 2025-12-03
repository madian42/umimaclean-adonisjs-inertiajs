/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import './auth_routes.js'
import './staff_routes.js'
import './user_routes.js'
import transmit from '@adonisjs/transmit/services/main'
import { middleware } from './kernel.js'
import { throttle } from './limiter.js'
import Service from '#models/service'

const HealthChecksController = () => import('#controllers/health_checks_controller')

transmit.registerRoutes((route) => {
  // Ensure you are authenticated to register your client
  if (route.getPattern() === '__transmit/events') {
    route.middleware(middleware.auth())
    return
  }

  // Add a throttle middleware to other transmit routes
  route.use(throttle)
})

router
  .get('/', async ({ inertia }) => {
    const services = await Service.query().orderBy('price', 'desc')

    return inertia.render('home', { services })
  })
  .as('home')
  .use(middleware.guest())

router.get('/health', [HealthChecksController])
