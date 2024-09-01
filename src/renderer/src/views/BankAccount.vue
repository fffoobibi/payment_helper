<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
import api from "@/api"
import { computed } from 'vue'
import message from '@/utils/message'
const store = useUserStore()
const bank = useAccountStore()
const { height } = useClient()
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

const onSearch = async (page = null, pageSize = null) => {
  console.log('use store')
  console.log(await electron.config.get('foo'))
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
  const data = await api.bank_account.getList(queryForm.search)
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
  if (queryForm.page.totalCount == 0) {
    return height.value - 160
  } return height.value - 210
})

//增删改查
/**
 * 
 * 
 * 
 *                 'user_id': current_data.id,
                'out_account_id': current_data.get_account_id(self.widget.comboBox_8.currentText()),
                'in_account_id': current_data.get_account_id(self.widget.comboBox_9.currentText()),
                'origin_amount': self.widget.lineEdit_11.text().strip().replace(',', ''),
                'currency': self.widget.comboBox.currentText(),
                'note': self.widget.textEdit_2.toPlainText(),
                'received_amount': self.widget.lineEdit.text().replace(',', ''),
                'received_currency': self.widget.comboBox_10.currentText(),
                'in_account_title_id': self.widget.comboBox_3.current_data(),
                'out_account_title_id': self.widget.comboBox_2.current_data(),
*/
const formRef = ref(null)
const form = reactive({
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
const handleCancel = () => {
  resetForm()
  form.mode = 'view'
  form.show = false
}

const addTransfer = () => {
  resetForm()
  form.post.out_account_title_id = 181 //"财务费 - 内部转账支出"
  form.post.in_account_title_id = 197 // "收入 - 内部转账收入"
  form.mode = 'add'
  form.show = true
}
const viewTransfer = async (row) => {
  const data = await api.transfer.getDetail({ user_id: store.user.id, id: row.id })
  form.post = {
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    note: data.note,
    in_account_title_id: data.in_account_title_id,
    out_account_title_id: data.out_account_title_id,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
  }
  form.mode = 'view'
  form.show = true
}

const editTransfer = async (row) => {
  console.log('pay', bank.payouts, 'in', bank.incomes)
  const data = await api.transfer.getDetail({ user_id: store.user.id, id: row.id })
  form.post = {
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    note: data.note,
    in_account_title_id: data.in_account_title_id,
    out_account_title_id: data.out_account_title_id,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
  }
  form.mode = 'edit'
  form.show = true
}

const noteTransfer = async (row) => {
  console.log('ropw ', row);
  form.notePost.note = row.note
  form.notePost.voucher_ext_id = row.voucher_ext_id
  form.noteShow = true
}
const submitNoteTransit = async () => {
  try {
    const resp = await api.transfer.modifyNote({ user_id: store.user.id, note: form.notePost.note, voucher_ext_id: form.notePost.voucher_ext_id })
    form.noteShow = false
    message.success("备注已修改!")
  } catch (error) {
    message.warning(error)
  }
}

const cancelTransfer = async (row) => {
  form.cancelShow = true
  form.cancelPost.voucher_ext_id = row.voucher_ext_id
}

const submitCancelTransfer = async () => {
  try {
    const resp = await api.transfer.cancelTransfer({ user_id: store.user.id, voucher_ext_id: form.cancelPost.voucher_ext_id })
    form.cancelShow = false
    message.success("修改已撤销!")
    onSearch(1, null)
  } catch (error) {
    message.warning(error)
  }
}

const auditTransfer = async (row) => {
  form.auditShow = true
  form.auditPost.applicant = row.voucher_ext_last.applicant
  form.auditPost.application_reason = row.voucher_ext_last.application_reason
  form.auditPost.application_time = row.voucher_ext_last.application_time
  form.auditPost.voucher_ext_id = row.voucher_ext_id
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
      // t = datetime.fromtimestamp(self.check_accounts_time).strftime('%Y-%m-%d')
      //       if t == datetime.now().strftime('%Y-%m-%d'):
      //           return datetime.fromtimestamp(self.check_accounts_time).strftime('%Y/%m/%d %H:%M'), '#5F89DF'
      //       return '今日未盘', 'red'
    }
  }
}

const submitAuditTransfer = async () => {
  try {
    const resp = await api.transfer.auditTransfer({ user_id: store.user.id, voucher_ext_id: form.auditPost.voucher_ext_id })
    form.auditShow = false
    message.success("修改审核已通过!")
    onSearch(1, null)
  } catch (error) {
    message.warning(error)
  }
}

</script>

