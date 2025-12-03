import UserLayout from '@/components/layouts/user-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn, OrderStatusDisplay } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import OrderStatuses from '#enums/order_status_enum'
import type { OrderStatus } from '@/types'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export type TimelineItem = {
  title: string
  at?: string
  description?: string
}

export type Step = {
  id: string
  label: string
  status: 'done' | 'current' | 'todo'
}

type StepKey = 'pickup' | 'inspection' | 'delivery'

export default function StatusPage({ statuses }: { statuses: OrderStatus[] }) {
  // Build a map of latest timestamps by status name
  const statusMap = statuses.reduce(
    (acc, status) => {
      acc[status.name as OrderStatuses] = status.updatedAt
      return acc
    },
    {} as Partial<Record<OrderStatuses, string>>
  )

  // Map raw order statuses to the 3 visual steps
  const statusToStep: Partial<Record<OrderStatuses, StepKey>> = {
    [OrderStatuses.PICKUP_SCHEDULED]: 'pickup',
    [OrderStatuses.PICKUP_PROGRESS]: 'pickup',
    [OrderStatuses.INSPECTION]: 'inspection',
    [OrderStatuses.DELIVERY]: 'delivery',
    [OrderStatuses.COMPLETED]: 'delivery',
  }

  // Latest status is conventionally the first entry
  const latestStatus = statuses[0]?.name as OrderStatuses | undefined
  const currentStep = latestStatus ? statusToStep[latestStatus] : undefined

  const STEPS: Step[] = [
    {
      id: 's1',
      label: 'Pengambilan',
      status: getStepStatus('pickup', currentStep),
    },
    {
      id: 's2',
      label: 'Dalam Proses',
      status: getStepStatus('inspection', currentStep),
    },
    {
      id: 's3',
      label: 'Pengiriman',
      status: getStepStatus('delivery', currentStep),
    },
  ]

  function getStepStatus(
    stepName: StepKey,
    current: StepKey | undefined
  ): 'done' | 'current' | 'todo' {
    const stepOrder: StepKey[] = ['pickup', 'inspection', 'delivery']

    // Delivery is done when order is completed
    if (stepName === 'delivery' && statusMap[OrderStatuses.COMPLETED]) {
      return 'done'
    }

    const currentIndex = current ? stepOrder.indexOf(current) : -1
    const stepIndex = stepOrder.indexOf(stepName)

    if (currentIndex > stepIndex) return 'done'
    if (currentIndex === stepIndex) return 'current'
    return 'todo'
  }

  // Canonical timeline order using enums
  const TIMELINE_ORDER: OrderStatuses[] = [
    OrderStatuses.WAITING_DEPOSIT,
    OrderStatuses.PICKUP_SCHEDULED,
    OrderStatuses.PICKUP_PROGRESS,
    OrderStatuses.INSPECTION,
    OrderStatuses.WAITING_PAYMENT,
    OrderStatuses.IN_PROCESS,
    OrderStatuses.PROCESS_COMPLETED,
    OrderStatuses.DELIVERY,
    OrderStatuses.COMPLETED,
  ]

  // Build timeline items using central display map
  const TIMELINE: TimelineItem[] = TIMELINE_ORDER.map((code) => ({
    title: OrderStatusDisplay[code].text,
    at: statusMap[code],
  }))

  function formatDate(value: string) {
    return format(new Date(value), 'd MMM yyyy H:mm', { locale: id })
  }

  function TimelineList({ items }: { items: TimelineItem[] }) {
    return (
      <ol className="space-y-6">
        {items.map((item, idx) => {
          const done = Boolean(item.at)
          const isLast = idx === items.length - 1

          return (
            <li key={idx} className="grid grid-cols-[24px_1fr] gap-3">
              <div className="relative">
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-1 mt-1 w-1 top-0 -bottom-7 bg-muted-foreground/25"
                  />
                )}

                <span
                  aria-hidden
                  className={cn(
                    'relative z-1 mt-1 block h-3 w-3 rounded-full border',
                    done
                      ? 'bg-foreground border-foreground'
                      : 'bg-background border-muted-foreground'
                  )}
                />
              </div>

              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.at ? formatDate(item.at) : ''}
                </p>
                {item.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    )
  }

  function Stepper({ steps }: { steps: Step[] }) {
    return (
      <div className="rounded-lg border p-4">
        <div
          className="grid items-center"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, idx) => {
            const prev = steps[idx - 1]
            const next = steps[idx + 1]
            const leftActive = prev && prev.status !== 'todo' && step.status !== 'todo'
            const rightActive = next && step.status !== 'todo' && next.status !== 'todo'
            return (
              <div key={step.id} className="relative grid place-items-center">
                {idx > 0 ? (
                  <span
                    className={cn(
                      'absolute left-0 right-[62%] top-1/2 -translate-y-1/2 h-0.5',
                      leftActive ? 'bg-foreground' : ''
                    )}
                  />
                ) : null}
                {idx < steps.length - 1 ? (
                  <span
                    className={cn(
                      'absolute left-[62%] right-0 top-1/2 -translate-y-1/2 h-0.5',
                      rightActive ? 'bg-foreground' : ''
                    )}
                  />
                ) : null}

                <div
                  aria-current={step.status === 'current' ? 'step' : undefined}
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-content-center rounded-full border text-sm font-semibold',
                    circleClasses(step.status)
                  )}
                >
                  {idx + 1}
                </div>
              </div>
            )
          })}
        </div>

        <div
          className="mt-2 grid gap-2 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step) => (
            <div key={step.id} className="text-center">
              {step.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function circleClasses(status: Step['status']) {
    switch (status) {
      case 'done':
        return 'bg-foreground text-background border-foreground'
      case 'current':
        return 'bg-background text-foreground border-foreground ring-2 ring-foreground'
      default:
        return 'bg-background text-muted-foreground border-muted-foreground'
    }
  }

  return (
    <UserLayout>
      <div className="min-h-screen md:min-h-[calc(100vh-39px)] bg-gray-50 flex flex-col">
        <div className="bg-white p-4 border-b">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 cursor-pointer h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Status Pesanan</h1>
          </div>
        </div>

        <div className="flex-1 p-4 pb-20 space-y-4">
          <Stepper steps={STEPS} />

          <Card className="mt-4 rounded-xl p-4 md:p-6">
            <TimelineList items={TIMELINE} />
          </Card>
        </div>
      </div>
    </UserLayout>
  )
}
