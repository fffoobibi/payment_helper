import http from '@/utils/http'

const creditCard = {
    getList: data => http({ url: '/creditCard/getList', params: data }),
    getAccounts: data => http({ url: '/creditCard/getAccounts', params: data, showLoading: false }),
    review: data => http({ url: '/creditCard/review', params: data, showLoading: false }),
    exportList: data => http({ url: '/creditCard/exportList', params: data, showLoading: false})
}

export default creditCard