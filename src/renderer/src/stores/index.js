import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { dateTimeFmt } from "@/utils/format"
import { computedAsync } from '@vueuse/core'
import { useRoute } from 'vue-router'

// 用户信息
const useUserStore = defineStore('user', () => {
  const user = ref({})
  const showUpdate = ref(false)
  const setUser = (data) => {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
    console.log('权限： ', data.auth_list);
  }
  const logOut = () => {
    user.value = {}
    showUpdate.value = false
  }
  // 审核权限
  const canAudit = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_apply_modify')
  })
  // 修改权限
  const canModify = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_apply_modify')
  })
  // 撤销权限
  const canCancel = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_cancel_modify')
  })
  // 删除权限
  const canDelete = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_delete')
  })
  // 修改备注权限
  const canModifyNote = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_note_modify')
  })

  // 打款明细导出权限
  const canExportDetails = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_detail')
  })

  //信用卡核销权限
  const canCreditCardReview = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_credit_card_review')
  })

  // 信用卡复核权限
  const canCreditCardCheckReview = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_credit_card_check_review')
  })

  // 信用卡报销权限
  const canCreditCardReimburse = computed(() => {
    return (user.value?.auth_list ?? []).includes('/payment_assistant_credit_card_reimburse')
  })
  return {
    user, setUser, canAudit, canModify, canCancel, canDelete, canModifyNote, canExportDetails, canCreditCardReview,
    canCreditCardCheckReview, canCreditCardReimburse,
    showUpdate, logOut
  }
})

// 银行账户下拉列表
const useAccountStore = defineStore('accounts', () => {
  const accountObject = ref({})
  const accountLabel = ref({})
  const accounts = ref([])

  const payouts = ref([])  //科目支出
  const incomes = ref([])  //科目收入
  const currencies = ref([]) // 币种列表
  const currencyCodes = computed(() => {
    return currencies.value.map(v => v.code)
  })

  const setAccounts = (data) => {
    accounts.value = data
    const obj = {}
    const labels = {}
    data.forEach(element => {
      obj[element.id] = element
      labels[element.account_name] = element.id
    })
    accountObject.value = obj
    accountLabel.value = labels
    localStorage.setItem('accounts', JSON.stringify(data))
  }

  const getAccountInfo = accountId => {
    return accountObject.value[accountId]
  }

  const getAccountId = accountName => {
    return accountLabel.value[accountName] ?? null
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

  return { accounts, payouts, incomes, currencies, setAccounts, getAccountInfo, getAccountId, setPayouts, setInComes, setCurrencies, getAccounts, currencyCodes }

})


const useAirwallexStore = defineStore('airwallex', () => {
  const config = ref({})

  const airwallex_binding = computed(() => {
    return config.value.airwallex_binding ?? []
  })

  const setConfig = data => {
    config.value = data
  }

  return { config, setConfig, airwallex_binding }
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

const useExcelStore = defineStore('windowStore', () => {
  const user = ref({})
  const excelFile = ref(null)
  const excelData = ref(null)
  const excelLoading = ref(false)
  const recvBatchExcelData = ref(null)
  return {
    user, excelFile, excelData, recvBatchExcelData, excelLoading
  }
})

const useScreenShortStore = defineStore('screenShortCutStore', () => {
  const image = ref('')
  const shortTag = ref('unset')
  const reSetTag = () => {
    shortTag.value = 'unset'
  }
  const route = useRoute()
  const _setTag = (v) => {
    shortTag.value = v
  }
  const onImageShortCutDown = (callback, tagName) => {
    watch(image, src => {
      const t = shortTag.value
      callback(route, src, t, reSetTag)
    })
    return () => {
      // todo
    }
  }
  return { image, onImageShortCutDown, setTag: _setTag, reSetTag}
})

const useDingdingSubmitStore = defineStore('dingdingStore', () => {
  const approve = ref({})
  const reset = () => {
    approve.value = {}
  }
  const flag = ref(Date.now())

  const change = () => {
    flag.value = Date.now()
  }
  return {
    approve, reset, change, flag
  }
})

const useOperateRecords = defineStore('operateRecords', () => {
  const s = ref(new Set())
  const indexs = ref({})

  const treeData = ref([])
  const treeProps = ref({
    value: 'id',
    label: 'title',
    children: 'children',
  })
  const treeExpand = ref([])

  const records = ref([])
  const totalCount = computed(() => {
    return records.value.length
  })
  const todayCount = computed(() => {
    const dayKey = dateTimeFmt(Date.now(), 3)
    const dayIndex = indexs.value[dayKey]
    const ts = treeData.value[dayIndex]
    if (ts) {
      return ts.children.length
    }
    return 0
  })

  const reset = () => {
    s.value = new Set()
    indexs.value = {}

    treeData.value = []
    records.value = []
    treeExpand.value = []

  }
  const append = data => {
    const td = dateTimeFmt(new Date, 3)
    const dayKey = dateTimeFmt(data.create_time / 1000, 3)
    records.value.push(data)

    if (!s.value.has(dayKey)) {
      indexs.value[dayKey] = Object.keys(indexs.value).length
      s.value.add(dayKey)
      treeData.value.push({
        id: - indexs.value[dayKey],
        title: dayKey,
        children: [data]
      })
    } else {
      treeData.value[indexs.value[dayKey]].children.push(data)
    }
    treeExpand.value = [-indexs.value[dayKey]]
  }

  const current = computed(() => {
    if (records.value.length) {
      return records.value[records.value.length - 1]
    }
  })


  const loadRecords = async (userId) => {
    const r = await electron.operate.getRecords(userId)
    records.value.slice(0)
    records.value.push(...r)
    const values = {}
    const td = dateTimeFmt(new Date, 3)
    let tdIndex

    r.forEach((v, index) => {
      const dayKey = dateTimeFmt(v.create_time / 1000, 3)
      if (!s.value.has(dayKey)) {
        values[dayKey] = [v]
        s.value.add(dayKey)
      } else {
        values[dayKey].push(v)
      }
    })

    treeData.value = Object.keys(values).map((k, i) => {
      indexs.value[k] = i
      if (td === k) {
        tdIndex = -i
      }
      return { id: -i, title: k, children: values[k] }
    })
    if (tdIndex !== undefined) {
      treeExpand.value = [tdIndex]
    }
  }

  return {
    reset,
    totalCount,
    todayCount,
    treeData,
    treeProps,
    treeExpand,
    append,
    records,
    current,
    loadRecords
  }
})

const useRecordFilterStore = defineStore('recordFilterStore', () => {

  const urls = computedAsync(async () => {
    return await electron.operate.recordUrls()
  })
  return {
    urls
  }

})

const useDialogStore = defineStore('dialogStore', () => {
  const user = ref({})
  const setUser = data => {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }
  const dynamic = ref({
    fetchDetailFlag: false
  })
  return {
    user, setUser, dynamic
  }
})


export {
  useUserStore,
  useAccountStore,
  useAirwallexStore,
  useLogStore,
  useUpdateStore,
  useExcelStore,
  useScreenShortStore,
  useDingdingSubmitStore,
  useOperateRecords,
  useRecordFilterStore,
  useDialogStore
}