// import { useEffect, useState } from 'react'
// import { Calendar, CalendarDays, LoaderCircle } from 'lucide-react'
// import { Head } from '@inertiajs/react'
// import { Button } from '@/components/button'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/card'
// import { useRouter } from '@tuyau/inertia/react'
// import { Calendar as CalendarComponent } from '@/components/calendar'
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/popover'
// import { addDays, addMonths, format, isSaturday, isWednesday } from 'date-fns'
// import { id } from 'date-fns/locale'
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/form'
// import { cn } from '@/lib/utils'
// import { BookingPayload, bookingSchema } from '#bookings/validators/booking_validator'
// import { useForm } from 'react-hook-form'
// import { vineResolver } from '@hookform/resolvers/vine'
// import { toast } from 'sonner'
// import StaffLayout from '@/components/layouts/staff-layout'

// export default function StaffBooking({
//   errors: serverErrors = {},
// }: {
//   errors?: Record<string, any>
// }) {
//   const router = useRouter()

//   const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false)

//   const form = useForm<BookingPayload>({
//     resolver: vineResolver(bookingSchema),
//     defaultValues: {
//       date: '',
//     },
//   })

//   function getAvailableDates() {
//     const dates = []
//     const today = new Date()
//     const oneMonthFromNow = addMonths(today, 1)

//     for (let i = 0; i < 31; i++) {
//       const checkDate = addDays(today, i)
//       if (checkDate <= oneMonthFromNow && (isWednesday(checkDate) || isSaturday(checkDate))) {
//         dates.push(checkDate)
//       }
//     }
//     return dates
//   }

//   const availableDates = getAvailableDates()

//   function handleDateSelect(date: Date | undefined) {
//     if (date && availableDates.some((d) => d.toDateString() === date.toDateString())) {
//       form.setValue('date', format(date, 'yyyy-MM-dd'))
//       setIsCalendarOpen(false)
//     }
//   }

//   async function onSubmit(data: BookingPayload) {
//     router.visit(
//       { route: 'bookings.store' },
//       {
//         method: 'post',
//         data,
//         fresh: true,
//         onSuccess: () => {
//           form.reset()
//           toast.success('Berhasil masuk!')
//         },
//         onError: (errors) => {
//           if (errors?.general_errors) {
//             toast.error(errors.general_errors)
//           }
//         },
//       }
//     )
//   }

//   useEffect(() => {
//     if (serverErrors.validation_errors && typeof serverErrors.validation_errors === 'object') {
//       Object.entries(serverErrors.validation_errors).forEach(([field, message]) => {
//         form.setError(field as keyof BookingPayload, {
//           type: 'server',
//           message: message as string,
//         })
//       })
//     }
//   }, [serverErrors, form])

//   return (
//     <StaffLayout>
//       <Head title="Order" />

//       <div className="flex min-h-screen md:min-h-[calc(100vh-39px)] flex-col space-y-6 p-6">
//         <div className="text-center">
//           <Calendar className="mx-auto mb-4 h-12 w-12 text-primary" />
//           <h1 className="mb-2 text-2xl font-bold">Jadwalkan Pesanan</h1>
//           <p className="text-muted-foreground">Pilih tanggal untuk penjemputan sepatu Anda</p>
//         </div>

//         <Card className="mx-auto w-full max-w-md">
//           <CardHeader>
//             <CardTitle className="text-lg">Pilih Tanggal</CardTitle>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="date"
//                   render={({ field }) => {
//                     const selectedDate = field.value ? new Date(field.value) : undefined
//                     return (
//                       <FormItem>
//                         <FormLabel>Pilih Tanggal</FormLabel>
//                         <FormControl>
//                           <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
//                             <PopoverTrigger asChild>
//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 className={cn(
//                                   'w-full justify-start text-left cursor-pointer font-normal',
//                                   !selectedDate && 'text-muted-foreground'
//                                 )}
//                               >
//                                 <CalendarDays className="mr-2 h-4 w-4" />
//                                 {selectedDate
//                                   ? format(selectedDate, 'dd/MM/yyyy', { locale: id })
//                                   : 'Pilih Tanggal'}
//                               </Button>
//                             </PopoverTrigger>
//                             <PopoverContent className="w-[300px] p-0">
//                               <CalendarComponent
//                                 className="w-full"
//                                 mode="single"
//                                 selected={selectedDate}
//                                 onSelect={(date) => handleDateSelect(date)}
//                                 disabled={(date) => {
//                                   return !availableDates.some(
//                                     (d) => d.toDateString() === date.toDateString()
//                                   )
//                                 }}
//                                 locale={id}
//                               />
//                             </PopoverContent>
//                           </Popover>
//                         </FormControl>
//                         <FormDescription>Tersedia hanya hari Rabu dan Sabtu</FormDescription>
//                         <FormMessage />
//                       </FormItem>
//                     )
//                   }}
//                 />

//                 <Button
//                   type="submit"
//                   className="w-full py-3 text-white cursor-pointer hover:bg-gray-700"
//                   disabled={form.formState.isSubmitting || !form.formState.isDirty}
//                 >
//                   {form.formState.isSubmitting && (
//                     <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   Konfirmasi Pemesanan
//                 </Button>
//               </form>
//             </Form>
//           </CardContent>
//         </Card>
//       </div>
//     </StaffLayout>
//   )
// }
