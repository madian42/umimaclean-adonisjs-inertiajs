import { formatIDR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useState } from 'react'
import { ServiceItem } from '@/types'
import ServiceItemCards from './service-item-card'

export default function ServiceItemCard() {
  const [openService, setOpenService] = useState<string>('')

  const items: ServiceItem[] = [
    {
      title: 'Nike Adidas',
      attributes: ['Kanvas', '42', 'Lari'],
      prices: [{ label: 'Cuci Medium', amount: 25000 }],
    },
    {
      title: 'Nike Adidas',
      attributes: ['Kanvas', '42', 'Lari'],
      prices: [
        { label: 'Cuci Medium', amount: 25000 },
        { label: 'Pemutihan', amount: 10000 },
      ],
    },
    {
      title: 'Docmart',
      attributes: ['Kulit', '42', 'Boot'],
      prices: [
        { label: 'Cuci Light', amount: 20000 },
        { label: 'Bahan Kulit', amount: 10000 },
      ],
    },
  ]

  const total = items.flatMap((it) => it.prices).reduce((sum, p) => sum + p.amount, 0)
  const due = Math.max(total - 15000, 0)

  return (
    <Card className="gap-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Detail Layanan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 1 ? (
          <>
            <ServiceItemCards key={0} item={items[0]} />
            <Accordion value={openService} onValueChange={setOpenService} type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionContent className="space-y-3">
                  {items.slice(1).map((item, idx) => (
                    <ServiceItemCards key={idx + 1} item={item} />
                  ))}
                </AccordionContent>
                <AccordionTrigger className="flex cursor-pointer justify-center py-0">
                  {openService === 'item-1' ? 'Lihat Lebih Sedikit' : 'Lihat Semua'}
                </AccordionTrigger>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <ServiceItemCards key={0} item={items[0]} />
        )}

        <div className="rounded-lg bg-secondary p-3">
          <div className="grid grid-cols-[1fr_auto] items-center">
            <span className="text-sm font-medium">Total Layanan</span>
            <span className="text-sm font-semibold tabular-nums">{formatIDR(total)}</span>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] items-center">
            <span className="text-xs text-muted-foreground">Uang Muka</span>
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              -{formatIDR(15000)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] items-center border-t pt-2">
            <span className="text-sm font-semibold">Sisa Pembayaran</span>
            <span className="text-sm font-bold tabular-nums">{formatIDR(due)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
