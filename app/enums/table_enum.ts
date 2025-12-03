enum Tables {
  RATE_LIMITS = 'rate_limits',
  ROLES = 'roles',
  USERS = 'users',
  PASSWORD_RESET_TOKENS = 'password_reset_tokens',
  REMEMBER_ME_TOKENS = 'remember_me_tokens',
  ADDRESSES = 'addresses',
  // Renamed from BOOKINGS to ORDERS to better represent both online orders and offline orders
  ORDERS = 'orders',
  ORDER_STATUSES = 'order_statuses',
  ORDER_PHOTOS = 'order_photos',
  ORDER_ACTIONS = 'order_actions',
  SHOES = 'shoes',
  SERVICES = 'services',
  TRANSACTIONS = 'transactions',
  TRANSACTION_ITEMS = 'transaction_items',
  REVIEWS = 'reviews',
  PUSH_NOTIFICATIONS = 'push_notifications',
  NOTIFICATIONS = 'notifications',
}

export default Tables
