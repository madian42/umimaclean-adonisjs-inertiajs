/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const ForgotPasswordController = () => import('#controllers/auth/forgot_password_controller')
const LoginController = () => import('#controllers/auth/login_controller')
const LogoutController = () => import('#controllers/auth/logout_controller')
const RegisterController = () => import('#controllers/auth/register_controller')
const ResetPasswordController = () => import('#controllers/auth/reset_password_controller')
const SocialController = () => import('#controllers/auth/social_controller')

router
  .group(() => {
    router.get('/login', [LoginController, 'show']).as('login.show')
    router.post('/login', [LoginController]).as('login.handle')

    router.get('/register', [RegisterController, 'show']).as('register.show')
    router.post('/register', [RegisterController]).as('register.handle')

    router.get('/forgot-password', [ForgotPasswordController, 'show']).as('forgot_password.show')
    router.post('/forgot-password', [ForgotPasswordController]).as('forgot_password.handle')

    router
      .get('/reset-password/:token', [ResetPasswordController, 'show'])
      .as('reset_password.show')
    router.post('/reset-password/:token', [ResetPasswordController]).as('reset_password.handle')

    router.get('/auth/google/redirect', [SocialController, 'redirect']).as('social.show')
    router.get('/auth/google/callback', [SocialController, 'callback']).as('social.callback')
  })
  .use(middleware.guest())

router.post('/logout', [LogoutController]).as('logout.handle').use(middleware.auth())
