// import { useEffect, useState } from 'react'
// import { CheckCircle, Upload, X } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/card'
// import { Button } from '@/components/button'
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/form'
// import { Input } from '@/components/input'
// import { useForm } from 'react-hook-form'
// import { vineResolver } from '@hookform/resolvers/vine'
// import { InspectionPayload, inspectionSchema } from '#bookings/validators/booking_validator'
// import { Separator } from '@/components/separator'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/select'
// import { Checkbox } from '@/components/checkbox'
// import { Textarea } from '@/components/textarea'
// import { Label } from '#common/ui/components/label'
// import { useRouter } from '@tuyau/inertia/react'
// import { zodResolver } from '@hookform/resolvers/zod'
// import {
//   UploadClientPhotoPayload,
//   uploadClientPhotoSchema,
// } from '#bookings/validators/client_photo_validator'
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '#common/ui/components/alert-dialog'
// import { Booking } from '#core/types/type'
// import { toast } from 'sonner'

// const MAIN_SERVICES = [
//   {
//     id: 'premium-suede',
//     label: 'Premium Suede',
//     hasStartsFrom: true,
//     description: 'Starts from',
//   },
//   {
//     id: 'mild',
//     label: 'Mild',
//     hasStartsFrom: false,
//     price: 'Rp 35.000',
//   },
//   {
//     id: 'medium',
//     label: 'Medium',
//     hasStartsFrom: false,
//     price: 'Rp 65.000',
//   },
//   {
//     id: 'hard',
//     label: 'Hard',
//     hasStartsFrom: false,
//     price: 'Rp 95.000',
//   },
//   {
//     id: 'kids-shoes',
//     label: 'Kids Shoes',
//     hasStartsFrom: true,
//     description: 'Starts from',
//   },
//   {
//     id: 'just-for-her',
//     label: 'Just for Her',
//     hasStartsFrom: false,
//     price: 'Rp 85.000',
//   },
//   {
//     id: 'unyellowing',
//     label: 'Unyellowing',
//     hasStartsFrom: true,
//     description: 'Starts from',
//   },
// ]

// const ADDITIONAL_SERVICES = [
//   { id: 'white-shoe', label: 'White Shoe / Mummy' },
//   { id: 'nubuck-suede', label: 'Nubuck / Suede' },
//   { id: 'one-day-service', label: 'One Day Service' },
// ]

// export default function InspectionPage({ booking }: { booking: Booking }) {
//   const router = useRouter()

//   const [shoeCount, setShoeCount] = useState<number>(0)

//   const form = useForm<InspectionPayload>({
//     resolver: vineResolver(inspectionSchema),
//     defaultValues: {
//       brand: '',
//       size: 0,
//       type: '',
//       material: '',
//       category: '',
//       condition: '',
//       services: '',
//       additionalServices: [],
//       note: '',
//     },
//     mode: 'onChange',
//   })

//   const imageForm = useForm<UploadClientPhotoPayload>({
//     resolver: zodResolver(uploadClientPhotoSchema),
//     mode: 'onChange',
//   })

//   const imageFile = imageForm.watch('image')
//   const [preview, setPreview] = useState<string | null>(null)
//   const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState<boolean>(false)
//   const [releaseNote, setReleaseNote] = useState<string>('')

//   useEffect(() => {
//     if (imageFile instanceof File) {
//       const imageUrl = URL.createObjectURL(imageFile)
//       setPreview(imageUrl)
//       return () => URL.revokeObjectURL(imageUrl)
//     }
//     if (typeof imageFile === 'string') {
//       setPreview(imageFile)
//     }
//   }, [imageFile])

//   function onSubmit() {
//     const shoeData = form.getValues()
//     const imageData = imageForm.getValues()

//     const mergedData = {
//       shoes: shoeData, // Array of all shoe inspections
//       image: imageData.image,
//       totalShoes: shoeCount,
//     }

//     router.visit(
//       { route: 'staff.bookings.complete-inspection', params: { id: booking.id } },
//       {
//         method: 'post',
//         data: mergedData,
//         fresh: true,
//         onSuccess: () => {
//           toast.success('Pengecekan sepatu berhasil diselesaikan!')
//         },
//         onError: (errors) => {
//           if (errors?.general_errors) {
//             toast.error(errors.general_errors)
//           }
//         },
//       }
//     )
//   }

