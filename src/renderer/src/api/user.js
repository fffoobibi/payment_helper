import http from '@/utils/http'

const user = {
  login: data => http({ url: '/passport/login', params: data }),
  getAccountList: data => http({ url: '/account/getAccountAllList', params: data }),
  getPayOutList: () => http({ url: "/accountTitle/getClientSubject", method: "get" }),
  getInComeList: () => http({ url: "/accountTitle/getClientSubject?type=1", method: "get" }),
  getCurrencyList: () => http({ url: "/incomeRecord/getCurrencies", method: "get" })
}

export default user