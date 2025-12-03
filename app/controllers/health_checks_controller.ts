import { healthChecks } from '#start/health'
import type { HttpContext } from '@adonisjs/core/http'

export default class HealthChecksController {
  async handle({ response, inertia }: HttpContext) {
    const report = await healthChecks.run()

    // Always render through Inertia, but set the appropriate HTTP status
    if (!report.isHealthy) {
      response.status(503) // Service Unavailable
    }

    return inertia.render('health', { health: report })
  }
}
