import http from "@/utils/http"
export default {
    getList: (data) => http({ url: '/account/getAccountList', params: data }),
    getDetail: (data) => http({ url: '/transferAccounts/getDetail', params: data }),
    modifyNote: (data) => http({ url: '/transferAccounts/modifyNote', params: data }),
    cancelTransfer: (data) => http({ url: '/transferAccounts/cancel', params: data }),
    auditTransfer: (data) => http({ url: '/transferAccounts/audit', params: data })
}