<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>银行账户</h4>
        </template>

        <template #option>
          <el-button size="small" class="option-btn" link>
            <i class="iconfont icon-setting"></i>
          </el-button>
        </template>
      </Header>

      <div class="pannel">
        <el-form :inline="true" :model="queryForm.search" class="demo-form-inline">
          <el-form-item label="银行名称">
            <el-input v-model="queryForm.search.account_name" placeholder="支持模糊查找" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
            <el-button type="primary" @click="addTransfer">日志</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="queryForm.tableData" stripe :height="tableHeight" highlight-current-row>
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
              <div>类型：<span style="color:gray">{{ `${scope.row.type_name} (${scope.row.company_name})` }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="账户余额">
            <template #default="scope">
              <div>{{ scope.row.ending_balance + " " + scope.row.currency }}</div>

            </template>
          </el-table-column>
          <el-table-column label="今日盘账">
            <template #default="scope">
              <div :class="tableState.getAccountState(scope.row)[1]">{{ tableState.getAccountState(scope.row)[0] }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-space>
                <el-button type="success" @click="viewTransfer(scope.row)" link>
                  收入
                </el-button>
                <el-button type="warning" @click="editTransfer(scope.row)" link>
                  支出
                </el-button>
                <el-button type="danger" @click="noteTransfer(scope.row)" link>
                  盘账
                </el-button>
                <el-button type="primary" @click="cancelTransfer(scope.row)" link>
                  历史
                </el-button>
              </el-space>
            </template>
          </el-table-column>

        </el-table>

        <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px" :default-page-size="100"
          v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
          v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />

        <el-drawer v-model="form.show" :title="formState.formTitle" direction="rtl" size="50%" @closed="handleClose"
          ref="drawRef">
          <template #default>
            <el-form :model="form" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="转出账户" prop="post.out_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;"
                  v-loading="formState.out_account_id_loading">
                  <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getDisabledState('out_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span :class="formState.out_account_id_color">实时余额 </span>
                      <span style="color:black">{{ formState.out_account_id_balance }}</span>
                      <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="转账支出科目" prop="post.out_account_title_id" required>
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getDisabledState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="转出金额" prop="post.origin_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input-number v-model="form.post.origin_amount"
                    :disabled="formState.getDisabledState('origin_amount')" :precision="2" :controls="false">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input-number>
                  <p>
                    <span :class="formState.available_color">可用余额 {{ computedAvailableBalance }}</span>
                    <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
                    <span :class="formState.available_color == 'transparent' ? 'transparent' : 'red'">{{ " " +
          formState.out_account_id_currency }}</span>
                  </p>
                </div>

              </el-form-item>

              <el-form-item label="转入账户" prop="post.in_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;"
                  v-loading="formState.in_account_id_loading">
                  <el-select v-model="form.post.in_account_id" filterable @change="handleBankChange"
                    :disabled="formState.getDisabledState('in_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span :class="formState.in_account_id_color">实时余额 </span>
                      <span style="color:black">{{ formState.in_account_id_balance }}</span>
                      <span style="color:red">{{ " " + formState.in_account_id_currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="到账收入科目" prop="post.in_account_title_id" required>
                <el-select v-model="form.post.in_account_title_id" filterable
                  :disabled="formState.getDisabledState('in_account_title_id')">
                  <el-option v-for="item in bank.incomes" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="到账金额" prop="post.received_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input-number v-model="form.post.received_amount"
                    :disabled="formState.getDisabledState('received_amount')" :precision="2" :controls="false"
                    style="width: 100%">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input-number>

                </div>

              </el-form-item>

              <el-form-item label="备注" prop="post.note">
                <el-input v-model="form.post.note" type="textarea" :rows="3" show-word-limit
                  :disabled="formState.getDisabledState('note')"></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="post.attachment_list">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transfer"
                  :disabled="formState.getDisabledState('attachment_list')" @done="r => {
          console.log('rs', r)
        }"></Upload>

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-button @click="handleCancel">取消</el-button>
              <el-button v-show="!formState.getDisabledState('button')" type="primary"
                @click="confirmClick">确认</el-button>
            </div>
          </template>
        </el-drawer>

        <el-dialog v-model="form.noteShow" title="备注修改" width="500" :before-close="handleClose">
          <el-input type="textarea" v-model="form.notePost.note"></el-input>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="form.noteShow = false">关闭</el-button>
              <el-button type="primary" @click="submitNoteTransit">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog>

        <el-dialog v-model="form.cancelShow" title="撤销" width="500" :before-close="handleClose">
          <span>撤销修改审核么</span>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="form.cancelShow = false">关闭</el-button>
              <el-button type="primary" @click="submitCancelTransfer">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog>

        <el-dialog v-model="form.auditShow" title="审核" width="500" :before-close="handleClose">
          <p>修改人: {{ form.auditPost.applicant }}</p>
          <p>提交时间: {{ timestampToFormattedString(form.auditPost.application_time) }}</p>
          <el-form-item label="修改原因: ">
            <el-input type="textarea" readonly v-model="form.auditPost.application_reason" :rows="3"></el-input>
          </el-form-item>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="form.auditShow = false">关闭</el-button>
              <el-button type="primary" @click="submitAuditTransfer">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog>

      </div>

    </template>
  </Layout>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
  font-weight: bold;
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

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>