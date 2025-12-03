import {
  HealthChecks,
  DiskSpaceCheck,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from '@adonisjs/core/health'
import db from '@adonisjs/lucid/services/db'
import { DbCheck } from '@adonisjs/lucid/database'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),
  new MemoryHeapCheck(),
  new MemoryRSSCheck(),
  new DbCheck(db.connection()),
])
