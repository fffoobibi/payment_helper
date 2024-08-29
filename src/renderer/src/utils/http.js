import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '@/utils/message'

const env = import.meta.env
const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json'
const instance = axios.create({
  baseURL: '/api',
  timeout: 20 * 1000,
  withCredentials: true
})

let loading = null


// 添加请求拦截器
instance.interceptors.request.use(
  config => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: config.loadingText || '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }

    return config
  },
  error => {
    if (error.config.showLoading && loading) {
      loading.close()
    }
    Message.error('请求发送失败')
    return Promise.reject(error)
  }
)


// 添加响应拦截器
instance.interceptors.response.use(
  response => {
    const { showLoading, errorCallback, showError = true, responseType } = response.config
    if (showLoading && loading) {
      setTimeout(() => {
        loading.close()
      }, 500)
    }

    const res = response.data
    if (responseType === 'blob' || responseType === 'arraybuffer') {
      return res
    }

    if (res.code === 0) {
      if (env.DEV) {
        console.log(`[DEBUG] [${response.config?.method?.toUpperCase()}] ` + response.config.url + " ===>", res.response)
      }
      return Promise.resolve(res.response || true)
    } else {
      if (res.code == 1007) {
        // 未登录，返回登录页
        location.href = '/login'
      } else {
        errorCallback && errorCallback(res)
        Message.error(res.msg)
      }
      return Promise.reject({ showError, msg: res.msg })
    }
  },
  error => {
    if (error.config.showLoading && loading) {
      loading.close()
    }
    return Promise.reject({ showError: true, msg: '网络异常' })
  }
)

const http = config => {
  const { url, params = {}, loadingText = "加载中...", dataType, showLoading = true, showError = true, responseType = 'json', method = "post" } = config

  const formData = new FormData()
  for (const key in params) {
    formData.append(key, params[key] !== null && params[key] !== undefined ? params[key] : '')
  }

  let contentType = contentTypeForm
  if (dataType === 'json') {
    contentType = contentTypeJson
  }

  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': contentType,
    'X-Requested-With': 'XMLHttpRequest',
    'token': token
  }
  if (method === "post") {
    return instance.post(url, formData, {
      headers,
      showLoading,
      loadingText,
      showError,
      responseType,
      errorCallback: config.errorCallback
    })
  } else {
    return instance.get(url, {
      headers,
      showLoading,
      loadingText,
      showError,
      responseType,
      errorCallback: config.errorCallback
    })
  }

}

export default http