//   function handleReleaseOrder(data: { note: string }) {
//     router.visit(
//       { route: 'staff.bookings.release', params: { stage: 'check', id: booking.id } },
//       {
//         method: 'post',
//         data,
//         fresh: true,
//         onSuccess: () => {
//           toast.success('Pesanan berhasil dilepas!')
//         },
//         onError: (errors) => {
//           if (errors?.general_errors) {
//             toast.error(errors.general_errors)
//           }
//         },
//       }
//     )
//   }

//   return (
//     <div className="mx-auto max-w-md bg-background">
//       <div className="min-h-screen md:min-h-[calc(100vh-39px)] bg-gray-50 flex flex-col">
//         {/* Header */}
//         <div className="bg-white px-4 py-4 border-b sticky sm:top-9 top-0">
//           <div className="flex items-center justify-center gap-3">
//             <h1 className="text-lg font-semibold text-gray-900">Pengecekan Sepatu</h1>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28">
//           {/* Shoe Count */}
//           <Card className="mb-4 gap-2 p-4">
//             <Label>Berapa Banyak Sepatu?</Label>
//             <Input
//               type="number"
//               min="1"
//               value={shoeCount === 0 ? '' : shoeCount}
//               onChange={(e) => {
//                 const raw = e.target.value
//                 if (raw === '') {
//                   setShoeCount(0)
//                   return
//                 }
//                 const num = Number(raw)
//                 if (Number.isNaN(num) || num < 0) {
//                   setShoeCount(0)
//                 } else {
//                   setShoeCount(Math.floor(num))
//                 }
//               }}
//               placeholder="Masukkan jumlah sepatu"
//             />
//           </Card>

//           {/* Shoe Details */}
//           {shoeCount > 0 && (
//             <div className="mb-4">
//               <h2 className="font-semibold text-sm text-gray-900 mb-3">Detail Sepatu & Layanan</h2>
//               {Array.from({ length: shoeCount }).map((_, index) => (
//                 <Card key={index} className="mb-4 gap-2 py-4">
//                   <CardHeader className="flex px-4 items-center">
//                     <CardTitle className="uppercase text-xs">Sepatu {index + 1}</CardTitle>
//                   </CardHeader>
//                   <Separator />
//                   <CardContent className="px-4">
//                     <Form {...form}>
//                       <form className="flex flex-col mt-3 gap-6">
//                         <div className="grid gap-6">
//                           <FormField
//                             control={form.control}
//                             name="brand"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Brand Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="text"
//                                     placeholder="Masukkan nama brand sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="type"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Model Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="text"
//                                     placeholder="Masukkan model sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="size"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Ukuran Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="number"
//                                     placeholder="Masukkan ukuran sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="material"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Bahan Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="text"
//                                     placeholder="Masukkan bahan sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="category"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Jenis Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="text"
//                                     placeholder="Masukkan jenis sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="condition"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Kondisi Sepatu</FormLabel>
//                                 <FormControl>
//                                   <Input
//                                     type="text"
//                                     placeholder="Masukkan kondisi sepatu"
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="services"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Layanan Utama</FormLabel>
//                                 <FormControl>
//                                   <Select defaultValue={field.value} onValueChange={field.onChange}>
//                                     <FormControl>
//                                       <SelectTrigger className="bg-background w-full">
//                                         <SelectValue placeholder="Pilihan layanan utama" />
//                                       </SelectTrigger>
//                                     </FormControl>
//                                     <SelectContent>
//                                       {MAIN_SERVICES.map((service) => (
//                                         <SelectItem key={service.id} value={service.id}>
//                                           {service.label}
//                                         </SelectItem>
//                                       ))}
//                                     </SelectContent>
//                                   </Select>
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="additionalServices"
//                             render={({ field }) => {
//                               const items = ADDITIONAL_SERVICES.map((service) => ({
//                                 id: service.id,
//                                 label: service.label,
//                               }))
//                               return (
//                                 <FormItem>
//                                   <FormLabel>Layanan Tambahan</FormLabel>
//                                   <div className="space-y-2">
//                                     {items.map((item) => (
//                                       <div
//                                         key={item.id}
//                                         className="flex flex-row items-start space-x-3 space-y-0"
//                                       >
//                                         <FormControl>
//                                           <Checkbox
//                                             checked={field.value?.includes(item.id)}
//                                             onCheckedChange={(checked) => {
//                                               const updatedValues = Array.isArray(field.value)
//                                                 ? field.value
//                                                 : []
//                                               if (checked) {
//                                                 field.onChange([...updatedValues, item.id])
//                                               } else {
//                                                 field.onChange(
//                                                   updatedValues.filter((value) => value !== item.id)
//                                                 )
//                                               }
//                                             }}
//                                           />
//                                         </FormControl>
//                                         {/* <div className="space-y-1 leading-none"> */}
//                                         <FormLabel className="mt-0.5 font-normal">
//                                           {item.label}
//                                         </FormLabel>
//                                         {/* </div> */}
//                                       </div>
//                                     ))}
//                                   </div>
//                                 </FormItem>
//                               )
//                             }}
//                           />

