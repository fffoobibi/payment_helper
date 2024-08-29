import http from "@/utils/http"
export default {
    getList: (data) => http({ url: '/transferAccounts/getList', params: data })
}