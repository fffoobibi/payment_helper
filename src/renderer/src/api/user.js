import http from '@/utils/http'

const user = {
  login: data => http({ url: '/passport/login', params: data, showError: false }),
  getAccountList: data => http({ url: '/account/getAccountAllList', params: data }),
  getPayOutList: () => http({ url: "/accountTitle/getClientSubject", method: "get" }),
  getInComeList: () => http({ url: "/accountTitle/getClientSubject?type=1", method: "get" }),
  getCurrencyList: () => http({ url: "/incomeRecord/getCurrencies", method: "get" }),
  getAccountDetail: data => http({ url: '/account/getAccountDetail', params: data, showLoading: false }),
  changePwd: data => http({ url: '/passport/changePws', params: data }),
  getAssistantDetails: data=>http({url: '/account/getAssistantDetails', params: data, showLoading: false})
}

export default user