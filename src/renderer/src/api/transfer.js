import http from "@/utils/http"
export default {
    getList: (data) => http({ url: '/transferAccounts/getList', params: data }),
    getDetail: (data)=>http({url: '/transferAccounts/getDetail', params: data}),
    modifyNote: (data)=>http({url: '/transferAccounts/modifyNote', params: data})
}