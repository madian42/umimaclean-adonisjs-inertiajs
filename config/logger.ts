import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'
import { DateTime } from 'luxon'

const loggerConfig = defineConfig({
  default: 'app',

  /**
   * The loggers object can be used to define multiple loggers.
   * By default, we configure only one logger (named "app").
   */
  loggers: {
    app: {
      enabled: true,
      timestamp: () => {
        const time = DateTime.now().setZone('Asia/Jakarta').toISO()
        return `,"time":"${time}"`
      },
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(app.inDev, targets.file({ destination: 'logs/app.log', mkdir: true }))
          .pushIf(app.inProduction, targets.file({ destination: 'logs/app.log' }))
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
