import { type ReactNode } from 'react'
import { TuyauProvider } from '@tuyau/inertia/react'
import { Toaster } from '@/components/ui/sonner'
import { tuyau } from '@/app/tuyau'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="md:flex md:mx-auto md:max-w-md">
        <div className="hidden fixed w-md text-center top-0 md:block bg-[#fadbbb] text-[#6B484B] text-sm px-4 py-2 z-100">
          Untuk pengalaman lebih baik, buka di perangkat seluler.
        </div>
      </div>

      <div className="mx-auto max-w-md md:pt-9">
        <TuyauProvider client={tuyau}>{children}</TuyauProvider>
        <Toaster richColors position="top-center" />
      </div>
    </>
  )
}
