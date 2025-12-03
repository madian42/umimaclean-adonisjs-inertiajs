import User from '#models/user'
import env from '#start/env'
import router from '@adonisjs/core/services/router'
import { BaseMail } from '@adonisjs/mail'

/**
 * Sends a password reset email to the user with a link to reset their password.
 */
export default class PasswordResetNotification extends BaseMail {
  constructor(
    private user: User,
    private token: string
  ) {
    super()
  }

  from = 'noreply@umimaclean.com'
  subject = 'Reset Kata Sandi Anda'

  prepare() {
    const resetLink = router.makeSignedUrl(
      'reset-password.show',
      { token: this.token },
      { expiresIn: '60mins', prefixUrl: env.get('VITE_APP_URL'), purpose: 'reset_password' }
    )

    this.message.to(this.user.email).from(this.from).subject(this.subject).html(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding: 20px;
              background-color: #4CAF50;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 20px;
              text-align: center;
            }
            .button {
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              text-decoration: none;
              font-size: 16px;
              border-radius: 5px;
              margin-top: 20px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              padding: 10px;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        
        <body>
          <div class="container">
            <div class="header">
              <h1>Permintaan Reset Kata Sandi</h1>
            </div>
            <div class="content">
              <p>Halo ${this.user.name},</p>
              <p>Kami menerima permintaan untuk mereset kata sandi Anda. Jika Anda yang membuat permintaan ini, Anda dapat mereset kata sandi dengan mengklik tombol di bawah ini:</p>
              <a href="${resetLink}" class="button">Reset Kata Sandi Anda</a>
              <p>Jika Anda tidak meminta reset kata sandi, silakan abaikan email ini.</p>
            </div>
            <div class="footer">
              <p>Butuh bantuan? Hubungi tim dukungan kami di <a href="mailto:support@umimaclean.com">support@umimaclean.com</a>.</p>
            </div>
          </div>
        </body>
      </html>
    `)
  }
}
