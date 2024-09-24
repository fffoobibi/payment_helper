import { computed, ref, watch, watchEffect } from 'vue'
import { defineStore } from 'pinia'
import { get } from 'lodash'

// 用户信息
const useUserStore = defineStore('user', () => {
  const user = ref({})
  const showUpdate = ref(false)
  const setUser = (data) => {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }
  const logOut = () => {
    user.value = {}
    showUpdate.value = false
  }
  // 审核权限
  const canAudit = computed(() => {
    return user.value.auth_list.includes('/payment_assistant_apply_modify')
  })
  // 修改权限
  const canModify = computed(() => {
    return user.value.auth_list.includes('/payment_assistant_apply_modify')
  })
  // 撤销权限
  const canCancel = computed(() => {
    return user.value.auth_list.includes('/payment_assistant_cancel_modify')
  })
  // 删除权限
  const canDelete = computed(() => {
    return user.value.auth_list.includes('/payment_assistant_delete')
  })
  // 修改备注权限
  const canModifyNote = computed(() => {
    return user.value.auth_list.includes('/payment_assistant_note_modify')
  })

  return { user, setUser, canAudit, canModify, canCancel, canDelete, canModifyNote, showUpdate, logOut }
})

// 银行账户下拉列表
const useAccountStore = defineStore('accounts', () => {
  const accountObject = ref({})
  const accounts = ref([])

  const payouts = ref([])  //科目支出
  const incomes = ref([])  //科目收入
  const currencies = ref([]) // 币种列表

  const setAccounts = (data) => {
    accounts.value = data
    const obj = {}
    data.forEach(element => {
      obj[element.id] = element
    })
    accountObject.value = obj
    localStorage.setItem('accounts', JSON.stringify(data))
  }

  const getAccountInfo = accountId => {
    return accountObject.value[accountId]
  }

  const setPayouts = data => {
    payouts.value = data
  }

  const setInComes = data => {
    incomes.value = data
  }

  const setCurrencies = data => {
    currencies.value = data
  }

  const getAccounts = () => {
    if (accounts.value.length > 0) {
      return accounts
    }
    const rs = localStorage.getItem('accounts')
    if (rs) {
      accounts.value = JSON.parse(rs)
    }
    return accounts
  }

  return { accounts, payouts, incomes, currencies, setAccounts, getAccountInfo, setPayouts, setInComes, setCurrencies, getAccounts }

})


const useAirwallexStore = defineStore('airwallex', () => {
  const config = ref({})

  const setConfig = data => {
    config.value = data
    localStorage.setItem('airwallexConfig', JSON.stringify(data))
  }

  const getConfig = () => {
    if (config.value.length > 0) {
      return config
    }
    const rs = localStorage.getItem('airwallexConfig')
    if (rs) {
      config.value = JSON.parse(rs)
    }
    return config
  }

  return { config, setConfig, getConfig }
})

const useLogStore = defineStore('logStore', () => {
  const content = ref('')
  const dynamic = ref([])
  const file = ref('')
  const append = v => {
    dynamic.value.push(v)
  }
  return { content, dynamic, file, append }
})

const useUpdateStore = defineStore('updateStore', () => {
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes) return ''

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const checking = ref(false)
  const update_err = ref(false)
  const update_success = ref(false)
  const update_info = ref({})
  const version = ref(null)
  const downloading = ref(false)
  const canUpdate = ref(false)

  const percent = computed(() => {
    if (update_success.value) {
      return 100
    }
    if (update_info.value.percent) {
      return update_info.value.percent.toFixed(2)
    }
    return 0
  })

  const download_info = computed(() => {
    if (downloading.value && update_info.value.total) {
      const { total, bytesPerSecond } = update_info.value
      const speed = formatBytes(bytesPerSecond, 2)
      const all = formatBytes(total, 2)
      return `${speed}/s ${all}`
    }
  })

  return {
    checking, update_success, update_info, update_err, version, downloading, canUpdate,
    percent,
    download_info
  }
})

const useWindowStore = defineStore('windowStore', () => {
  const user = ref({})
  const excelFile = ref(null)
  const excelData = ref(null)
  return {
    user, excelFile, excelData
  }
})

export {
  useUserStore,
  useAccountStore,
  useAirwallexStore,
  useLogStore,
  useUpdateStore,
  useWindowStore
}