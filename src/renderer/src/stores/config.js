import { useUserStore } from '@/stores/index'
import { computedAsync } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref, watch, toRaw, onMounted } from 'vue'
import _ from "lodash"
const store = useUserStore()


const Keys = {
  remmber: 'remmber',
  pinned: 'pinned',
  username: 'username',
  password: 'password',
  shortcut: 'shortcut',
  currentUserId: 'currentUserId',
  accountIndexs: 'accountIndexs',
  accountMenus: 'accountMenus',

  formalUrl: 'formalUrl',
  testUrl: 'testUrl',
  autoClick: 'autoClick',
  autoConfirm: 'autoConfirm'
}
const getConfig = async (key, defaultValue = null) => {
  const field = `${store.user.id}.${key}`
  const rs = await electron.config.get(field, defaultValue)
  return _parsedResult(rs, defaultValue)
}

const setConfig = async (key, value, expire = -1) => {
  const field = `${store.user.id}.${key}`
  const saved = { value, save: Date.now(), expire }
  electron.config.set(field, saved)
}

const _parsedResult = (rs, defaultValue) => {
  if (rs.value !== defaultValue) {
    if (rs.expire === -1) {
      return rs.value
    }
    if (Date.now() - rs.save >= rs.expire * 24 * 3600 * 1000) {
      return defaultValue
    }
    return rs.value
  }
  return rs.value
}

const useLocalConfig = defineStore('localConfig', () => {
  const setId = ref(null)

  const setConfig = async (key, value, expire = -1) => {
    const field = `${store.user.id}.${key}`
    const saved = { value, save: Date.now(), expire }

    if (setId.value === null) {
      setId.value == store.user.id
      electron.config.set(Keys.currentUserId, store.user.id)
    } else {
      if (setId.value !== store.user.id) {
        setId.value == store.user.id
        electron.config.set(Keys.currentUserId, store.user.id)
      }
    }
    electron.config.set(field, saved)
  }

  const currentUserName = computedAsync(async () => {
    const rs = await electron.config.getDefault(Keys.username)
    return _parsedResult(rs, null)
  }, null)

  const currentUserPasswd = computedAsync(async () => {
    const rs = await electron.config.getDefault(Keys.password)
    return _parsedResult(rs, null)
  }, null)

  const currentUserRemeber = computedAsync(async () => {
    const rs = await electron.config.getDefault(Keys.remmber)
    return _parsedResult(rs, null)
  }, null)



  // isPin
  const isPin = computedAsync(async () => {
    store.user.id
    const rs = await electron.config.getDefault(Keys.pinned)
    return _parsedResult(rs, null)
  }, false)

  const setPin = (value) => {
    isPin.value = value
    setConfig(Keys.pinned, value)
  }

  // accountIndexs
  const accountIndexs = ref([])
  const fetchAccountIndexs = computedAsync(async () => {
    store.user.id
    const rs = await electron.config.getDefault(Keys.accountIndexs)
    return _parsedResult(rs, [])
  }, [])

  watch(
    fetchAccountIndexs,
    (newData) => {
      console.log('fetch local indexs ...')
      newData.forEach((v) => {
        accountIndexs.value.push(v)
      })
    },
    { immediate: false }
  )

  const setAccountIndexs = (value) => {
    accountIndexs.value.push(value)
    setConfig(Keys.accountIndexs, [...new Set(accountIndexs.value)])
  }

  const removeAccountIndex = value => {
    const rs = [...new Set(accountIndexs.value)]
    const index = rs.indexOf(value)
    if (index > -1) {
      accountIndexs.value.splice(index, 1)
    }
    setConfig(Keys.accountIndexs, [...new Set(accountIndexs.value)])
  }

  // accountMenus
  const accountMenus = ref([])
  const fetchAccountMenus = computedAsync(async () => {
    store.user.id
    const rs = await electron.config.getDefault(Keys.accountMenus)
    const dft = _parsedResult(rs, [
      {
        id: -1,
        label: '默认',
        children: []
      }
    ])
    if (dft.length == 0) {
      return [
        {
          id: -1,
          label: '默认',
          children: []
        }
      ]
    }
    return dft
  })

  watch(
    fetchAccountMenus,
    (newData) => {
      console.log('fetch local menus ...')
      newData.forEach((v) => {
        accountMenus.value.push(v)
      })
    },
    { immediate: false }
  )

  const updateAccountMenus = () => {
    setConfig(Keys.accountMenus, [...toRaw(accountMenus.value)])
  }


  // 自动点单确认
  const autoConfirm = ref('')
  onMounted(() => {
    const fetchAutoConfirm = computedAsync(async () => {
      console.log('fetch local autoConfirm ...')
      store.user.id
      const rs = await electron.config.getDefault(Keys.autoConfirm, { save: Date.now(), value: true, expire: -1 })
      const dft = _parsedResult(rs)
      return dft
    })

    watch(
      fetchAutoConfirm,
      v => {
        autoConfirm.value = v
      },
      { immediate: false }
    )

  })

  const updateAutoConfirm = () => {
    setConfig(Keys.autoConfirm, toRaw(autoConfirm.value))
  }

  // 自动点单关闭
  const autoClick = ref('')

  onMounted(() => {
    const fetchAutoClick = computedAsync(async () => {
      const rs = await electron.config.getDefault(Keys.autoClick, { save: Date.now(), value: false, expire: -1 })
      const dft = _parsedResult(rs)
      return dft
    })

    watch(
      fetchAutoClick,
      v => {
        autoClick.value = v
      },
      { immediate: false }
    )
  })

  const updateAutoClick = () => {
    setConfig(Keys.autoClick, toRaw(autoClick.value))
  }

  // 正式服
  const formalUrl = ref()
  const fetchFormalUrl = computedAsync(async () => {
    store.user.id
    const rs = await  electron.config.getDefault(Keys.formalUrl, { save: Date.now(), value: 'http://bdapi.baizhoucn.com:2501', expire: -1 })
    return _parsedResult(rs, )
  },)
  watch(fetchFormalUrl, v => {
    formalUrl.value = v
  }, { immediate: false })

  // watch(formalUrl, v=>{
  //   console.log('change ....');
  //   _.debounce(()=>{
  //     console.log('save to local ...');
  //     updateFormalUrl()
  //   }, 200)
  // })
  const updateFormalUrl = () => {
    setConfig(Keys.formalUrl, toRaw(formalUrl.value))
  }

  // 測試服
  const testUrl = ref()
  const fetchTestUrl = computedAsync(async () => {
    store.user.id
    const rs = await  electron.config.getDefault(Keys.testUrl,  { save: Date.now(), value: 'http://192.168.0.10:20011', expire: -1 })
    return _parsedResult(rs)
  },)
  watch(fetchTestUrl, v => {
    testUrl.value = v
  }, { immediate: false })
  const updateTestUrl = () => {
    setConfig(Keys.testUrl, toRaw(testUrl.value))
  }

  return {
    setConfig,

    isPin,
    setPin,
    accountIndexs,
    setAccountIndexs,
    removeAccountIndex,
    accountMenus,
    updateAccountMenus,
    currentUserName,
    currentUserPasswd,
    currentUserRemeber,

    autoConfirm,
    updateAutoConfirm,
    autoClick,
    updateAutoClick,

    formalUrl,
    updateFormalUrl,
    testUrl,
    updateTestUrl
  }
})

export {
  Keys,
  useLocalConfig,
  getConfig,
  setConfig
}
