import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// 用户信息
const useUserStore = defineStore('user', () => {
  const user = ref({})
  const setUser = (data) => {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
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

  return { user, setUser, canAudit, canModify, canCancel, canDelete, canModifyNote }
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

  return { accounts, payouts, incomes, currencies, setAccounts, getAccountInfo, setPayouts, setInComes, setCurrencies }

})

export {
  useUserStore,
  useAccountStore
}