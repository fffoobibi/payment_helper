import http from '@/utils/http'
import { get } from '@vueuse/core'

const payment = {
  getPaymentList: data => http({ url: '/paymentCashier/getPaymentList', params: data }),
  getPaymentDetail: data => http({ url: '/paymentCashier/getPaymentDetail', params: data }),
}

export default payment