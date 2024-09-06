import http from '@/utils/http'

const incomeRecord = {
    getIncomeRecords: data => http({ url: '/incomeRecord/getIncomeRecords', params: data, showLoading: false }),
    saveIncome: data => http({ url: '/incomeRecord/save', params: data }),
    editIncome: data => http({ url: '/incomeRecord/modify', params: data }),
    modifyNote: data => http({ url: '/incomeRecord/modifyNote', params: data }),
    auditIncome: data => http({ url: '/incomeRecord/audit', params: data }),
    cancelIncome: data => http({ url: '/incomeRecord/cancel', params: data }),
}

export default incomeRecord