import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser } from '#tests/utils/test_helpers'
import PasswordResetToken from '#models/password_reset_token'

test.group('Auth: GET pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /login returns auth/login for guests', async ({ client }) => {
    const response = await client.get('/login').withInertia()

    response.assertInertiaComponent('auth/login')
  })

  test('GET /register returns auth/register for guests', async ({ client }) => {
    const response = await client.get('/register').withInertia()

    response.assertInertiaComponent('auth/register')
  })

  test('GET /forgot-password returns auth/forgot-password for guests', async ({ client }) => {
    const response = await client.get('/forgot-password').withInertia()

    response.assertInertiaComponent('auth/forgot-password')
  })

  test('GET /login redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.get('/login').loginAs(user).withInertia()

    response.assertInertiaComponent('user/order/create')
  })

  test('GET /register redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.get('/register').loginAs(user).withInertia()

    response.assertRedirectsTo('/order')
  })

  test('GET /forgot-password redirects to /order when already logged in', async ({ client }) => {
    const user = await createUser()

    const response = await client.get('/forgot-password').loginAs(user).withInertia()

    response.assertRedirectsTo('/order')
  })

  test('GET /reset-password/:token redirects to /order when already logged in', async ({
    client,
  }) => {
    const user = await createUser()

    const response = await client.get('/reset-password/sometoken').loginAs(user).withInertia()

    response.assertRedirectsTo('/order')
  })
})

test.group('Auth: validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /register fails with invalid email', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'invalid-email',
        name: 'Valid Name',
        password: 'Secret123',
        password_confirmation: 'Secret123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: { email: 'Alamat email harus berupa alamat email yang valid' },
      },
    })
  })

  test('POST /register fails with invalid password too short', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'valid@email.com',
        name: 'Valid Name',
        password: 'short',
        password_confirmation: 'short',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: { password: 'Kata sandi harus memiliki minimal 8 karakter' },
      },
    })
  })

  test('POST /register fails with invalid password too long', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'valid@email.com',
        name: 'Valid Name',
        password: 'veryverylongpassword12',
        password_confirmation: 'veryverylongpassword12',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: { password: 'Kata sandi harus memiliki maksimal 16 karakter' },
      },
    })
  })

  test('POST /register fails with invalid password mismatch', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'valid@email.com',
        name: 'Valid Name',
        password: 'Invalid123',
        password_confirmation: 'Invalid321',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi tidak cocok',
        },
      },
    })
  })

  test('POST /register fails with invalid password format (contains underscore)', async ({
    client,
  }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'valid@email.com',
        name: 'Valid Name',
        password: 'invalid_123',
        password_confirmation: 'invalid_321',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi harus memiliki 8-16 karakter dan berisi huruf serta angka',
        },
      },
    })
  })

  test('POST /register fails with invalid name format (contains underscore)', async ({
    client,
  }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'valid@email.com',
        name: 'Invalid_Name',
        password: 'Secret123',
        password_confirmation: 'Secret123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: { name: 'Nama hanya boleh berisi huruf, spasi, dan tanda hubung' },
      },
    })
  })

  test('POST /register fails when email already exists', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: user.email,
        name: 'Valid Name',
        password: 'Secret123',
        password_confirmation: 'Secret123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { email: 'Alamat email sudah terdaftar' } },
    })
  })

  test('POST /login fails with invalid email', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: 'invalid-email',
        password: 'Secret123',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          email: 'Alamat email harus berupa alamat email yang valid',
        },
      },
    })
  })

  test('POST /login fails with password too short', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: 'valid-login@example.com',
        password: 'short',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { password: 'Kata sandi harus memiliki minimal 8 karakter' } },
    })
  })

  test('POST /login fails with password too long', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: 'valid-login@example.com',
        password: 'averyveryverylongpw',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { password: 'Kata sandi harus memiliki maksimal 16 karakter' } },
    })
  })

  test('POST /login fails with invalid password format', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: 'valid-login@example.com',
        password: 'onlyletters',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi harus memiliki 8-16 karakter dan berisi huruf serta angka',
        },
      },
    })
  })

  test('POST /login fails when remember_me is not boolean', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: 'valid-login@example.com',
        password: 'Secret123',
        remember_me: 'yes',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: { remember_me: 'remember_me harus berupa nilai benar atau salah' },
      },
    })
  })

  test('POST /login fails when credentials not match', async ({ client }) => {
    const user = await createUser({ email: 'test@example.com', password: 'Secret123' })

    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: user.email,
        password: 'WrongPass123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          email: 'Alamat email atau kata sandi salah.',
          password: 'Alamat email atau kata sandi salah.',
        },
      },
    })
  })

  test('POST /forgot-password fails with invalid email', async ({ client }) => {
    const response = await client
      .post('/forgot-password')
      .header('referer', '/forgot-password')
      .form({
        email: 'not-an-email',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { email: 'Alamat email harus berupa alamat email yang valid' } },
    })
  })

  test('POST /reset-password/:token fails with password too short', async ({ client }) => {
    const user = await createUser()
    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client
      .post(`/reset-password/${token.token}`)
      .header('referer', `/reset-password/${token.token}`)
      .form({
        password: 'short',
        password_confirmation: 'short',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { password: 'Kata sandi harus memiliki minimal 8 karakter' } },
    })
  })

  test('POST /reset-password/:token fails with password too long', async ({ client }) => {
    const user = await createUser()
    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client
      .post(`/reset-password/${token.token}`)
      .header('referer', `/reset-password/${token.token}`)
      .form({
        password: 'veryverylongpassword12',
        password_confirmation: 'veryverylongpassword12',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: { validation_errors: { password: 'Kata sandi harus memiliki maksimal 16 karakter' } },
    })
  })

  test('POST /reset-password/:token fails with password_confirmation mismatch', async ({
    client,
  }) => {
    const user = await createUser()
    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client
      .post(`/reset-password/${token.token}`)
      .header('referer', `/reset-password/${token.token}`)
      .form({
        password: 'Valid123',
        password_confirmation: 'Invalid321',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi tidak cocok',
        },
      },
    })
  })

  test('POST /reset-password/:token fails with password invalid format (contain underscore)', async ({
    client,
  }) => {
    const user = await createUser()
    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client
      .post(`/reset-password/${token.token}`)
      .header('referer', `/reset-password/${token.token}`)
      .form({
        password: 'invalid_123',
        password_confirmation: 'invalid_123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi harus memiliki 8-16 karakter dan berisi huruf serta angka',
        },
      },
    })
  })
})

