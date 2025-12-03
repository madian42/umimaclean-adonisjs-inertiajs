import { Link } from '@tuyau/inertia/react'
import { type PropsWithChildren } from 'react'
import { ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tuyau } from '@/app/tuyau'

export default function StaffLayout({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto max-w-md bg-background">
      <div>{children}</div>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 transform border-t border-border bg-card">
        <div className="flex h-16 items-center justify-around gap-4 px-4">
          <Link
            route="staff.tasks"
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors',
              tuyau.$current('staff.tasks')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="text-xs font-medium">Pesanan</span>
          </Link>

          <Link
            route="staff.profile.show"
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors',
              tuyau.$current('staff.profile.show')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
