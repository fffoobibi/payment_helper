import http from '@/utils/http'

const incomeRecord = {
    getIncomeRecords: data => http({ url: '/incomeRecord/getIncomeRecords', params: data }),
}

export default incomeRecord