test.group('Auth: login/logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /register succeeds and redirects to /order', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Secret123',
        password_confirmation: 'Secret123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/order')
  })

  test('POST /login succeeds and redirects to user /order page', async ({ client }) => {
    const user = await createUser({ email: 'test@example.com', password: 'Secret123' })

    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: user.email,
        password: 'Secret123',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/order')
  })

  test('POST /login fails with wrong credentials and redirects to /login', async ({ client }) => {
    const user = await createUser({ email: 'test@example.com', password: 'Secret123' })

    const response = await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: user.email,
        password: 'WrongPassword123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/login')
  })

  test('POST /logout logs out and redirects to home', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/logout')
      .header('referer', '/order')
      .loginAs(user)
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/')
  })
})

test.group('Auth: reset password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /reset-password/:token returns invalid-token component when token invalid', async ({
    client,
  }) => {
    const response = await client.get('/reset-password/some-invalid-token').withInertia()

    response.assertInertiaComponent('errors/invalid-token')
  })

  test('GET /reset-password/:token returns reset page when token valid', async ({ client }) => {
    const user = await createUser()

    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client.get(`/reset-password/${token.token}`).withInertia()

    response.assertInertiaComponent('auth/reset-password')
  })

  test('POST /forgot-password succeeds with existing email', async ({ client }) => {
    const user = await createUser({ email: 'existing@example.com' })

    const response = await client
      .post('/forgot-password')
      .header('referer', '/forgot-password')
      .form({
        email: user.email,
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/forgot-password')
  })

  test('POST /reset-password/:token succeeds with valid token and password', async ({ client }) => {
    const user = await createUser()
    const trx = await db.transaction()
    const token = await PasswordResetToken.generateToken(user, trx)
    await trx.commit()

    const response = await client
      .post(`/reset-password/${token.token}`)
      .header('referer', `/reset-password/${token.token}`)
      .form({
        password: 'newvalid123',
        password_confirmation: 'newvalid123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/login')
  })
})
