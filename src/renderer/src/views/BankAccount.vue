<script setup>
import BankAccountIncome from "@/views/BankAccountIncome.vue"
import BankAccountPayout from "@/views/BankAccountPayout.vue"
import BankAccountHistory from "@/views/BankAccountHistory.vue"
import BankAccountRecord from "@/views/BankAccountRecord.vue"

import { reactive, ref, watch, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores"
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
import { useLocalConfig } from "@/stores/config"
import { setUpCapture } from "@/utils/tools"
import api from "@/api"
import { computed } from 'vue'
import message from '@/utils/message'
import logger from "../utils/logger"
const configStore = useLocalConfig()
const { accountIndexs, accountMenus } = storeToRefs(configStore)
const store = useUserStore()
const { height, width } = useClient()

const queryFormRef = ref(null)
const queryForm = reactive({
  page: {
    currentPage: 1,
    pageSize: 100,
    totalCount: 0,
  },
  search: {
    account_name: '',
    user_id: store.user.id,
    page: 1,
    limit: 10,
  },
  tableData: [],
  hasSearch: false
})

const menuRef = ref(null)
const menuInputRef = ref(null)
const menuItemClick = (item, row) => {
  if (row.__pinned === true && item.label == '置顶') {
    row.__pinned = false
    configStore.removeAccountIndex(row.id)
    onSearch(1, null)
    return
  }
  if (item.label === '置顶') {
    configStore.setAccountIndexs(row.id)
    row.__pinned = true
    onSearch(1, null)
  } else if (item.label === '隐藏到...') {
    form.menuData.menuDir = ''
    form.menuData.menuBindId = row.id
    form.menuData.menuBindName = row.account_name
    form.menuShow = true
  } else if (item.label.startsWith('隐藏到') && item.label !== '隐藏到...') {
    form.menuData.menuDir = item.label.replace('隐藏到', '')
    form.menuData.menuBindId = row.id
    form.menuData.menuBindName = row.account_name
    row.__hidden = true
    addMenu()
  }
}
const menuItems = computed(() => {
  const others = accountMenus.value.map(v => {
    return { label: "隐藏到" + v.label }
  })
  return [
    {
      label: '置顶'
    },
    {
      label: '隐藏',
      children: [
        ...others,
        { label: '隐藏到...' }
      ]
    },
  ]
})

const removeMenu = (node, data) => {
  const { parent } = node
  const updateItem = accountMenus.value[-parent.data.id - 1]
  const item = updateItem.children.findIndex(v => v.id == data.id)
  if (item > -1) {
    updateItem.children.splice(item, 1)
    const row = queryForm.tableData.find(item => item.id == data.id)
    row.__hidden = false
    configStore.updateAccountMenus()
  }
}

const checkedState = computed(() => {
  const checked = []
  const unChecked = []
  accountMenus.value.forEach((v) => {
    if (v.children) {
      v.children.forEach(vv => {
        if (vv.checked) {
          checked.push(vv.id)
        } else {
          unChecked.push(vv.id)
        }
      })
    }
  })
  return {
    checked, unChecked
  }
})

const removeMenus = (a1, a2) => {
  let updateItem
  if (a1.id < 0) {
    updateItem = accountMenus.value[-a1.id - 1]
  } else {
    for (let i = 0; i < accountMenus.value.length; i++) {
      const find = accountMenus.value[i].children.map(v => v.id)
      if (find.includes(a1.id)) {
        updateItem = accountMenus.value[i]
        break
      }
    }
  }
  const allKeys = []
  accountMenus.value.forEach((v) => {
    if (v.children) {
      allKeys.push(...v.children.map(vv => vv.id))
    }
    allKeys.push(v)
  })

  const checkKeys = a2.checkedKeys
  updateItem.children.forEach(v => {
    if (checkKeys.includes(v.id)) {
      v.checked = true
    } else {
      v.checked = false
    }
  })

  queryForm.tableData.map(v => {
    if (checkedState.value.checked.includes(v.id)) {
      v.__hidden = true
    } else {
      v.__hidden = false
    }
  })
  configStore.updateAccountMenus()
}

const addMenu = () => {
  if (form.menuData.menuDir) {
    const index = accountMenus.value.findIndex((v) => v.label == form.menuData.menuDir)
    if (index > -1) {
      //存在
      const updateItem = accountMenus.value[index]
      const item = updateItem.children.find(v => v.id == form.menuData.menuBindId)
      if (!item) {
        //不存在则添加
        updateItem.children.push({ label: form.menuData.menuBindName, id: form.menuData.menuBindId, checked: true })
        accountMenus.value.splice(index, 1, updateItem)
        configStore.updateAccountMenus()
      } else {
        message.success('已收藏')
        // updateItem.values.push({ label: form.menuData.menuDir })
      }
    } else {
      // 不存在
      const addData = {
        id: -accountMenus.value.length,
        label: form.menuData.menuDir,
        children: [{ label: form.menuData.menuBindName, id: form.menuData.menuBindId, checked: true }]
      }
      accountMenus.value.push(addData)
      configStore.updateAccountMenus()
    }
    form.menuData.menuBindId = null
    form.menuData.menuBindName = ''
    form.menuData.menuDir = ''
    form.menuShow = false
  }
}


const nodeRef = ref(null)
const hiddenAccounts = computed(() => {
  const rs = []
  accountMenus.value.forEach(v => {
    v.children?.forEach(d => {
      if (d.checked) {
        rs.push(d.id)
      }
    })
  })
  return rs
})

const hiddenAccountShow = () => {
  nodeRef.value?.setCheckedKeys(hiddenAccounts.value)
}


const onResponsePinnedProcess = async (resp) => {
  const returned = []
  const pinned = []
  resp.list.forEach( (v, index) => {
    v.__index=index
    if (hiddenAccounts.value.includes(v.id)) {
      v.__hidden = true
    } else {
      v.__hidden = false
    }
    if (accountIndexs.value.includes(v.id)) {
      v.__pinned = true
      pinned.push(v)
    } else {
      v.__pinned = false
      returned.push(v)
    }
  })
  resp.list = pinned.concat(returned)
  return resp
}

const onSearch = async (page = null, pageSize = null) => {
  if (page != null) {
    queryForm.search.page = page
    queryForm.page.currentPage = page
  } else {
    queryForm.search.page = queryForm.page.currentPage
  }
  if (pageSize != null) {
    queryForm.search.limit = pageSize
  } else {
    queryForm.search.limit = queryForm.page.pageSize
  }
  const data = await api.bank_account.getList(queryForm.search, onResponsePinnedProcess)
  queryForm.tableData = data.list
  queryForm.page.totalCount = data.count
  queryForm.page.pageSize = data.limit
}

onMounted(() => {
  if (!queryForm.hasSearch) {
    onSearch(1, null)
    queryForm.hasSearch = true
  }
  console.log(import.meta.env);
})

watch(() => queryForm.page.currentPage, async () => {
  await onSearch()
})

watch(() => queryForm.page.pageSize, async () => {
  queryForm.page.currentPage = 1
  await onSearch(1, null)
})

const tableHeight = computed(() => {
  const h = queryFormRef.value?.$el.clientHeight || 0
  width.value + 1
  let th
  if (h > 60) {
    th = 234
  } else {
    th = 184
  }
  if (queryForm.page.totalCount == 0) {
    return height.value - th
  }
  return height.value - th
})

const tableRef = ref(null)
const formRef = ref(null)

const renderTableRowClass = ({ row }) => {
  let name = ''
  if (row.__pinned) {
    name += 'account-pined'
  }
  if (row.__hidden) {
    name += ' hidden-row'
  }
  return name
}

const form = reactive({
  currentTab: '银行账户',
  available_balance: "",
  currency: "",
  mode: '',
  show: false,
  post: {
    user_id: store.user.id,
    out_account_id: null,
    in_account_id: null,
    origin_amount: null,
    currency: null,
    received_amount: null,
    received_currency: null,
    note: null,
    in_account_title_id: null,
    out_account_title_id: null,
    attachment_list: [],
  },
  noteShow: false,
  notePost: {
    note: '',
    user_id: store.user.id,
    voucher_ext_id: null
  },
  cancelShow: false,
  cancelPost: {
    user_id: store.user.id,
    voucher_ext_id: null
  },
  auditShow: false,
  auditPost: {
    application_reason: '',
    application: '',
    application_time: null,
    user_id: store.user.id,
    voucher_ext_id: null
  },
  menuShow: false,
  menuData: {
    menuDir: '',
    menuBindId: null,
    menuBindName: ''
  },

  incomeShow: false,
  incomes: {
    accountId: '',
    currency: '',
  },

  payoutShow: false,
  payout: {
    accountId: '',
    currency: '',
  },

  historyTabLabel: '历史',
  historyShow: false,
  history: {
    accountId: '',
    currency: '',
    balance: '',
    typeName: '',
    available: null,
  },
  recordShow: false,

  panzhangShow: false,
  panzhangCurrency: '',
  pangZhangTitle: '',
  panzhangState: {
    account_name: '',
    available_balance: null, //可用余额
    gold_rolling_balance: null, //  不可用余额子项  滚动金
    freeze_balance: null, //不可用余额子项  冻结
    deposit_balance: null, //不可用余额子项  押金
    withdrawable_balance: null, //不可用余额子项  可下撤资金
  },
  panzhangPost: {
    account_id: null,
    attachment_list: [],
    available_balance: null, //可用余额
    gold_rolling_balance: null, //  不可用余额子项  滚动金
    freeze_balance: null, //不可用余额子项  冻结
    deposit_balance: null, //不可用余额子项  押金
    withdrawable_balance: null,
  }
})

const formState = reactive({
  in_account_id_loading: false,
  out_account_id_loading: false,
  in_account_id_color: 'transparent',
  out_account_id_color: 'transparent',
  in_account_id_balance: '',
  out_account_id_balance: '',
  in_account_id_currency: '',
  out_account_id_currency: '',
  available_balance: computed(() => {
    const rs = parseFloat(formState.out_account_id_balance || '0') - parseFloat(form.post.origin_amount || '0')
    return numberFmt(rs)
  }),
  available_color: computed(() => {
    if (form.post.origin_amount) {
      return "black"
    } return "transparent"
  }),
  getDisabledState: name => {
    if (form.mode === "view") {
      return true
    }
    else if (form.mode == 'add') {
      if (["in_account_title_id", "out_account_title_id"].includes(name)) {
        return true
      } return false
    }
    else if (form.mode == 'edit') {
      if (["in_account_title_id", "out_account_title_id"].includes(name)) {
        return true
      } return false
    }
    return false
  },
  formTitle: computed(() => {
    if (form.mode == "add") {
      return "银行账户-添加"
    }
    else if (form.mode == "edit") {
      return "银行账户-编辑"
    }
    else if (form.mode == "view") {
      return "银行账户-查看"
    }
  })
})

watch(() => form.post.in_account_id, async () => {
  if (form.post.in_account_id) {
    formState.in_account_id_loading = true
    const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.in_account_id })
    formState.in_account_id_color = 'black'
    formState.in_account_id_loading = false
    formState.in_account_id_balance = numberFmt(resp.available_balance)
    formState.in_account_id_currency = resp.currency
  } else {
    formState.in_account_id_color = 'transparent'
    formState.in_account_id_balance = ''
    formState.in_account_id_currency = ''
  }
})

