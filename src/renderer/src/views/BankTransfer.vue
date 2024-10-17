<script setup>
import { reactive, ref, watch, onMounted } from 'vue'
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString, numberFmt, subNumbers, addNumbers } from "@/utils/format"
import { useClient } from "@/utils/client"
import { setUpCapture } from "@/utils/tools"
import api from "@/api"
import { computed } from 'vue'
import message from '@/utils/message'
const store = useUserStore()
const bank = useAccountStore()
const { height, width } = useClient()
const queryForm = reactive({
  page: {
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
  },
  search: {
    account_name: '',
    condition: '1',
    user_id: store.user.id,
    page: 1,
    limit: 10,
  },
  hasSearch: false,
  tableData: [],
})

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
  const data = await api.transfer.getList(queryForm.search)
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

const queryFormRef = ref(null)
const tableHeight = computed(() => {
  const el = queryFormRef.value?.$el
  const h = el?.clientHeight || 0
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

//增删改查
const uploadRef = ref(null)
const formRef = ref(null)
const form = reactive({
  validateMinCount: 1,
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

    voucher_ext_id: null,
    application_reason: null,
    id: null,
  },
  noteShow: false,
  noteRow: null,
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
  in_account_id_balance_base: '',
  in_account_id_loading: false,
  out_account_id_loading: false,
  in_account_id_color: 'transparent',
  out_account_id_color: 'transparent',
  in_account_id_balance: '',
  out_account_id_balance: '',
  in_account_id_currency: '',
  out_account_id_currency: '',
  available_balance: computed(() => {
    return numberFmt(subNumbers(formState.out_account_id_balance, form.post.origin_amount))
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
      return "银行转账-添加"
    }
    else if (form.mode == "edit") {
      return "银行转账-编辑"
    }
    else if (form.mode == "view") {
      return "银行转账-查看"
    }
  })
})

watch(() => form.post.in_account_id, async () => {
  if (form.post.in_account_id) {
    formState.in_account_id_loading = true
    const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.in_account_id })
    formState.in_account_id_balance_base = resp.ending_balance
    formState.in_account_id_color = 'black'
    formState.in_account_id_loading = false
    formState.in_account_id_balance = addNumbers(resp.ending_balance, form.post.received_amount)
    formState.in_account_id_currency = resp.currency
    form.post.received_currency = resp.currency
  } else {
    formState.in_account_id_color = 'transparent'
    formState.in_account_id_balance = ''
    formState.in_account_id_currency = ''
  }
})

watch(() => form.post.out_account_id, async () => {
  try {
    if (form.post.out_account_id) {
      formState.out_account_id_loading = true
      const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.out_account_id })
      formState.out_account_id_color = 'black'
      formState.out_account_id_loading = false
      formState.out_account_id_balance = numberFmt(resp.ending_balance)
      formState.out_account_id_currency = resp.currency
      form.post.currency = resp.currency
    } else {
      formState.out_account_id_color = 'transparent'
      formState.out_account_id_balance = ''
      formState.out_account_id_currency = ''
    }
  } catch (err) {
    formState.out_account_id_loading = false
    message.error('转出账户实时余额获取失败')
  }

})

watch(() => form.post.received_amount, (v) => {
  formState.in_account_id_balance = addNumbers(formState.in_account_id_balance_base, form.post.received_amount)
})

