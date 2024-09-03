import http from '@/utils/http'

const payment = {
  getPaymentList: data => http({ url: '/paymentCashier/getPaymentList', params: data }),
}

export default payment