watch(() => form.post.out_account_id, async () => {
  if (form.post.out_account_id) {
    formState.out_account_id_loading = true
    const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.out_account_id })
    formState.out_account_id_color = 'black'
    formState.out_account_id_loading = false
    formState.out_account_id_balance = numberFmt(resp.available_balance)
    formState.out_account_id_currency = resp.currency
  } else {
    formState.out_account_id_color = 'transparent'
    formState.out_account_id_balance = ''
    formState.out_account_id_currency = ''
  }
})


const viewIncomes = async (row) => {
  form.incomes.currency = row.currency
  form.incomes.accountId = row.id
  form.incomeShow = true
  form.currentTab = '收入'
}

const viewPayouts = async (row) => {
  form.payout.currency = row.currency
  form.payout.accountId = row.id
  form.payoutShow = true
  form.currentTab = '支出'
}

const viewHistory = async (row) => {
  form.historyTabLabel = '历史-' + row.account_name
  form.historyShow = true
  form.history.typeName = row.type_name
  form.history.balance  = row.ending_balance
  form.history.available = row.is_available == 1 ? true: false
  form.history.accountId = row.id
  form.history.currency = row.currency
  form.currentTab = '历史'
}

const unavilable = computed(() => {
  return form.panzhangState.gold_rolling_balance || form.panzhangState.freeze_balance || form.panzhangState.deposit_balance ||
    form.panzhangState.withdrawable_balance
})

