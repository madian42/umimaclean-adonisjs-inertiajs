import { formatIDR, cn } from '@/lib/utils'
import { ServiceItem } from '@/types'
import { Card } from '@/components/ui/card'

export default function ServiceItemCards({
  item,
  className,
  key,
}: {
  item: ServiceItem
  className?: string
  key: number
}) {
  return (
    <Card className={cn('p-4 shadow-sm gap-2', className)} key={key}>
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.attributes.map((attr, i) => (
          <span
            key={i}
            className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
          >
            {attr}
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {item.prices.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] items-center">
            <span className={cn('text-sm', i === 0 ? 'font-medium' : 'text-muted-foreground')}>
              {p.label}
            </span>
            <span className={cn('text-sm tabular-nums', i === 0 ? 'font-semibold' : '')}>
              {formatIDR(p.amount)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
