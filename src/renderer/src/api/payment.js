import http from '@/utils/http'

const payment = {
  getPaymentList: data => http({ url: '/paymentCashier/getPaymentList', params: data }),
  getPaymentDetail: data => http({ url: '/paymentCashier/getPaymentDetail', params: data }),
  review: data => http({ url: '/paymentCashier/review', params: data }),
  abnormal: data => http({ url: '/paymentCashier/updatePaymentAbnormal', params: data }),
  batchReview: data => http({ url: '/paymentCashier/batchReview', params: data }),
  checkMergePayment: data => http({ url: '/voucher/checkMergePayment', params: data }),
  mergePayment: data => http({ url: '/voucher/saveMergePayment', params: data }),
  getAccountDetail: data => http({ url: '/account/getAccountDetail', params: data }),
  getAirwallexConfig: data => http({ url: '/airwallex/getConfig', params: data }),
  getAirwallexData: data => http({ url: '/airwallex/getList', params: data, showLoading: false }),
  addPaymentRecord: data => http({ url: '/voucher/uploadVoucher', params: data }),
  getPaymentRecordList: data => http({ url: '/voucher/getVoucherHistoryList', params: data }),
  exportPaymentRecordList: data => http({ url: '/voucher/exportHistoryList', params: data }),
  getPaymentRecordExtList: data => http({ url: '/voucher/getPaymentHistory', params: data, showLoading: false }),
  getPaymentRecordItemList: data => http({ url: '/voucher/getPaymentItemsList', params: data, showLoading: false }),
  updatePaymentRecordExt: data => http({ url: '/voucher/modifyVoucher', params: data }),
  updatePaymentAttachments: data => http({ url: '/voucher/replenishVoucher', params: data, showLoading: false }),
  autoComplete: data => http({ url: '/paymentCashier/autoCompletePuchasement', params: data }),
  cancelModify: data => http({ url: '/voucher/cancelModifyVoucher', params: data }),
  auditModify: data => http({ url: '/voucher/auditModifyVoucher', params: data }),
}

export default payment