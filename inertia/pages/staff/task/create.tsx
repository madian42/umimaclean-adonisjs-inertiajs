import StaffLayout from '@/components/layouts/staff-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Head } from '@inertiajs/react'
import { NotebookPen } from 'lucide-react'
import { useForm } from 'react-hook-form'

export default function StaffBooking() {
  const form = useForm()

  return (
    <StaffLayout>
      <Head title="Order" />

      <div className="flex min-h-screen md:min-h-[calc(100vh-39px)] flex-col space-y-6 p-6">
        <div className="text-center">
          <NotebookPen className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Jadwalkan Pesanan</h1>
          <p className="text-muted-foreground">Pilih tanggal untuk penjemputan sepatu Anda</p>
        </div>

        <Form {...form}>
          <form className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
            <Card className="gap-2">
              <CardHeader>
                <CardTitle>Detail Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pelanggan</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Masukkan nama pelanggan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Pelanggan</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Masukkan nama pelanggan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </StaffLayout>
  )
}