const formRules = reactive({
  origin_amount: [
    {
      required: true, validator: (rule, value, callback) => {
        const a = (formState.available_balance || "0").replaceAll(",", "")
        if (parseFloat(a) < 0) {
          callback("可用余额不能为负数!")
        } else {
          callback()
        }
      }, trigger: 'blur'
    },
  ],
  attachment_list: [
    {
      required: true,
      validator: (rule, value, call_back) => {
        return uploadRef.value.validate(rule, value, call_back)
      }, trigger: 'change'
    }
  ],
  application_reason: [
    { required: true, trigger: "change", message: "请填写修改原因!" }
  ]
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
  formRef.value?.clearValidate()

  formState.in_account_id_balance_base=''
  formState.in_account_id_loading=false
  formState.out_account_id_loading=false
}

const crop = setUpCapture(src => {
  form.post.attachment_list.push({ url: src })
})

const onSubmit = async () => {
  if (form.mode == 'add') {
    form.validateMinCount = 1
    formRef.value.validate().then(async valid => {
      if (valid) {
        try {
          const uploads = await uploadRef.value.uploadImage()
          const post = { ...form.post }
          delete post.voucher_ext_id
          delete post.application_reason
          delete post.id
          post.attachment_list = JSON.stringify(uploads)
          await api.transfer.addTransfer(post)
          form.show = false
          message.success('银行转账已添加!')
          onSearch(1, null)
        } catch (err) {
          // logger.error("银行转账添加失败", err)
        }
      }
    })
  } else if (form.mode == 'edit') {
    form.validateMinCount = 0
    formRef.value.validate().then(async valid => {
      if (valid) {
        try {
          const uploads = await uploadRef.value.uploadImage()
          const post = { ...form.post }
          if (uploads) {
            post.attachment_list = JSON.stringify(uploads)
          } else {
            post.attachment_list = JSON.stringify([])
          }
          await api.transfer.modifyTransfer(post)
          form.show = false
          message.success('银行转账已添加!')
          onSearch(1, null)
        } catch (err) {
          logger.error("银行转账编辑失败", err)
        }
      }
    })
    console.log('edit')
  }
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
  form.post = {
    out_account_id: row.out_account_id,
    in_account_id: row.in_account_id,
    origin_amount: row.origin_amount,
    currency: row.currency,
    received_amount: row.received_amount,
    received_currency: row.received_currency,
    note: row.note,
    in_account_title_id: row.in_account_title_id,
    out_account_title_id: row.out_account_title_id,
    attachment_list: row.attachment_list.map(v => { return { url: v.path } }),
  }
  form.mode = 'view'
  form.show = true
}

const editTransfer = async (row) => {
  const data = await api.transfer.getDetail({ user_id: store.user.id, id: row.id })
  form.post.out_account_id = data.out_account_id
  form.post.in_account_id = data.in_account_id
  form.post.origin_amount = data.origin_amount
  form.post.currency = data.currency
  form.post.received_amount = data.received_amount
  form.post.received_currency = data.received_currency
  form.post.note = data.note
  form.post.in_account_title_id = data.in_account_title_id
  form.post.out_account_title_id = data.out_account_title_id
  form.post.attachment_list = data.attachment_list.map(v => { return { url: v.path } })
  form.post.voucher_ext_id = row.voucher_ext_id
  form.post.id = row.id

  console.log('edit ===> ', data, form.post.origin_amount, data.origin_amount);
  form.mode = 'edit'
  form.show = true
}

const noteTransfer = async (row) => {
  form.notePost.note = row.note
  form.notePost.voucher_ext_id = row.voucher_ext_id
  form.noteShow = true
  form.noteRow = row
}
const submitNoteTransit = async () => {
  try {
    await api.transfer.modifyNote({ user_id: store.user.id, note: form.notePost.note, voucher_ext_id: form.notePost.voucher_ext_id })
    form.noteRow.note = form.notePost.note
    form.noteShow = false
    message.success("备注已修改!")
  } catch (error) {
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
          <h4>银行转账</h4>
        </template>
      </Header>

      <div class="pannel">
        <el-form :inline="true" :model="queryForm.search" class="query-form-inline" ref="queryFormRef">
          <el-form-item label="银行账户">
            <el-input v-model="queryForm.search.account_name" placeholder="支持模糊查找" clearable @keyup.enter="onSearch(1, null)" />
          </el-form-item>
          <el-form-item label="日期">
            <el-select v-model="queryForm.search.condition" placeholder="">
              <el-option label="今天" value="1" />
              <el-option label="昨天" value="2" />
              <el-option label="近7天" value="3" />
              <el-option label="本月" value="4" />
              <el-option label="上月" value="5" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
            <el-button type="primary" @click="addTransfer">添加</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="queryForm.tableData" :height="tableHeight" highlight-current-row
          :show-header="queryForm.page.totalCount > 0">
          <template #empty>
            <el-empty :image-size="200" />
          </template>
          <el-table-column label="序号" width="60">
            <template #default="scope">
              <div>{{ scope.$index + 1 + (queryForm.page.currentPage - 1) * queryForm.page.pageSize }}</div>
            </template>
          </el-table-column>
          <el-table-column label="摘要信息" width="220">
            <template #default="scope">
              <div :class="{ audit: scope.row.voucher_ext_last.is_audit == 1 }">
                <div>编号： <span class="user-black">{{ scope.row.transfer_number }}</span></div>
                <div>创建： <span class="user-black">{{ timestampToFormattedString(scope.row.create_time) }}</span></div>
                <div>创建人：<span class="user-black">{{ `${scope.row.creator}(${scope.row.department_name})` }}</span>
                </div>
              </div>

            </template>
          </el-table-column>
          <el-table-column label="银行信息">
            <template #default="scope">
              <div>转出：<span class="user-black">{{ scope.row.out_account_name }}</span></div>
              <div>转入：<span class="user-black">{{ scope.row.in_account_name }}</span></div>
              <div>金额：<span class="user-black red light">{{ `${numberFmt(scope.row.origin_amount)}` }}</span> <span
                  class="black light">{{ `
                  ${scope.row.currency}` }}</span></div>
            </template>
          </el-table-column>
          <el-table-column label="备注">
            <template #default="scope">
              <div class="user-black">{{ scope.row.note }}</div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-space>
                <el-button size="default" type="primary" @click="viewTransfer(scope.row)" link>
                  查看
                </el-button>
                <el-button v-if="store.canModify && scope.row.voucher_ext_last.is_audit == 0" size="default"
                  type="primary" @click="editTransfer(scope.row)" link>
                  编辑
                </el-button>
                <el-button v-if="store.canModifyNote" size="default" type="primary" @click="noteTransfer(scope.row)"
                  link>
                  备注
                </el-button>
                <el-button v-if="store.canCancel && scope.row.voucher_ext_last.is_audit == 1" size="default"
                  type="danger" @click="cancelTransfer(scope.row)" link>
                  撤销
                </el-button>
                <el-button v-if="store.canAudit && scope.row.voucher_ext_last.is_audit == 1" size="default"
                  type="success" @click="auditTransfer(scope.row)" link>
                  审核
                </el-button>
                <el-button v-if="store.canDelete" size="default" type="danger" @click="noteTransfer(scope.row)" link>
                  删除
                </el-button>
              </el-space>
            </template>
          </el-table-column>

        </el-table>

        <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px"
          v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
          v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />

        <el-drawer v-model="form.show" :title="formState.formTitle" direction="rtl" size="50%"
          :close-on-click-modal="false" destroy-on-close ref="drawRef" @closed="()=>{
              resetForm()
          }">
          <template #default>
            <el-form :model="form.post" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="转出账户" prop="out_account_id" required :show-message="false">
                <div class="form-item-detail" v-loading="formState.out_account_id_loading">
                  <el-select v-model="form.post.out_account_id" filterable
                    :disabled="formState.getDisabledState('out_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>
                  <div>
                    <span :class="formState.out_account_id_color">实时余额 </span>
                    <span style="color:black">{{ formState.out_account_id_balance }}</span>
                    <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="转账支出科目" prop="out_account_title_id" required :show-message="false">
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getDisabledState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="转出金额" prop="origin_amount" required>
                <div class="form-item-detail">
                  <div style=" display: flex;justify-content: center; width: 100%;">
                    <el-input-number v-model="form.post.origin_amount" style="width:70%"
                      :disabled="formState.getDisabledState('origin_amount')" :precision="2" :controls="false">
                      <template #suffix>
                        <p>{{ form.currency }}</p>
                      </template>
                    </el-input-number>
                    <el-select :validate-event="false" style="width: 30%; padding-left: 5px"
                      v-model="form.post.currency">
                      <el-option v-for="item in bank.currencies" :key="item.code" :label="item.code"
                        :value="item.code" />
                    </el-select>
                  </div>
                  <div>
                    <span :class="formState.available_color">可用余额</span>
                    <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
                    <span :class="formState.available_color == 'transparent' ? 'transparent' : 'red'">{{ " " +
          formState.out_account_id_currency }}</span>
                  </div>
                </div>

              </el-form-item>

              <el-form-item label="转入账户" prop="in_account_id" required :show-message="false">
                <div class="form-item-detail" v-loading="formState.in_account_id_loading">
                  <el-select v-model="form.post.in_account_id" filterable
                    :disabled="formState.getDisabledState('in_account_id')">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>
                  <div>
                    <span :class="formState.in_account_id_color">实时余额 </span>
                    <span style="color:black">{{ formState.in_account_id_balance }}</span>
                    <span style="color:red">{{ " " + formState.in_account_id_currency }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="到账收入科目" prop="in_account_title_id" required :show-message="false">
                <el-select v-model="form.post.in_account_title_id" filterable
                  :disabled="formState.getDisabledState('in_account_title_id')">
                  <el-option v-for="item in bank.incomes" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="到账金额" prop="received_amount" required :show-message="false">
                <div style=" display: flex; justify-content: center;width: 100%;">
                  <el-input-number v-model="form.post.received_amount"
                    :disabled="formState.getDisabledState('received_amount')" :precision="2" :controls="false"
                    style="width: 70%">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input-number>
                  <el-select :validate-event="false" style="width: 30%; padding-left: 5px"
                    v-model="form.post.received_currency">
                    <el-option v-for="item in bank.currencies" :key="item.code" :label="item.code" :value="item.code" />
                  </el-select>
                </div>

              </el-form-item>

              <el-form-item label="备注" prop="note">
                <el-input v-model="form.post.note" type="textarea" :rows="3" show-word-limit
                  :disabled="formState.getDisabledState('note')"></el-input>
              </el-form-item>

              <el-form-item v-if="form.mode == 'edit'" label="修改原因" prop="application_reason" required
                :rules="[{ required: true, message: '请填写修改原因', trigger: 'change' }]">
                <el-input v-model="form.post.application_reason" type="textarea" :rows="3" show-word-limit></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="attachment_list">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transfer"
                  :validate-min-count="form.validateMinCount" :disabled="formState.getDisabledState('attachment_list')">
                </Upload>

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-button v-if="!formState.getDisabledState('crop')" link type="danger" @click="crop">
                <el-icon>
                  <PictureFilled />
                </el-icon>截图
              </el-button>
              <el-button @click="handleCancel">取消</el-button>
              <el-button v-show="!formState.getDisabledState('button')" type="primary" @click="onSubmit">确认</el-button>
            </div>
          </template>
        </el-drawer>

        <el-dialog v-model="form.noteShow" title="备注修改" width="500" destroy-on-close :close-on-click-modal="false">
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

        <el-dialog v-model="form.cancelShow" title="撤销" width="500" destroy-on-close :close-on-click-modal="false">
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

        <el-dialog v-model="form.auditShow" title="审核" width="500" destroy-on-close :close-on-click-modal="false">
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

.form-item-detail {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.pannel {
  padding: 10px;
}

.query-form-inline .el-input {
  --el-input-width: 220px;
}

.query-form-inline .el-select {
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

.red {
  color: rgb(245, 108, 108) !important
}

.light {
  font-weight: 600
}

.user-black {
  color: black;
  user-select: text
}

.bold {
  font-weight: bold
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