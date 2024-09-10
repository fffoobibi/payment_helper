import { useUserStore } from '@/stores/index'
import { computedAsync } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref, reactive, computed, watch, toRaw } from 'vue'
const store = useUserStore()
// import Store from 'electron-store'
// const _store = new Store()

const Keys = {
  remmber: 'remmber',
  pinned: 'pinned',
  username: 'username',
  password: 'password',
  shortcut: 'shortcut',
  currentUserId: 'currentUserId',
  accountIndexs: 'accountIndexs',
  accountMenus: 'accountMenus'
}

const useLocalConfig = defineStore('localConfig', () => {
  const setId = ref(null)

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

  const getConfig = async (key, defaultValue = null) => {
    const field = `${store.user.id}.${key}`
    const rs = await electron.config.get(field, defaultValue)
    return _parsedResult(rs, defaultValue)
  }

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

  // isPin
  const isPin = computedAsync(async () => {
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

  const removeAccountIndex = value =>{
    const rs = [...new Set(accountIndexs.value)]
    const index = rs.indexOf(value)
    if(index>-1){
      accountIndexs.value.splice(index, 1)
    }
    setConfig(Keys.accountIndexs, [...new Set(accountIndexs.value)])
  }

  // accountMenus
  const accountMenus = ref([])
  const fetchAccountMenus = computedAsync(async () => {
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

  return {
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
    getConfig,
    setConfig
  }
})

export { Keys, useLocalConfig }

// const getDefault = (key, defaultValue) => {
//   const v = _store.get('currentUserId', null)
//   if (v === null || v === undefined) {
//     return null
//   }
//   const field = `${v}.${key}`
//   const rs = _store.get(field)
//   return rs
// }

// const useLocalConfig = defineStore('localConfig', () => {
//   const setId = ref(null)

//   const _parsedResult = (rs, defaultValue) => {
//     if (rs.value !== defaultValue) {
//       if (rs.expire === -1) {
//         return rs.value
//       }
//       if (Date.now() - rs.save >= rs.expire * 24 * 3600 * 1000) {
//         return defaultValue
//       }
//       return rs.value
//     }
//     return rs.value
//   }
//   const currentUserName = ref(() => {
//     const rs = getDefault(Keys.username)
//     return _parsedResult(rs, null)
//   })

//   const currentUserPasswd = ref(() => {
//     const rs = getDefault(Keys.password)
//     return _parsedResult(rs, null)
//   })

//   const currentUserRemeber = ref(() => {
//     const rs = getDefault(Keys.remmber)
//     return _parsedResult(rs, null)
//   })

//   const getConfig = (key, defaultValue = null) => {
//     const field = `${store.user.id}.${key}`
//     const rs = _store.get(field, defaultValue)
//     return _parsedResult(rs, defaultValue)
//   }

//   const setConfig = (key, value, expire = -1) => {
//     const field = `${store.user.id}.${key}`
//     const saved = { value, save: Date.now(), expire }

//     if (setId.value === null) {
//       setId.value == store.user.id
//       _store.set(Keys.currentUserId, store.user.id)
//     } else {
//       if (setId.value !== store.user.id) {
//         setId.value == store.user.id
//         _store.set(Keys.currentUserId, store.user.id)
//       }
//     }
//     _store.set(field, saved)
//   }

//   // isPin
//   const isPin = ref( () => {
//     return getDefault(Keys.pinned)
//   })

//   const setPin = (value) => {
//     isPin.value = value
//     setConfig(Keys.pinned, value)
//   }

//   return {
//     // refs,
//     isPin,
//     setPin,
//     currentUserName,
//     currentUserPasswd,
//     currentUserRemeber,
//     getConfig,
//     setConfig
//   }
// })

// export { Keys, useLocalConfig }
