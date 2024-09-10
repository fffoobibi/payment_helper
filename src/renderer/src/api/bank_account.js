import http from "@/utils/http"
export default {
    inventory: data => http({ url: '/account/inventory', params: data }),
    getUnavailableShowStatus: data => http({ url: '/account/getUnavailableShowStatus', params: data }),
    getList: (data, onSuccess = null) => http({ url: '/account/getAccountList', params: data, onSuccess }),
    editVoucherNo: (data) => http({ url: '/account/editVoucherNo', params: data, showLoading: false }),
    exportAccountRecordHistoryList: (data) => http({ url: '/account/exportAccountRecordHistoryList', params: data, showLoading: false }),
    exportAccountRecordHistoryAllList: (data) => http({ url: '/account/exportAccountRecordHistoryAllList', params: data, showLoading: false }),
    getAccountHistoryList: (data, onSuccess = null) => http({ url: '/account/getAccountRecordHistoryList', params: data, onSuccess }),
    getAccountRecordHistoryAllList: (data, onSuccess = null) => http({ url: '/account/getAccountRecordHistoryAllList', params: data, onSuccess }),
    getDetail: (data) => http({ url: '/transferAccounts/getDetail', params: data }),
    modifyNote: (data) => http({ url: '/transferAccounts/modifyNote', params: data }),
    cancelTransfer: (data) => http({ url: '/transferAccounts/cancel', params: data }),
    auditTransfer: (data) => http({ url: '/transferAccounts/audit', params: data })
}