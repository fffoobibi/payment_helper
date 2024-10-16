import http from '@/utils/http'

const creditCard = {
    getList: data => http({ url: '/creditCard/getList', params: data }),
    getAccounts: data => http({ url: '/creditCard/getAccounts', params: data, showLoading: false }),
    review: data => http({ url: '/creditCard/review', params: data, showLoading: false }),
    exportList: data => http({ url: '/creditCard/exportList', params: data, showLoading: false }),
    modifyNote: data => http({ url: '/creditCard/modifyNote', params: data }),
    addDetail: data => http({ url: '/creditCard/addDetail', params: data }),
    checkReview: data => http({ url: '/creditCard/checkReview', params: data }),
    getReimburseList: data => http({ url: '/creditCard/getReimburseList', params: data }),
    reimburse: data => http({ url: '/creditCard/reimburse', params: data }),
    getReimburseDatail: data=>http({url:'/creditCard/getReimburseDatail', params: data})
}

export default creditCard