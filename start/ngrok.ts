import { connect } from '@ngrok/ngrok'
import env from './env.js'

export async function startNgrok() {
  const listener = await connect({
    addr: 3333,
    authtoken: env.get('NGROK_AUTH_TOKEN'),
    domain: 'still-bat-singularly.ngrok-free.app',
  })

  console.log(`🚀 App tunnel running at: ${listener.url()}`)
}
