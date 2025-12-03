import { Head, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import UserLayout from '@/components/layouts/user-layout'
import { User } from 'lucide-react'
import { useRouter } from '@tuyau/inertia/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

type TabValue = 'edit' | 'address'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const { url } = usePage()
  const router = useRouter()

  function handleTabChange(value: string) {
    const routes = {
      edit: 'profile.show',
      address: 'profile.address',
    } as const
    router.visit({ route: routes[value as TabValue] }, { method: 'get' })
  }

  function getCurrentTab() {
    if (url.includes('/edit')) return 'edit'
    if (url.includes('/address')) return 'address'
    return 'edit'
  }

  return (
    <UserLayout>
      <Head title="Profil" />

      <div className="flex min-h-screen md:min-h-[calc(100vh-39px)] flex-col space-y-6 p-6 md:pb-20">
        <div className="text-center">
          <User className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Profil</h1>
          <p className="text-muted-foreground">Atur informasi akun dan alamat Anda</p>
        </div>
        <Tabs
          value={getCurrentTab()}
          onValueChange={handleTabChange}
          defaultValue="all"
          className="w-full max-w-md"
        >
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="p-4 text-base">
              Akun
            </TabsTrigger>
            <TabsTrigger value="address" className="p-4 text-base">
              Alamat
            </TabsTrigger>
          </TabsList>

          <TabsContent value={getCurrentTab()}>{children}</TabsContent>
        </Tabs>
        <Button
          onClick={() => router.visit({ route: 'logout.handle' }, { method: 'post' })}
          variant="destructive"
          className="w-full cursor-pointer"
        >
          Keluar
        </Button>
      </div>
    </UserLayout>
  )
}