const viewPanZhang = async (row) => {
  try {
    const resp = await api.bank_account.getUnavailableShowStatus({ account_id: row.id })
    form.pangZhangTitle = '盘账'
    form.panzhangState.account_name = row.account_name
    form.panzhangState.available_balance = resp.available
    form.panzhangState.deposit_balance = resp.deposit
    form.panzhangState.freeze_balance = resp.freeze
    form.panzhangState.gold_rolling_balance = resp.gold_rolling
    form.panzhangState.withdrawable_balance = resp.withdrawable

    form.panzhangPost.account_id = row.id
    form.panzhangPost.attachment_list = []
    form.panzhangPost.available_balance = row.ending_balance
    form.panzhangPost.deposit_balance = row.deposit_balance
    form.panzhangPost.freeze_balance = row.freeze_balance
    form.panzhangPost.gold_rolling_balance = row.gold_rolling_balance
    form.panzhangPost.withdrawable_balance = row.withdrawable_balance
    form.panzhangCurrency = row.currency
    form.panzhangShow = true
  } catch (error) {

  }

}
const uploadRef = ref(null)
const rules = {
  attachment_list: [{
    required: true, validator: (...args) => {
      console.log('ref ', uploadRef.value);
      return uploadRef.value.validate(...args)
    }, trigger: 'blur'
  }]
}
const submitPanZhang = async () => {
  formRef.value.validate().then(async valid => {
    try {
      if (valid) {
        const uploads = await uploadRef.value.uploadImage()
        const data = { ...form.panzhangPost }
        data.attachment_list = JSON.stringify(uploads)
        message.success('盘账已完成!')
        form.panzhangShow = false
        onSearch(1, null)
      }
    } catch (err) {
      logger.error('盘账失败', err
      )
    }
  })
}

