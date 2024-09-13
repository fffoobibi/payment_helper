import http from '@/utils/http'

const payment = {
  getPaymentList: data => http({ url: '/paymentCashier/getPaymentList', params: data }),
  getPaymentDetail: data => http({ url: '/paymentCashier/getPaymentDetail', params: data }),
  review: data => http({ url: '/paymentCashier/review', params: data }),
  batchReview: data => http({ url: '/paymentCashier/batchReview', params: data }),
  addPaymentRecord: data => http({ url: '/voucher/uploadVoucher', params: data }),
  getPaymentRecordList: data => http({ url: '/voucher/getVoucherHistoryList', params: data }),
  getPaymentRecordExtList: data => http({ url: '/voucher/getPaymentHistory', params: data, showLoading: false }),
  getPaymentRecordItemList: data => http({ url: '/voucher/getPaymentItemsList', params: data, showLoading: false }),
  updatePaymentRecordExt: data => http({ url: '/voucher/modifyVoucher', params: data }),
  updatePaymentAttachments: data => http({ url: '/voucher/replenishVoucher', params: data, showLoading: false }),
}

export default payment