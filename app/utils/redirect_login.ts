import Roles from '#enums/role_enum'

export function getUserDashboardRoute(roleId: number) {
  const roleRoutes = {
    [Roles.ADMIN]: 'admin.dashboard',
    [Roles.STAFF]: 'staff.tasks',
    [Roles.USER]: 'orders.create',
  } as Record<number, string>

  return roleRoutes[roleId] || 'orders.create'
}
