<script setup>
import BankAccountIncome from "@/views/BankAccountIncome.vue"
import BankAccountPayout from "@/views/BankAccountPayout.vue"
import BankAccountHistory from "@/views/BankAccountHistory.vue"

import { reactive, ref, watch, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
import { useLocalConfig } from "@/stores/config"
import { getIndexFromArray } from "@/utils/tools"
import api from "@/api"
import { computed } from 'vue'
import message from '@/utils/message'
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

const menuInputRef = ref(null)
const menuItemClick = (item, row) => {
  if (item.label === '置顶') {
    configStore.setAccountIndexs(row.id)
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
  console.log('item ===> ', item)
}
const removeMenu = (dir, id, node) => {
  const index = accountMenus.value.findIndex((v) => v.label == dir)
  if (index > -1) {
    const updateItem = accountMenus.value[index]
    const item = updateItem?.children.findIndex(v => v.id == id)
    if (item > -1) {
      updateItem.children.splice(item, 1)
      configStore.updateAccountMenus()
    }
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
  console.log(a1, a2);
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

  queryForm.tableData.map(v=>{
    if (checkedState.value.checked.includes(v.id)){
      v.__hidden = true
    }else{
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
        updateItem.children.push({ label: form.menuData.menuBindName, id: form.menuData.menuBindId })
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
  resp.list.forEach(v => {

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
})

watch(() => queryForm.page.currentPage, async () => {
  await onSearch()
})

watch(() => queryForm.page.pageSize, async () => {
  queryForm.page.currentPage = 1
  await onSearch(1, null)
})

const tableHeight = computed(() => {
  const h = queryFormRef.value?.clientHeight || 0
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

const menuRef = ref(null)
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
const incomeDrawerRef = ref(null)
const payoutDrawerRef = ref(null)

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

  historyShow: false,
  history: {
    accountId: '',
    currency: '',
  },
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
    const disabled = Object.keys(form.post)
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

const resetForm = () => {
  form.post = {
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
  }
  formRef.value?.resetFields()
}

const addTransfer = () => {
  resetForm()
  form.post.out_account_title_id = 181 //"财务费 - 内部转账支出"
  form.post.in_account_title_id = 197 // "收入 - 内部转账收入"
  form.mode = 'add'
  form.show = true
}
const viewIncomes = async (row) => {
  form.incomes.currency = row.currency
  form.incomes.accountId = row.id
  form.incomeShow = true
  form.currentTab = '收入'
}

const viewPayouts = async (row) => {
  form.history.currency = row.currency
  form.history.accountId = row.id
  form.payoutShow = true
  form.currentTab = '支出'
}

const viewHistory = async (row) => {
  form.historyShow = true
  form.history.accountId = row.id
  form.currentTab = '历史'
}

const noteTransfer = async (row) => {
  console.log('ropw ', row);
  form.notePost.note = row.note
  form.notePost.voucher_ext_id = row.voucher_ext_id
  form.noteShow = true
}

const cancelTransfer = async (row) => {
  form.cancelShow = true
  form.cancelPost.voucher_ext_id = row.voucher_ext_id
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
          form.historyShow = false
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
                  <el-button type="primary" @click="addTransfer">日志</el-button>
                  <el-popover placement="bottom" :width="380" trigger="click" hide-after="0" transition="none"
                    @show="hiddenAccountShow">
                    <template #reference>
                      <el-button type="primary"> {{ `账号隐藏 (${hiddenAccounts.length})` }}
                      </el-button>
                    </template>
                    <el-tree node-key="id" :default-checked-keys="hiddenAccounts" :data="accountMenus" show-checkbox
                      :expand-on-click-node="false" @check="(a1, a2) => {
        removeMenus(a1, a2)

      }" ref="nodeRef" check-on-click-node @node-click="(d, node) => {
        // if (node.isLeaf) {
        //   const item = queryForm.tableData.find(v => v.id === d.id)
        //   const checked = node.checked
        //   removeMenu(node.parent.data.label, d.id, node)
        //   if (item) {
        //     if (checked) {
        //       item.__hidden = true
        //     } else {
        //       item.__hidden = false
        //     }
        //   }
        // }
      }" default-expand-all>
                      <template #default="{ node, data }">
                        <span class="custom-tree-node">
                          <span >{{ node.label }}</span>
                          <span v-if="!data.children">
                            <el-button link type="danger" style="margin-left: 5px;" @click.stop="console.log('ccc ')">
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
            </ContextMenu>

            <el-table ref="tableRef" :data="queryForm.tableData" :height="tableHeight" highlight-current-row
              row-key="id" :row-class-name="renderTableRowClass" @row-contextmenu="(row, col, e) => {
        menuRef.pop(row)
      }">
              <template #empty>
                <el-empty :image-size="200" />
              </template>
              <el-table-column label="序号" width="60">
                <template #default="scope">
                  <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
                </template>
              </el-table-column>
              <el-table-column label="摘要信息">
                <template #default="scope">
                  <div>名称：{{ scope.row.account_name }}</div>
                  <div>类型：<span style="color:gray">{{ `${scope.row.type_name} (${scope.row.company_name})` }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="账户余额">
                <template #default="scope">
                  <div><span style="font-weight: bold;">{{ numberFmt(scope.row.ending_balance) }}</span> {{ " " +
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
                    <el-button type="danger" @click="noteTransfer(scope.row)" link>
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
          <BankAccountIncome :account-id="form.incomes.accountId" :currency="form.incomes.currency"
            :drawer-ref="incomeDrawerRef" />
        </el-tab-pane>
        <el-tab-pane v-if="form.payoutShow" label="支出" name="支出">
          <BankAccountPayout :account-id="form.payout.accountId" :currency="form.payout.currency"
            :drawer-ref="payoutDrawerRef" />
        </el-tab-pane>
        <el-tab-pane v-if="form.historyShow" label="历史" name="历史">
          <BankAccountHistory :account-id="form.history.accountId" :currency="form.payout.currency" />
        </el-tab-pane>
      </el-tabs>
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

:deep(.account-pined:nth-child(-n+3)) {
  position: sticky;
  top: 0;
  z-index: 100;
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