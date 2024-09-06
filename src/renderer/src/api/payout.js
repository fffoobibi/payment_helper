import http from '@/utils/http'

const payouts = {
    getPayoutList: data => http({ url: '/payout/getPayoutList', params: data, showLoading: false }),
    savePayout: data => http({ url: '/payout/addPayout', params: data }),
    editPayout: data => http({ url: '/payout/editPayout', params: data }),
    modifyNote: data => http({ url: '/payout/modifyNote', params: data }),
    auditPayout: data => http({ url: '/payout/auditEditPayout', params: data }),
    cancelPayout: data => http({ url: '/payout/cancelEditPayout', params: data }),
}

export default payouts