export interface MidtransQrisAction {
  name: string
  method: string
  url: string
}

export interface MidtransQrisResponse {
  status_code: string
  status_message: string
  transaction_id: string
  order_id: string
  merchant_id: string
  gross_amount: string
  currency: string
  payment_type: 'qris'
  transaction_time: string
  transaction_status: string
  fraud_status: string
  acquirer: string
  actions: MidtransQrisAction[]
}
