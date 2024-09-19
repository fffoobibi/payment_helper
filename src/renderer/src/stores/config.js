import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/index'
import { computedAsync } from '@vueuse/core'
import { ref, watch, toRaw, computed } from 'vue'
import { debounce } from "lodash"
const env = import.meta.env

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
  autoConfirm: 'autoConfirm',
  uploadFormalUrl: 'uploadFormalUrl',
  uploadTestUrl: 'uploadTestUrl',
}

const Globals = {
  formalUrl: 'formalUrl',
  testUrl: 'testUrl',
  uploadFormalUrl: 'uploadFormalUrl',
  uploadTestUrl: 'uploadTestUrl',
  pro: 'pro'
}

const _parsedResult = (rs, defaultValue) => {
  if (rs === undefined) {
    return defaultValue
  }
  if (rs.expire === -1) {
    return rs.value === undefined ? defaultValue : rs.value
  }
  if (Date.now() - rs.save >= rs.expire * 24 * 3600 * 1000) {
    return defaultValue
  }
  return rs.value
}

const useLocalConfig = defineStore('localConfig', () => {
  const store = useUserStore()

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


  const getConfig = async (key, defaultValue = null) => {
    const field = `${store.user.id}.${key}`
    const rs = await electron.config.get(field)
    return _parsedResult(rs, defaultValue)
  }

  const makeScope = (initValue, fetch, key, options = { debounced: false, depends: null, autoSave: false }) => {
    const refV = ref(initValue)
    const fetChRef = computedAsync(fetch)
    const dep = [...(options.depends || []), store.user.id]

    watch(fetChRef, v => {
      refV.value = v
    }, { immediate: false })

    watch(refV, val => {
      if (options.autoSave) {
        setConfig(key, toRaw(val))
      }
    }, { immediate: false })

    let update
    if (options.debounced) {
      update = debounce((val) => {
        if (val !== undefined) {
          refV.value = val
        }
        setConfig(key, toRaw(refV.value))
      }, 500)
    } else {
      update = (val) => {
        if (val !== undefined) {
          refV.value = val
        }
        setConfig(key, toRaw(refV.value))
      }
    }
    return { refV, update }
  }


  const setGlobalConfig = async (key, value, expire = -1) => {
    const saved = { value, save: Date.now(), expire }
    electron.config.set(key, saved)
  }

  const getGlobalConfig = async (key, defaultValue) => {
    const rs = await electron.config.get(key)
    return _parsedResult(rs, defaultValue)
  }

  const makeGlobal = (initValue, fetch, key, options = { debounced: false, autoSave: false }) => {
    const refV = ref(initValue)
    const fetChRef = computedAsync(fetch)
    watch(fetChRef, v => {
      if (v !== undefined) {
        refV.value = v
      }
    }, { immediate: false })

    watch(refV, val => {
      if (options.autoSave) {
        setGlobalConfig(key, toRaw(val))
      }
    }, { immediate: false })

    let update
    if (options.debounced) {
      update = debounce((val) => {
        if (val !== undefined) {
          refV.value = val
        }
        setGlobalConfig(key, toRaw(refV.value))
      }, 500)
    } else {
      update = (val) => {
        if (val !== undefined) {
          refV.value = val
        }
        setGlobalConfig(key, toRaw(refV.value))
      }
    }
    return { refV, update }
  }

  // currentUserName
  const { refV: currentUserName } = makeScope(null, async () => {
    const rs = await electron.config.getDefault(Keys.username)
    return _parsedResult(rs, null)
  }, Keys.username)

  const { refV: currentUserPasswd } = makeScope(null, async () => {
    const rs = await electron.config.getDefault(Keys.password)
    return _parsedResult(rs, null)
  }, Keys.password)

  const { refV: currentUserRemeber } = makeScope(null, async () => {
    const rs = await electron.config.getDefault(Keys.remmber)
    return _parsedResult(rs, null)
  }, Keys.remmber)

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
      accountIndexs.value = []
      newData.forEach((v) => {
        accountIndexs.value.push(v)
      })
    },
    { immediate: false }
  )

  const setAccountIndexs = (value) => {
    accountIndexs.value.slice(0, accountIndexs.value.length)
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
      accountMenus.value = []
      newData.forEach((v) => {
        accountMenus.value.push(v)
      })
    },
    { immediate: false }
  )

  const updateAccountMenus = () => {
    setConfig(Keys.accountMenus, [...toRaw(accountMenus.value)])
  }

  // isPin
  const { refV: isPin, update: setPin } = makeScope(false, async () => {
    return await getConfig(Keys.pinned)
  }, Keys.pinned)

  // 自动点单确认
  const { refV: autoConfirm, update: updateAutoConfirm } = makeScope(true, async () => {
    return await getConfig(Keys.autoConfirm)
  }, Keys.autoConfirm)

  // 自动点单关闭
  const { refV: autoClick, update: updateAutoClick } = makeScope(false, async () => {
    return await getConfig(Keys.autoClick)
  }, Keys.autoClick)

  // 正式服
  const { refV: formalUrl, update: updateFormalUrl } = makeGlobal('http://bdapi.baizhoucn.com:2501', async () => {
    return await getGlobalConfig(Globals.formalUrl)
  }, Globals.formalUrl, { debounced: true })

  // 測試服
  const { refV: testUrl, update: updateTestUrl } = makeGlobal('http://192.168.0.10:20011', async () => {
    return await getGlobalConfig(Globals.testUrl)
  }, Globals.testUrl, { debounced: true })

  // 图片上传正式服
  const { refV: uploadFormalUrl, update: updateUploadFormal } = makeGlobal('http://bdupload.baizhoucn.com', async () => {
    return await getGlobalConfig(Globals.uploadFormalUrl)
  }, Globals.uploadFormalUrl, { debounced: true })

  // 图片上传测试服
  const { refV: uploadTestUrl, update: updateUploadTest } = makeGlobal('http://192.168.0.10/index.php', async () => {
    return await getGlobalConfig(Globals.uploadTestUrl)
  }, Globals.uploadTestUrl, { debounced: true })

  const { refV: mode, update: updateMode } = makeGlobal(true, async () => {
    return await getGlobalConfig(Globals.pro)
  }, Globals.pro, { autoSave: true })


  // prod
  const apiUrl = computed(() => {
    if (env.PROD) {
      if (mode.value) {
        return formalUrl.value
      } else {
        return testUrl.value
      }
    }

  })

  const uploadUrl = computed(() => {
    if (env.PROD) {
      if (mode.value) {
        return uploadFormalUrl.value
      } else {
        return uploadTestUrl.value
      }
    }
  })

  return {
    apiUrl,
    uploadUrl,

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
    updateTestUrl,

    uploadFormalUrl,
    updateUploadFormal,
    uploadTestUrl,
    updateUploadTest,

    mode,
    updateMode

  }
})

export {
  Keys,
  Globals,
  useLocalConfig,
}