const tableState = {
  isToday(timestamp) {
    // 获取当前日期
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    // 将时间戳转换为日期对象
    const date = new Date(timestamp * 1000);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    // 比较两个日期是否相同
    return dayStart === todayStart;
  },
  getAccountState(row) {
    if (row.is_check_accounts != 1) {
      return ["无需盘账", "green"]
    }
    else if (!row.check_accounts_time) {
      return ['今日未盘', 'red']
    } else if (row.check_accounts_time) {
      if (this.isToday(row.check_accounts_time)) {
        return [timestampToFormattedString(row.check_accounts_time), 'blue']
      } else {
        return ['今日未盘', 'red']
      }
    }
  }
}

const crop = setUpCapture(src => {
  form.panzhangPost.attachment_list.push({
    url: src
  })
})

</script>

<template>
  <Layout>
    <template #layout-main-inner>
      <el-tabs v-model="form.currentTab" type="border-card" class="bank-tabs" closable @tab-remove="name => {
        if (name == '收入') {
          form.incomeShow = false
        } else if (name == '支出') {
          form.payoutShow = false
        } else if (name == '历史') {
          form.historyTabLabel = '历史'
          form.historyShow = false
        } else if (name == '日志') {
          form.recordShow = false
        }
        form.currentTab = '银行账户'
      }">
        <el-tab-pane label="银行账户" :closable="false" name="银行账户">
          <template #label>
            <span class="h4">银行账户</span>
          </template>
          <div class="pannel">
            <el-form :inline="true" :model="queryForm.search" class="demo-form-inline" ref="queryFormRef">
              <el-form-item label="银行名称">
                <el-input v-model="queryForm.search.account_name" placeholder="支持模糊查找" clearable />
              </el-form-item>
              <el-form-item>
                <el-space alignment="center">
                  <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
                  <el-button type="primary" @click="() => {
        form.recordShow = true
        form.currentTab = '日志'
      }">日志</el-button>
                  <el-popover placement="bottom" :width="380" trigger="click" hide-after="0" transition="none"
                    @show="hiddenAccountShow">
                    <template #reference>
                      <el-button type="primary"> {{ `账号隐藏 (${hiddenAccounts.length})` }}
                      </el-button>
                    </template>
                    <el-tree node-key="id" :default-checked-keys="hiddenAccounts" :data="accountMenus" show-checkbox
                      :expand-on-click-node="false" @check="(a1, a2) => removeMenus(a1, a2)" ref="nodeRef"
                      check-on-click-node default-expand-all>
                      <template #default="{ node, data }">
                        <span class="custom-tree-node">
                          <span>{{ node.label }}</span>
                          <span v-if="!data.children">
                            <el-button link type="danger" style="margin-left: 5px;"
                              @click.stop="removeMenu(node, data)">
                              删除
                            </el-button>
                          </span>
                        </span>
                      </template>
                    </el-tree>
                  </el-popover>
                </el-space>

              </el-form-item>
            </el-form>

            <ContextMenu ref="menuRef" :target-element="tableRef" @item-click="menuItemClick" :menu-items="menuItems">
              <template #label="{ item, data, index }">
                <template v-if="index == 0">
                  <span> {{ data[0].__pinned == true ? '取消置顶' : '置顶' }}</span>
                </template>
                <template v-else>
                </template>
              </template>
            </ContextMenu>

            <el-table ref="tableRef" :data="queryForm.tableData" :height="tableHeight" highlight-current-row
              row-key="id" :row-class-name="renderTableRowClass" @row-contextmenu="(row, col, e) => menuRef.pop(row)">
              <template #empty>
                <el-empty :image-size="200" />
              </template>
              <el-table-column label="序号" width="60">
                <template #default="scope">
                  <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
                </template>
              </el-table-column>
              <el-table-column label="摘要信息" width="380">
                <template #default="scope">
                  <div>名称：<span class="user-select black">{{ scope.row.account_name }}</span></div>
                  <div>类型：<span class="user-select black">{{ `${scope.row.type_name} (${scope.row.company_name})`
                      }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="账户余额">
                <template #default="scope">
                  <div><span style="font-weight: bold;" class="user-select black">{{ numberFmt(scope.row.ending_balance)
                      }}</span> {{ " " +
        scope.row.currency }}</div>
                </template>
              </el-table-column>
              <el-table-column label="今日盘账">
                <template #default="scope">
                  <div :class="tableState.getAccountState(scope.row)[1]">{{ tableState.getAccountState(scope.row)[0]
                    }}
                  </div>
                </template>
              </el-table-column>

              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-space>
                    <el-button type="success" @click="viewIncomes(scope.row)" link>
                      收入
                    </el-button>
                    <el-button type="warning" @click="viewPayouts(scope.row)" link>
                      支出
                    </el-button>
                    <el-button type="danger" @click="viewPanZhang(scope.row)" link>
                      盘账
                    </el-button>
                    <el-button type="primary" @click="viewHistory(scope.row)" link>
                      历史
                    </el-button>
                  </el-space>
                </template>
              </el-table-column>

            </el-table>

            <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px"
              :default-page-size="300" v-show="queryForm.page.totalCount > 0"
              v-model:current-page="queryForm.page.currentPage" v-model:page-size="queryForm.page.pageSize"
              background="true" :page-sizes="[10, 50, 100, 300]" layout="total, sizes, prev, pager, next, jumper"
              :total="queryForm.page.totalCount" />

            <el-dialog v-model="form.menuShow" title="新建隐藏目录" width="500" @opened="menuInputRef.focus()">
              <template #footer>
                <el-form-item label="目录名称">
                  <el-input v-model.trim="form.menuData.menuDir" clearable ref="menuInputRef"></el-input>
                </el-form-item>
                <div class="dialog-footer">
                  <el-button @click="() => {
        form.menuData.menuDir = ''
        form.menuShow = false
      }">关闭</el-button>
                  <el-button type="primary" @click="addMenu">
                    确认
                  </el-button>
                </div>
              </template>
            </el-dialog>

          </div>
        </el-tab-pane>
        <el-tab-pane v-if="form.incomeShow" label="收入" name="收入">
          <BankAccountIncome :account-id="form.incomes.accountId" :currency="form.incomes.currency" />
        </el-tab-pane>
        <el-tab-pane v-if="form.payoutShow" label="支出" name="支出">
          <BankAccountPayout :account-id="form.payout.accountId" :currency="form.payout.currency" />
        </el-tab-pane>
        <el-tab-pane v-if="form.recordShow" label="日志" name="日志">
          <BankAccountRecord></BankAccountRecord>
        </el-tab-pane>
        <el-tab-pane v-if="form.historyShow" :label="form.historyTabLabel" name="历史">
          <BankAccountHistory :account-id="form.history.accountId" 
          :currency="form.history.currency" 
          :type-name="form.history.typeName" 
          :available="form.history.available"
          :balance="form.history.balance"
          />
        </el-tab-pane>
      </el-tabs>
      <el-drawer destroy-on-close v-model="form.panzhangShow" size="50%" :title="form.pangZhangTitle">
        <el-form :model="form.panzhangPost" label-width="auto" :rules="rules" ref="formRef">
          <p style="font-size: 11pt; color:blue; margin-bottom: 10px; margin-top: -20px;">
            {{ form.panzhangState.account_name }}
          </p>
          <el-form-item label="可用余额" v-if="form.panzhangState.available_balance">
            <el-space>
              <el-input-number :precision="2" :controls="false" style="width: 90%" clearable
                v-model="form.panzhangPost.available_balance"></el-input-number>
              <span class="black" style="padding-left: 4px;">{{ form.panzhangCurrency }}</span>
            </el-space>
          </el-form-item>
          <p class="black" style="font-size: 11pt;" v-if="unavilable">不可用余额</p>
          <el-form-item label="滚动金" v-if="form.panzhangState.gold_rolling_balance">
            <el-space>
              <el-input-number :precision="2" :controls="false" style="width: 90%" clearable
                v-model="form.panzhangPost.gold_rolling_balance"></el-input-number>
              <span class="black" style="padding-left: 4px;">{{ form.panzhangCurrency }}</span>
            </el-space>
          </el-form-item>
          <el-form-item label="冻结" v-if="form.panzhangState.freeze_balance">
            <el-space>
              <el-input-number :precision="2" :controls="false" style="width: 90%" clearable
                v-model="form.panzhangPost.freeze_balance"></el-input-number>
              <span class="black" style="padding-left: 4px;">{{ form.panzhangCurrency }}</span>
            </el-space>
          </el-form-item>
          <el-form-item label="押金" v-if="form.panzhangState.deposit_balance">
            <el-space>
              <el-input-number :precision="2" :controls="false" style="width: 90%" clearable
                v-model="form.panzhangPost.deposit_balance"></el-input-number>
              <span class="black" style="padding-left: 4px;">{{ form.panzhangCurrency }}</span>
            </el-space>
          </el-form-item>
          <el-form-item label="可下撤金额" v-if="form.panzhangState.withdrawable_balance">
            <el-space>
              <el-input-number :precision="2" :controls="false" style="width: 90%" clearable
                v-model="form.panzhangPost.withdrawable_balance"></el-input-number>
              <span class="black" style="padding-left: 4px;">{{ form.panzhangCurrency }}</span>
            </el-space>
          </el-form-item>
          <el-form-item label="图片上传" prop="attachment_list">
            <Upload action="upload" ref="uploadRef" v-model="form.panzhangPost.attachment_list" :limit="10"
              dir="account">
            </Upload>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button link type="danger" @click="crop">
            <el-icon>
              <PictureFilled />
            </el-icon>截图
          </el-button>
          <el-button type="primary" @click="submitPanZhang">
            确认
          </el-button>
        </template>
      </el-drawer>
    </template>
  </Layout>
