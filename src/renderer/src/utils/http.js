import axios from 'axios'
import { ElLoading } from 'element-plus'
import Message from '@/utils/message'
import logger from '@/utils/logger'
import { useUserStore } from '@/stores'

const env = import.meta.env
const store = useUserStore()
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
  (config) => {
    if (config.showLoading) {
      loading = ElLoading.service({
        lock: true,
        text: config.loadingText || '加载中...',
        background: 'rgba(0, 0, 0, 0.2)'
      })
    }

    if (config.url != '/passport/login') {
      const userId = store.user.id
      config.data?.set('user_id', userId)
    }
    return config
  },
  (error) => {
    if (error.config.showLoading && loading) {
      loading.close()
    }
    logger.error('请求发送失败', error)
    Message.error('请求发送失败')
    return Promise.reject(error)
  }
)

// 添加响应拦截器
instance.interceptors.response.use(
  async (response) => {
    const {
      showLoading,
      errorCallback,
      showError = true,
      responseType,
      onSuccess
    } = response.config
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
        console.log(
          `[DEBUG] [${response.config?.method?.toUpperCase()}] ` + response.config.url + ' ===>',
          res.response
        )
      }
      let returned
      if (onSuccess) {
        returned = onSuccess(res.response)
        if ((returned && typeof returned.then === 'function') || returned instanceof Promise) {
          returned = await returned
        }
      } else {
        returned = res.response
      }
      return Promise.resolve(returned || true)
    } else {
      if (res.code == 1007) {
        // 未登录，返回登录页
        location.href = '/login'
      } else {
        errorCallback && errorCallback(res)
        logger.error(
          `[${response.config?.method?.toUpperCase()}] ${response.config.url} fail, error info is `,
          res
        )
        Message.error(res.msg)
      }
      return Promise.reject({ showError, msg: res.msg })
    }
  },
  (error) => {
    if (error.response?.config.showLoading && loading) {
      loading.close()
    }
    console.log('error in request', error)
    logger.error(
      `[${error.response?.config?.method?.toUpperCase()}] ${error.response?.config?.url} fail, error is `,
      error.message
    )
    return Promise.reject({ showError: true, msg: '网络异常' })
  }
)

const http = (config) => {
  const {
    url,
    params = {},
    loadingText = '加载中...',
    dataType,
    showLoading = true,
    showError = true,
    responseType = 'json',
    method = 'post',
    onSuccess
  } = config

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
    token: token
  }
  if (method === 'post') {
    logger.info(`[post] ${url}, headers-token: ${headers.token}, form-data: `, formData)
    return instance.post(url, formData, {
      headers,
      showLoading,
      loadingText,
      showError,
      responseType,
      onSuccess,
      errorCallback: config.errorCallback
    })
  } else {
    logger.info(`[get] ${url}, headers-token: ${headers.token}`)
    return instance.get(url, {
      headers,
      showLoading,
      loadingText,
      showError,
      responseType,
      onSuccess,
      errorCallback: config.errorCallback
    })
  }
}

export default http
