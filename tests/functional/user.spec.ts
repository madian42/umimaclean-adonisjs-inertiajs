import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Address from '#models/address'
import { createUser } from '#tests/utils/test_helpers'

test.group('User: profile page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /profile renders users/profile for authenticated user (no accordion state)', async ({
    client,
  }) => {
    const user = await createUser()

    const response = await client.get('/profile').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/profile/index')
  })

  test('GET /profile?accordionState=change-password passes accordion state prop', async ({
    client,
  }) => {
    const user = await createUser()

    const response = await client
      .get('/profile?accordionState=change-password')
      .loginAs(user)
      .withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('user/profile/index')
    response.assertInertiaPropsContains({ accordionState: 'change-password' })
  })
})

test.group('User: profile update name validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /profile fails with empty name', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: '' })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          name: 'Nama harus diisi',
        },
      },
    })
  })

  test('POST /profile fails with invalid name containing underscore', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: 'Invalid_Name' })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          name: 'Nama hanya boleh berisi huruf, spasi, dan tanda hubung',
        },
      },
    })
  })

  test('POST /profile succeeds updating name and redirects back', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .post('/profile')
      .loginAs(user)
      .header('referer', '/profile')
      .form({ name: 'Nama Valid' })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/profile')
  })
})

test.group('User: profile change password validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('POST /profile/change-password fails with wrong current_password', async ({ client }) => {
    const user = await createUser({ password: 'oldpass123' })

    const response = await client
      .post('/profile/change-password')
      .loginAs(user)
      .header('referer', '/profile?accordionState=change-password')
      .form({
        current_password: 'incorrect123',
        password: 'newpass123',
        password_confirmation: 'newpass123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          current_password: 'Kata sandi saat ini salah',
        },
      },
    })
  })

  test('POST /profile/change-password fails with password too short', async ({ client }) => {
    const user = await createUser({ password: 'oldpass123' })

    const response = await client
      .post('/profile/change-password')
      .loginAs(user)
      .header('referer', '/profile?accordionState=change-password')
      .form({
        current_password: 'oldpass123',
        password: 'short',
        password_confirmation: 'short',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password: 'Kata sandi harus memiliki minimal 8 karakter',
        },
      },
    })
  })

  test('POST /profile/change-password fails with password invalid format', async ({ client }) => {
    const user = await createUser({ password: 'oldpass123' })

    const response = await client
      .post('/profile/change-password')
      .loginAs(user)
      .header('referer', '/profile?accordionState=change-password')
      .form({
        current_password: 'oldpass123',
        password: 'newpass1_', // underscore not allowed
        password_confirmation: 'newpass1_',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          password:
            'Kata sandi harus memiliki minimal 8 karakter, termasuk huruf besar, huruf kecil, dan angka',
        },
      },
    })
  })

  test('POST /profile/change-password fails with password confirmation mismatch', async ({
    client,
  }) => {
    const user = await createUser({ password: 'oldpass123' })

    const response = await client
      .post('/profile/change-password')
      .loginAs(user)
      .header('referer', '/profile?accordionState=change-password')
      .form({
        current_password: 'oldpass123',
        password: 'newpass123',
        password_confirmation: 'another123',
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

  test('POST /profile/change-password succeeds and redirects back', async ({ client }) => {
    const user = await createUser({ password: 'oldpass123' })

    const response = await client
      .post('/profile/change-password')
      .loginAs(user)
      .header('referer', '/profile?accordionState=change-password')
      .form({
        current_password: 'oldpass123',
        password: 'Newpass123',
        password_confirmation: 'Newpass123',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/profile')
  })
})

test.group('User: address page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /profile/address renders user/address/create', async ({ client }) => {
    const user = await createUser()
    const response = await client.get('/profile/address').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/profile/address')
  })

  test('GET /profile/address renders user/profile/address with address', async ({ client }) => {
    const user = await createUser()
    await Address.create({
      userId: user.id,
      name: 'John',
      phone: '0812345678',
      street: 'Main Street',
      latitude: -6.9555305,
      longitude: 107.6540353,
      radius: 10,
      note: null,
    })

    const response = await client.get('/profile/address').loginAs(user).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('user/profile/address')
  })
})

test.group('User: address validation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('PUT /profile/address fails with invalid phone characters', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'John',
        phone: 'phoneX123_as',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 10,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          phone: 'Nomor telepon hanya boleh berisi angka',
        },
      },
    })
  })

  test('PUT /profile/address fails with invalid phone too short', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'John',
        phone: '0813137',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 10,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          phone: 'Nomor telepon harus memiliki minimal 10 karakter',
        },
      },
    })
  })

  test('PUT /profile/address fails with invalid phone too long', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'John',
        phone: '08131371253817351873518',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 10,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          phone: 'Nomor telepon harus memiliki maksimal 13 karakter',
        },
      },
    })
  })

  test('PUT /profile/address fails with radius too large', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'John',
        phone: '0812345678',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 50000,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          radius: 'Radius harus maksimal 40000',
        },
      },
    })
  })

  test('PUT /profile/address fails with invalid name underscore', async ({ client }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'Invalid_Name',
        phone: '0812345678',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 10,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertInertiaPropsContains({
      errors: {
        validation_errors: {
          name: 'Nama hanya boleh berisi huruf, spasi, dan tanda hubung',
        },
      },
    })
  })

  test('PUT /profile/address succeeds creating address and redirects to addresses list', async ({
    client,
  }) => {
    const user = await createUser()

    const response = await client
      .put('/profile/address')
      .loginAs(user)
      .header('referer', '/profile/address')
      .form({
        name: 'John',
        phone: '0812345678',
        street: 'Street',
        latitude: -6.9555305,
        longitude: 107.6540353,
        radius: 10,
        note: '',
      })
      .withCsrfToken()
      .withInertia()

    response.assertRedirectsTo('/profile/address')
  })
})
