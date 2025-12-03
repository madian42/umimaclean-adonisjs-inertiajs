import { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

/**
 * Database uniqueness validation that prevents duplicate entries
 * while maintaining data integrity across user registrations
 */

type Options = {
  table: string
  column: string
  label?: string
}

async function uniqueRule(value: unknown, options: Options, field: FieldContext) {
  if (typeof value !== 'string') {
    return
  }

  if (!field.isValid) {
    return
  }

  const row = await db
    .from(options.table)
    .select(options.column)
    .where(options.column, value)
    .first()

  if (row) {
    const explicitLabel = options.label
    const fieldLabel = (field as any)?.label ?? (field as any)?.name
    const label = explicitLabel ?? fieldLabel ?? options.column

    field.report(`${label} sudah terdaftar`, 'unique', field)
  }
}

export const unique = vine.createRule(uniqueRule, { isAsync: true })
