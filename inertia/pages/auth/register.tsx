import { Head, usePage } from '@inertiajs/react'
import { Link, useRouter } from '@tuyau/inertia/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { SharedData } from '@/types'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { registerSchema, RegisterSchema } from '@/schema/auth_schema'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import AuthLayout from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const { errors: serverErrors } = usePage<SharedData>().props

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
    mode: 'onSubmit',
  })

  async function onSubmit(data: RegisterSchema) {
    router.visit(
      { route: 'register.handle' },
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
        form.setError(field as keyof RegisterSchema, {
          type: 'server',
          message: message as string,
        })
      })
    }

    if (serverErrors.google_errors) {
      toast.error(serverErrors.google_errors)
    }
  }, [serverErrors, form])

  return (
    <AuthLayout title="Buat akun" description="Masukkan detail Anda di bawah untuk membuat akun">
      <Head title="Registrasi" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="grid gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      autoComplete="name"
                      autoFocus
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Masukkan alamat email"
                      autoComplete="email"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Masukkan kata sandi"
                      autoComplete="new-password"
                      tabIndex={3}
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
                  <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Masukkan konfirmasi kata sandi"
                      autoComplete="new-password"
                      tabIndex={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col">
              <Button
                type="submit"
                className="w-full cursor-pointer"
                tabIndex={5}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Spinner />}
                Buat akun
              </Button>
              <Button
                asChild
                className="flex w-full items-center justify-center border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <a href={'/auth/google/redirect'} className="mt-4 w-full">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                  >
                    <g clipPath="url(#clip0_17_40)">
                      <path
                        d="M19.805 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48c-.24 1.28-1.02 2.36-2.18 3.08v2.56h3.52c2.06-1.9 3.24-4.7 3.24-7.43z"
                        fill="#4285F4"
                      />
                      <path
                        d="M10 20c2.7 0 4.97-.89 6.63-2.41l-3.52-2.56c-.98.66-2.23 1.05-3.61 1.05-2.77 0-5.12-1.87-5.96-4.39H.92v2.75C2.57 17.98 6.03 20 10 20z"
                        fill="#34A853"
                      />
                      <path
                        d="M4.04 12.69c-.23-.66-.36-1.36-.36-2.09s.13-1.43.36-2.09V5.76H.92A9.98 9.98 0 000 10c0 1.64.39 3.19 1.08 4.24l2.96-2.55z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M10 3.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87C14.97 1.01 12.7 0 10 0 6.03 0 2.57 2.02.92 5.76l3.12 2.75C4.88 6.83 7.23 3.96 10 3.96z"
                        fill="#EA4335"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_17_40">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  Masuk dengan Google
                </a>
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link route="login.show" className="underline text-black" tabIndex={6}>
              Masuk
            </Link>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}