//                           <FormField
//                             control={form.control}
//                             name="note"
//                             render={({ field }) => (
//                               <FormItem>
//                                 <FormLabel>Catatan Tambahan</FormLabel>
//                                 <FormControl>
//                                   <Textarea
//                                     placeholder="Masukkan catatan tambahan atau alasan penambahan harga..."
//                                     {...field}
//                                   />
//                                 </FormControl>
//                               </FormItem>
//                             )}
//                           />
//                         </div>
//                       </form>
//                     </Form>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           )}

//           <Card className="gap-2">
//             <CardHeader className="flex items-center">
//               <CardTitle>Bukti Pengecekan Sepatu</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
//                 {preview ? (
//                   <div className="space-y-3">
//                     <img
//                       src={preview || '/placeholder.svg'}
//                       alt="Preview bukti pengambilan sepatu"
//                       className="w-full h-60 object-contain rounded-lg shadow-sm"
//                     />
//                     <div className="flex flex-col items-center">
//                       <p className="font-medium text-sm text-gray-900">File berhasil diunggah</p>
//                       <p className="text-xs text-gray-500">Klik lagi untuk mengganti gambar</p>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     <Upload className="h-12 w-12 text-gray-400 mx-auto" />
//                     <div>
//                       <p className="text-sm font-medium text-gray-700">
//                         Pilih file atau drag and drop
//                       </p>
//                       <p className="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
//                     </div>
//                   </div>
//                 )}

//                 <Form {...imageForm}>
//                   <form>
//                     <FormField
//                       control={imageForm.control}
//                       name="image"
//                       render={({ field }) => (
//                         <FormItem>
//                           <FormControl>
//                             <Input
//                               id="image"
//                               type="file"
//                               accept="image/*"
//                               onChange={(event) =>
//                                 field.onChange(event.target.files && event.target.files[0])
//                               }
//                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                               required
//                             />
//                           </FormControl>
//                           <FormMessage />
//                         </FormItem>
//                       )}
//                     />
//                   </form>
//                 </Form>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="border-t border-gray-200 px-4 py-4 bg-white">
//             <div className="space-y-3 w-full">
//               <Button
//                 type="submit"
//                 onClick={form.handleSubmit(onSubmit)}
//                 disabled={
//                   form.formState.isSubmitting || !form.formState.isDirty || !form.formState.isValid
//                 }
//                 className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-5 rounded-lg flex items-center justify-center gap-2 text-base transition-colors"
//               >
//                 <CheckCircle className="w-5 h-5" />
//                 Selesaikan Pengambilan
//               </Button>

//               <AlertDialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
//                 <AlertDialogTrigger asChild>
//                   <Button className="w-full bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50 font-semibold py-5 rounded-lg flex items-center justify-center gap-2 text-base transition-colors">
//                     <X className="w-5 h-5" />
//                     Batalkan Penjemputan
//                   </Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Batalkan Penjemputan</AlertDialogTitle>
//                     <AlertDialogDescription>
//                       Pesanan ini akan dikembalikan ke daftar dan bisa diambil oleh petugas lain.
//                       Mohon berikan alasan pembatalan untuk audit.
//                     </AlertDialogDescription>
//                   </AlertDialogHeader>

//                   <div className="grid w-full gap-3">
//                     <Label htmlFor="note">Alasan Pembatalan (opsional)</Label>
//                     <Textarea
//                       id="note"
//                       name="note"
//                       value={releaseNote}
//                       onChange={(e) => setReleaseNote(e.target.value)}
//                       placeholder="Contoh: Pelanggan tidak ada di lokasi, alamat tidak ditemukan, dll."
//                       className="min-h-[100px]"
//                     />
//                   </div>

//                   <AlertDialogFooter>
//                     <AlertDialogCancel type="button" onClick={() => setReleaseNote('')}>
//                       Batal
//                     </AlertDialogCancel>
//                     <AlertDialogAction
//                       type="button"
//                       onClick={() => {
//                         handleReleaseOrder({ note: releaseNote })
//                         setReleaseNote('')
//                       }}
//                     >
//                       Lepas Pesanan
//                     </AlertDialogAction>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
