import StaffLayout from '@/components/layouts/staff-layout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { UpdatePasswordPayload, updatePasswordSchema } from '@/schema/profile_schema'
import { SharedData } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { Head, usePage } from '@inertiajs/react'
import { useRouter } from '@tuyau/inertia/react'
import { User } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export default function StaffProfile({
  errors: serverErrors = {},
}: {
  errors?: Record<string, string>
}) {
  const { auth } = usePage<SharedData>().props
  const router = useRouter()

  const form = useForm<UpdatePasswordPayload>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
    mode: 'onChange',
  })

  async function onSubmitPassword(data: UpdatePasswordPayload) {
    router.visit(
      { route: 'profile.change_password.handle' },
      {
        method: 'post',
        data,
        fresh: true,
        onSuccess: () => {
          form.reset()
          toast.success('Berhasil daftar!')
        },
        onError: (errors) => {
          if (errors?.general_errors) {
            toast.error(errors.general_errors)
          }
        },
      }
    )
  }

  useEffect(() => {
    if (serverErrors.validation_errors && typeof serverErrors.validation_errors === 'object') {
      Object.entries(serverErrors.validation_errors).forEach(([field, message]) => {
        form.setError(field as keyof UpdatePasswordPayload, {
          type: 'server',
          message: message as string,
        })
      })
    }
  }, [serverErrors, form])

  return (
    <StaffLayout>
      <Head title="Profil" />

      <div className="flex min-h-screen md:min-h-[calc(100vh-39px)] flex-col space-y-6 p-6 md:pb-20">
        <div className="text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Atur informasi akun dan alamat Anda</p>
        </div>

        <div className="grid gap-6">
          <div className="text-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nama</label>
              <p className="mt-1 text-base">{auth?.user?.name ?? '-'}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitPassword)} className="flex flex-col gap-6">
            <div className="grid gap-5">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Saat ini</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Masukkan kata sandi saat ini"
                        autoComplete="current-password"
                        tabIndex={1}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Masukkan kata sandi baru"
                        autoComplete="new-password"
                        tabIndex={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Konfirmasi kata sandi baru"
                        autoComplete="new-password"
                        tabIndex={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full cursor-pointer"
                tabIndex={4}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Spinner />}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Form>

        <Button
          onClick={() => router.visit({ route: 'logout.handle' }, { method: 'post' })}
          variant="destructive"
          className="w-full cursor-pointer"
        >
          Keluar
        </Button>
      </div>
    </StaffLayout>
  )
}
