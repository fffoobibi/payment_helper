import http from '@/utils/http'

const transit = {
    getTransitList: data => http({ url: '/transit/getTransitList', params: data }),
    getAccountDetail: data => http({ url: '/account/getAccountDetail', params: data }),
    addTransit: data => http({ url: '/transit/save', params: data }),
    editTransit: data => http({ url: '/transit/modify', params: data }),
    cancelTransit: data => http({ url: '/transit/cancel', params: data }),
    noteTransit: data=>http({url: '/transit/modifyNote', params: data, loadingText: "提交中...."}),
    auditTransit: data => http({ url: '/transit/audit', params: data }),
    deleteTransit: data => http({ url: '/transit/delete', params: data }),
    replenishTransit: data => http({ url: '/transit/replenish', params: data }),
    arrivalTransit: data => http({ url: '/transit/arrival', params: data }),
}

export default transit