</template>


<style scoped>
.h4 {
  padding: 0 10px;
  color: #333;
  font-weight: bold;
  line-height: 30px !important;
}

.user-select {
  user-select: text
}

.pannel {
  padding: 10px;
}

.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 100px;
}

.option-add {
  padding-right: 10px;
}

.black {
  color: black
}

.transparent {
  color: transparent
}

.green {
  color: green
}

.blue {
  color: rgb(79, 79, 197)
}

.red {
  color: red
}

.audit {
  background-image: url('../assets/images/shenpi.svg');
  background-repeat: no-repeat;
  background-position: 80% 50%;
  background-size: 50px 50px;
}

:deep(.account-pined td:first-child) {
  background-image: url('../assets/images/triangle.svg') !important;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 10px 10px;
}

:deep(.account-pined) {
  /* position: sticky;
  top: 0;
  z-index: 100; */
}

:deep(.el-table .hidden-row) {
  display: none !important;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

:deep(.el-tabs__nav-scroll) {
  height: 36px;
  background-color: white !important;
  border: none !important;
  border-bottom: 1px solid #eee !important;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav),
:deep(.el-tabs__item) {
  height: 36px;
  border: none !important
}

:deep(.el-tabs__nav .el-tabs__item) {
  height: 36px !important;
  transition: none !important;
}

:deep(.el-tabs__nav .el-tabs__item:hover) {
  color: black !important;
}

:deep(.el-tabs__nav .el-tabs__item:first-child .el-icon.is-icon-close) {
  display: none;
}

/* :deep(.el-tabs__nav .el-tabs__item:not(:first-child) .el-icon.is-icon-close ) {
  color: transparent;
}
:deep(.el-tabs__nav .el-tabs__item:not(:first-child) .el-icon.is-icon-close:hover ) {
  background-color: transparent!important;
  color: transparent;
} */

:deep(.el-tabs__nav .el-tabs__item:first-child) {
  padding: 0px;
  margin-left: 10px;
  margin-top: -3px;
  margin-right: 0px !important;
  font-size: 15px;
}

:deep(.el-tabs__nav .el-tabs__item:not(:first-child)) {
  padding: 0px !important;
  margin: 0px;
  padding-right: 10px;
  margin-left: 20px;
  margin-top: -3px;
  font-size: 15px;
}



:deep(.el-tabs__nav .el-tabs__item.is-active:not(:first-child)) {
  padding: 0px !important;
  margin: 0px;
  padding-right: 10px;
  margin-left: 20px;
  margin-top: -3px;
  font-size: 15px;
}

:deep(.el-tabs__nav) {
  border: none !important;
}

:deep(.el-tabs__content),
:deep(.el-tabs) {
  border: none !important;
  padding: 0px !important;
  margin: 0px !important;
  background-color: transparent !important;
}
</style>