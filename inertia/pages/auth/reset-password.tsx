import { Head, usePage } from '@inertiajs/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { SharedData } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tuyau/inertia/react'
import { resetPasswordSchema, ResetPasswordSchema } from '@/schema/auth_schema'
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
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

export default function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter()
  const { errors: serverErrors } = usePage<SharedData>().props

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
    mode: 'onSubmit',
  })

  async function onSubmit(data: ResetPasswordSchema) {
    router.visit(
      { route: 'reset_password.handle', params: { token } },
      {
        method: 'post',
        data: {
          ...data,
          token,
        },
        fresh: true,
        onSuccess: () => {
          form.reset()
          toast.success('Kata sandi berhasil direset!')
          router.visit({ route: 'login.show' })
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
        form.setError(field as keyof ResetPasswordSchema, {
          type: 'server',
          message: message as string,
        })
      })
    }
  }, [serverErrors, form])

  return (
    <AuthLayout
      title="Reset kata sandi"
      description="Silakan masukkan kata sandi baru Anda di bawah ini"
    >
      <Head title="Reset Kata Sandi" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="grid gap-6">
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
              name="password_confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Kata Sandi</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Masukkan konfirmasi kata sandi"
                      autoComplete="new-password"
                      tabIndex={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-start">
              <Button
                className="w-full cursor-pointer"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting && <Spinner />}
                Reset kata sandi
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}
