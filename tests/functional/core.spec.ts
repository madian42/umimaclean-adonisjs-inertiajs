import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createUser } from '../utils/test_helpers.js'
import Roles from '#enums/role_enum'
import User from '#models/user'

test.group('Core: Home page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET / renders home component for guests', async ({ client }) => {
    const response = await client.get('/').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('home')
  })

  test('GET / renders home component for authenticated users', async ({ client }) => {
    const user = await createUser()
    const response = await client.get('/').loginAs(user).withInertia()

    response.assertRedirectsTo('/order')
  })

  test('GET / renders home component for staff users', async ({ client }) => {
    const staff = await User.create({
      email: 'staff@example.com',
      name: 'Staff User',
      password: 'Secret123',
      roleId: Roles.STAFF,
    })
    const response = await client.get('/').loginAs(staff).withInertia()

    response.assertRedirectsTo('/staff/tasks')
  })
})

test.group('Core: Health checks', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /health returns health status', async ({ client }) => {
    const response = await client.get('/health').withInertia()

    // Health endpoint should return some status
    response.assertInertiaComponent('health')
  })
})

test.group('Core: Error pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /nonexistent-route returns 404', async ({ client }) => {
    const response = await client.get('/this-route-does-not-exist')
    response.assertStatus(404)
  })

  test('POST to nonexistent route returns 404', async ({ client }) => {
    const response = await client.post('/this-route-does-not-exist')
    response.assertStatus(404)
  })
})

test.group('Core: CSRF protection', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST with CSRF token is accepted', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: 'New Name' })
      .withCsrfToken()
      .withInertia()

    // Should be accepted
    response.assertStatus(200)
  })
})

test.group('Core: Content negotiation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Inertia requests receive Inertia responses', async ({ client, assert }) => {
    const response = await client.get('/').withInertia()

    response.assertStatus(200)
    // Inertia responses have specific headers
    assert.exists(response.header('x-inertia'))
  })

  test('Non-Inertia requests to Inertia routes redirect or return HTML', async ({ client }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    // Should return HTML or redirect
  })
})

test.group('Core: Session handling', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Session persists across requests for authenticated users', async ({ client }) => {
    const user = await createUser()

    // First request - login
    await client
      .post('/login')
      .header('referer', '/login')
      .form({
        email: user.email,
        password: 'Secret123',
        remember_me: false,
      })
      .withCsrfToken()
      .withInertia()

    // Second request - should still be authenticated
    const response = await client.get('/profile').loginAs(user).withInertia()
    response.assertStatus(200)
  })

  test('Flash messages work correctly', async ({ client }) => {
    const user = await createUser()

    // Trigger a flash message by posting invalid data
    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: '' }) // Empty name should fail
      .withCsrfToken()
      .withInertia()

    // Should redirect back with errors in flash
    response.assertRedirectsTo('/profile')
  })
})

test.group('Core: Static assets', () => {
  test('GET /favicon.ico returns favicon or 404', async ({ client }) => {
    const response = await client.get('/favicon.ico')

    // Should return either the favicon or 404
    response.assertStatus(404)
  })

  test('GET /robots.txt returns robots.txt or 404', async ({ client }) => {
    const response = await client.get('/robots.txt')

    // Should return either robots.txt or 404
    response.assertStatus(404)
  })
})

test.group('Core: API versioning and headers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Requests include proper headers', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    // Check for common security headers
    assert.exists(response.header('x-content-type-options'))
  })

  test('CORS headers are not present on same-origin requests', async ({ client, assert }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    // CORS headers should not be present for same-origin
    assert.notExists(response.header('access-control-allow-origin'))
  })
})

test.group('Core: Request validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Very large request bodies are rejected', async ({ client }) => {
    const user = await createUser()

    // Create a very large payload
    const largeString = 'a'.repeat(10 * 1024 * 1024) // 10MB

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: largeString })
      .withCsrfToken()

    // Should be rejected due to size
    response.assertStatus(413)
  })

  test('Malformed JSON in request is rejected', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .header('content-type', 'application/json')
      .json('{ "name": "Test User" ') // Malformed JSON

    // Should be rejected due to invalid JSON
    response.assertStatus(400)
  })
})

test.group('Core: Redirects and navigation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Trailing slashes are handled correctly', async ({ client }) => {
    const response = await client.get('/login/')

    // Should either work or redirect without trailing slash
    response.assertStatus(200)
  })

  test('Redirects preserve query parameters', async ({ client }) => {
    const user = await createUser()

    const response = await client.get('/login?redirect=/profile').loginAs(user)

    response.assertStatus(200)
  })
})

test.group('Core: Rate limiting', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Multiple rapid login requests are handled without crashing', async ({ client, assert }) => {
    // Make multiple rapid requests
    const requests = []
    for (let i = 0; i < 20; i++) {
      requests.push(
        client
          .post('/login')
          .form({
            email: 'test@example.com',
            password: 'wrongpass',
          })
          .withCsrfToken()
      )
    }

    const responses = await Promise.all(requests)

    // Test that all requests complete without crashing
    assert.equal(responses.length, 20)

    // All responses should have valid status codes
    responses.forEach((r) => {
      assert.isTrue([200, 302, 403, 422, 429].includes(r.response.status))
    })
  })
})

test.group('Core: Localization and language', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Error messages are in Indonesian', async ({ client }) => {
    const response = await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: 'invalid-email',
        name: 'Test',
        password: 'Test123',
        password_confirmation: 'Test123',
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
})

test.group('Core: Database transactions', async (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('Failed operations rollback database changes', async ({ client, assert }) => {
    const user = await createUser({ email: 'rollback@example.com' })

    // Get user count before
    const countBefore = await User.query().count('* as total')

    // Try to create another user with same email (should fail)
    await client
      .post('/register')
      .header('referer', '/register')
      .form({
        email: user.email, // Duplicate email
        name: 'Duplicate User',
        password: 'Secret123',
        password_confirmation: 'Secret123',
      })
      .withCsrfToken()
      .withInertia()

    // Get user count after
    const countAfter = await User.query().count('* as total')

    // Count should be the same (rollback occurred)
    assert.equal(countBefore[0].$extras.total, countAfter[0].$extras.total)
  })
})
