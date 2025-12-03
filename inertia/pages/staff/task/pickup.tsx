import {
  MapPin,
  Camera,
  CheckCircle,
  Upload,
  X,
  FileText,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tuyau/inertia/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Order } from '@/types'
import { uploadPhotoSchema, UploadPhotoSchema } from '@/schema/stage_schema'
import StaticMap from '@/components/organisms/static-map'

export default function PickupPage({ order }: { order: Order }) {
  const router = useRouter()

  const form = useForm<UploadPhotoSchema>({
    resolver: zodResolver(uploadPhotoSchema),
    mode: 'onChange',
  })

  const imageFile = form.watch('image')
  const [preview, setPreview] = useState<string | null>(null)
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState<boolean>(false)
  const [releaseNote, setReleaseNote] = useState<string>('')

  useEffect(() => {
    if (imageFile instanceof File) {
      const imageUrl = URL.createObjectURL(imageFile)
      setPreview(imageUrl)
      return () => URL.revokeObjectURL(imageUrl)
    }
    if (typeof imageFile === 'string') {
      setPreview(imageFile)
    }
  }, [imageFile])

  function handleMapClick() {
    const lat = order.address.latitude
    const lng = order.address.longitude
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  function handleUpload(data: UploadPhotoSchema) {
    router.visit(
      { route: 'staff.pickup.complete', params: { id: order.number } },
      {
        method: 'post',
        data,
        fresh: true,
        onSuccess: () => {
          form.reset()
          toast.success('Bukti pengambilan sepatu berhasil diunggah!')
        },
        onError: (errors) => {
          console.log('errors', errors)
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  function handleReleaseOrder(data: { note: string }) {
    router.visit(
      { route: 'staff.pickup.cancel', params: { id: order.number } },
      {
        method: 'post',
        data,
        fresh: true,
        onSuccess: () => {
          toast.success('Pesanan berhasil dilepas!')
        },
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-md bg-background">
      <div className="min-h-screen md:min-h-[calc(100vh-39px)] bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b sticky sm:top-9 top-0">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Pengambilan</h1>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Address Card Section */}
          <Card className="gap-2">
            <CardHeader className="flex items-center">
              <MapPin className="w-4 h-4" />
              <CardTitle>Alamat Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="ml-5">
              <div className="mb-1">
                <p className="font-medium">
                  {order.address.name} <span className="font-normal">({order.address.phone})</span>
                </p>
                <p className="text-sm">{order.address.street}</p>
              </div>
              {order.address.note && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-2">
                  <FileText className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 mb-1">Catatan:</p>
                    <p className="text-sm text-gray-700">{order.address.note}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-lg h-10 gap-2 font-medium"
                  onClick={() => (window.location.href = 'tel:(081387882973)')}
                >
                  <Phone className="w-4 h-4" />
                  Panggil
                </Button>
                <Button
                  className="flex-1 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-lg h-10 gap-2 font-medium"
                  onClick={() => console.log('Open chat')}
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div
              className="relative h-56 rounded-lg overflow-hidden cursor-pointer hover:from-gray-300 hover:to-gray-400 transition-all duration-200 shadow-inner"
              onClick={handleMapClick}
            >
              <StaticMap latitude={order.address.latitude} longitude={order.address.longitude} />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border">
                  <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Klik untuk buka di Google Maps
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Photo Upload Section */}
          <Card className="gap-2">
            <CardHeader className="flex items-center">
              <Camera className="w-4 h-4" />
              <CardTitle>Bukti Pengambilan Sepatu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                {preview ? (
                  <div className="space-y-3">
                    <img
                      src={preview || '/placeholder.svg'}
                      alt="Preview bukti pengambilan sepatu"
                      className="w-full h-60 object-contain rounded-lg shadow-sm"
                    />
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-sm text-gray-900">File berhasil diunggah</p>
                      <p className="text-xs text-gray-500">Klik lagi untuk mengganti gambar</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Pilih file atau drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpload)}>
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              id="image"
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                field.onChange(event.target.files && event.target.files[0])
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </CardContent>
          </Card>

          <div className="border-t border-gray-200 px-4 py-4 bg-white">
            <div className="space-y-3 w-full">
              <Button
                type="submit"
                onClick={form.handleSubmit(handleUpload)}
                disabled={
                  form.formState.isSubmitting || !form.formState.isDirty || !form.formState.isValid
                }
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-5 rounded-lg flex items-center justify-center gap-2 text-base transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Selesaikan Pengambilan
              </Button>

              <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button className="w-full bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 font-semibold py-5 rounded-lg flex items-center justify-center gap-2 text-base transition-colors">
                    <X className="w-5 h-5" />
                    Batalkan Pengambilan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Batalkan Pengambilan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Pesanan ini akan dikembalikan ke daftar dan bisa diambil oleh petugas lain.
                      Mohon berikan alasan pembatalan untuk audit.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="grid w-full gap-3">
                    <Label htmlFor="note">Alasan Pembatalan (opsional)</Label>
                    <Textarea
                      id="note"
                      name="note"
                      value={releaseNote}
                      onChange={(e) => setReleaseNote(e.target.value)}
                      placeholder="Contoh: Pelanggan tidak ada di lokasi, alamat tidak ditemukan, dll."
                      className="min-h-[100px]"
                    />
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel type="button" onClick={() => setReleaseNote('')}>
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      type="button"
                      onClick={() => {
                        handleReleaseOrder({ note: releaseNote })
                        setReleaseNote('')
                      }}
                    >
                      Lepas Pesanan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
