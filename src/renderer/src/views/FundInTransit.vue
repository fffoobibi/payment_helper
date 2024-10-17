<script setup>
import { reactive, ref, watch, computed, onMounted, onActivated } from 'vue'
import { timestampToFormattedString, numberFmt, subNumbers, addNumbers } from "@/utils/format"
import { useClient } from "@/utils/client"
import { setUpCapture } from "@/utils/tools"
import { useUserStore, useAccountStore } from "@/stores"
import api from "@/api"
import Message from "@/utils/message"
import message from '@/utils/message'

const store = useUserStore()
const bank = useAccountStore()
const tableData = ref([])
const { height, width } = useClient()

const queryFormRef = ref(null)
const queryForm = reactive({
  out_account_alias_name: '',
  condition: '0',
  status: '0',
  user_id: store.user.id,
  page: 1,
  limit: 10,
  hasSearch: false
})

const pageInfo = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: null,
})

onActivated(() => {
  tableHeight.value = 1
})

onMounted(() => {
  if (!queryForm.hasSearch) {
    onSearch(1, null)
    queryForm.hasSearch = true
  }
})

watch(() => pageInfo.currentPage, async () => {
  await onSearch()
})

watch(() => pageInfo.pageSize, async () => {
  pageInfo.currentPage = 1
  await onSearch(1, null)
})

const onSearch = async (page = null, pageSize = null) => {
  if (page != null) {
    queryForm.page = page
    pageInfo.currentPage = page
  } else {
    queryForm.page = pageInfo.currentPage
  }
  if (pageSize != null) {
    queryForm.limit = pageSize
  } else {
    queryForm.limit = pageInfo.pageSize
  }
  const data = await api.transit.getTransitList(queryForm)
  tableData.value = data.list
  pageInfo.totalCount = data.count
  pageInfo.pageSize = data.limit
}

const tableHeight = computed(
  {
    get: () => {
      const h = queryFormRef.value?.$el?.clientHeight || 0
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
    },
    set: val => {
      width.value = width.value - 1
    }
  })

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
    attachment_list: [],
    note: null,
    commission: null,
    out_account_title_id: null,

    voucher_ext_id: null,   // 编辑
    application_reason: null // 编辑
  },
  attrs: {
    attachment_list: computed(() => {
      return form.post.attachment_list.map(v => (new URL(v.url)).pathname)
    })
  },
  noteShow: false,
  modifyNote: "",
  notePost: {
    voucher_ext_id: null,
    note: ''
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

const resetForm = () => {
  form.post = {
    user_id: store.user.id,
    out_account_id: null,
    in_account_id: null,
    origin_amount: null,
    currency: null,
    received_amount: null,
    received_currency: null,
    attachment_list: [],
    note: null,
    commission: null,
    out_account_title_id: 179, // 财务费-在途支出
    application_reason: null
  }
  formState.in_account_id_loading = false
  formState.out_account_id_loading = false
  formState.in_account_id_balance_base = ''
  formState.in_account_id_balance = ''
  formState.out_account_id_balance = ''
  formRef.value?.clearValidate()
}

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
  validate_min_count: computed(() => {
    if (form.mode == 'add' || form.mode == 'arival') {
      return 1
    } else if (form.mode == 'edit') {
      return 0
    }
  }),
  available_balance: computed(() => {
    return numberFmt(subNumbers(formState.out_account_id_balance, form.post.origin_amount))
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
      if (["in_account_title_id", "out_account_title_id", "application_reason"].includes(name)) {
        return true
      }
      return false
    }
    else if (form.mode == 'edit') {
      if (["in_account_title_id", "out_account_title_id"].includes(name)) {
        return true
      } return false
    }
    else if (form.mode == 'arival') {
      if (["in_account_title_id", "out_account_title_id", "application_reason"].includes(name)) {
        return true
      }
      return false
    }
    return false
  },
  formTitle: computed(() => {
    if (form.mode == "add") {
      return "在途资金-添加"
    }
    else if (form.mode == "edit") {
      return "在途资金-编辑"
    }
    else if (form.mode == "view") {
      return "在途资金-查看"
    } else if (form.mode == "arival") {
      return "在途资金-到账"
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
  if (form.post.out_account_id) {
    formState.out_account_id_loading = true
    const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.out_account_id })
    formState.out_account_id_color = 'black'
    formState.out_account_id_loading = false
    formState.out_account_id_balance = numberFmt(resp.ending_balance)
    formState.out_account_id_currency = resp.currency
  } else {
    formState.out_account_id_color = 'transparent'
    formState.out_account_id_balance = ''
    formState.out_account_id_currency = ''
  }
})

watch(() => form.post.received_amount, () => {
  form.post.commission = subNumbers(form.post.origin_amount, form.post.received_amount)
})


watch(() => form.post.received_amount, () => {
  console.log('here');
  formState.in_account_id_balance = addNumbers(formState.in_account_id_balance_base, form.post.received_amount)
})


const resetDetails = () => {
  resetForm()
}
//新增
const addTransit = () => {
  resetForm()
  form.mode = 'add'
  form.show = true
}
// 查看
const viewTransit = async data => {
  form.post = {
    user_id: store.user.id,
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
    note: data.note,
    commission: data.commission,
    out_account_title_id: data.out_account_title_id,
  }
  form.mode = "view"
  form.show = true
}

// 编辑
const editTransit = async data => {
  form.post = {
    user_id: store.user.id,
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
    note: data.note,
    commission: data.commission,
    out_account_title_id: data.out_account_title_id,

    application_reason: null,
    voucher_ext_id: data.voucher_ext_id
  }
  form.mode = "edit"
  form.show = true
}

// 到账
const arivalTransit = async data => {
  form.post = {
    user_id: store.user.id,
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    attachment_list: data.attachment_list.map(v => { return { url: v.path } }),
    note: data.note,
    commission: data.commission,
    out_account_title_id: data.out_account_title_id,

    voucher_ext_id: data.voucher_ext_id
  }
  form.mode = 'arival'
  form.show = true
}

// 备注
const noteTransit = async (row) => {
  form.notePost.note = row.note
  form.notePost.voucher_ext_id = row.voucher_ext_id
  form.noteShow = true
}

const submitNoteTransit = async () => {
  const data = { user_id: store.user.id, voucher_ext_id: form.notePost.voucher_ext_id, note: form.notePost.note }
  try {
    const resp = await api.transit.noteTransit(data)
    form.noteShow = false
    form.notePost.note = ''
    form.notePost.voucher_ext_id = null
    Message.success("备注已修改!")
    onSearch(1, null)
  } catch (error) {
    Message.error(error)
  }
}
// 撤销
const cancelTransit = async (row) => {
  form.cancelShow = true
  form.cancelPost.voucher_ext_id = row.voucher_ext_id
}

const submitCancelTransfit = async () => {
  try {
    const resp = await api.transit.cancelTransit({ user_id: store.user.id, voucher_ext_id: form.cancelPost.voucher_ext_id })
    form.cancelShow = false
    message.success("修改已撤销!")
    onSearch(1, null)
  } catch (error) {
    message.warning(error)
  }
}

//审核
const auditTransit = async (row) => {
  form.auditShow = true
  form.auditPost.applicant = row.voucher_ext_last.applicant
  form.auditPost.application_reason = row.voucher_ext_last.application_reason
  form.auditPost.application_time = row.voucher_ext_last.application_time
  form.auditPost.voucher_ext_id = row.voucher_ext_id
}

const submitAuditTransit = async () => {
  try {
    const resp = await api.transit.auditTransit({ user_id: store.user.id, voucher_ext_id: form.auditPost.voucher_ext_id })
    form.auditShow = false
    message.success("修改审核已通过!")
    onSearch(1, null)
  } catch (error) {
    message.warning(error)
  }
}

const formRules = reactive({
  'post.origin_amount': [
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
  "post.attachment_list": [
    {
      required: true,
      validator: (rule, value, call_back) => {
        return uploadRef.value.validate(rule, value, call_back)
      }, trigger: 'change'
    }
  ],
  "post.application_reason": [
    { required: true, trigger: "change", message: "请填写修改原因!" }
  ]
})


const uploadRef = ref(null)
const drawRef = ref(null)

const onSubmitForm = async () => {
  if (form.mode == "add") {
    formRef.value.validate().then(async (valid, fields) => {
      if (valid) {
        const uploads = await uploadRef.value.uploadImage()
        const data = { ...form.post }
        delete data.application_reason
        delete data.voucher_ext_id
        data.attachment_list = JSON.stringify(uploads)
        data.currency = formState.in_account_id_currency
        try {
          const resp = await api.transit.addTransit(data)
          form.show = false
          resetForm()
          message.success("在途资金已添加!")
          onSearch(1, null)
        } catch (error) {
          message.error("在途资金添加失败!")
        }
      }
    })
  } else if (form.mode == 'edit') {
    formRef.value.validate().then(async valid => {
      if (valid) {
        const uploads = await uploadRef.value.uploadImage()
        const data = { ...form.post }
        console.log(form.post.attachment_list)
        data.attachment_list = form.attrs.attachment_list
        if (uploads) {
          uploads.forEach(f => data.attachment_list.push({ url: f }))
        }
        data.attachment_list = JSON.stringify(data.attachment_list)
        data.currency = formState.in_account_id_currency
        try {
          console.log(form.attrs.attachment_list);
          const resp = await api.transit.editTransit(data)
          form.show = false
          resetForm()
          message.success("在途资金已修改!")
          onSearch(1, null)
        } catch (error) {
          message.error("在途资金修改失败!")
        }
      }
    })
  } else if (form.mode == 'arival') {
    formRef.value.validate().then(async valid => {
      if (valid) {
        const uploads = await uploadRef.value.uploadImage()
        const data = { ...form.post }
        data.attachment_list = JSON.stringify(uploads)
        data.currency = formState.in_account_id_currency
        data.in_account_title_id = 195
        try {
          console.log(form.attrs.attachment_list);
          const resp = await api.transit.arrivalTransit(data)
          form.show = false
          resetForm()
          message.success("在途资金已到账!")
          onSearch(1, null)
        } catch (error) {
          message.error("在途资金到账失败!")
        }
      }
    })
  }

}
const cancelClick = () => {
  drawRef.value.handleClose()
}
const handleClose = () => {
  resetForm()
}

const crop = setUpCapture(src => {
  form.post.attachment_list.push({
    url: src
  })
})

</script>

<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>在途资金</h4>
        </template>
      </Header>

      <div class="pannel">
        <el-form :inline="true" :model="queryForm" class="demo-form-inline" ref="queryFormRef">
          <el-form-item label="提现银行">
            <el-input v-model="queryForm.out_account_alias_name" placeholder="支持模糊查找" clearable  @keyup.enter="onSearch(1, null)"/>
          </el-form-item>
          <el-form-item label="日期">
            <el-select v-model="queryForm.condition" placeholder="">
              <el-option label="全部" value="0" />
              <el-option label="今天" value="1" />
              <el-option label="昨天" value="2" />
              <el-option label="近7天" value="3" />
              <el-option label="本月" value="4" />
              <el-option label="上月" value="5" />
            </el-select>
          </el-form-item>
          <el-form-item label="在途状态">
            <el-select v-model="queryForm.status" placeholder="">
              <el-option label="全部" value="0" />
              <el-option label="在途中" value="1" />
              <el-option label="已到账" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
            <el-button type="primary" @click="addTransit">添加</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="tableData" :height="tableHeight" highlight-current-row :show-header="pageInfo.totalCount > 0">
          <template #empty>
            <el-empty :image-size="200" />
          </template>
          <el-table-column label="序号" width="60">
            <template #default="scope">
              <div>{{ scope.$index + 1 + (pageInfo.currentPage - 1) * pageInfo.pageSize }}</div>
            </template>
          </el-table-column>
          <el-table-column label="摘要信息" width="254">
            <template #default="scope">
              <div :class="{ audit: scope.row.voucher_ext_last.is_audit == 1 }">
                <div>编号：<span class="user-black">{{ scope.row.sn }}</span></div>
                <div>状态：<span class="bold" :style="{ color: scope.row.status === 1 ? 'red' : 'green' }">{{
          scope.row.status === 1 ? '在途中' :
            '已到账' }}</span></div>
                <div>备注：<span class="user-black">{{ scope.row.note }}</span></div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="银行信息">
            <template #default="scope">
              <div>提现银行：<span class="user-black">{{ scope.row.out_account_alias_name }}</span></div>
              <div>到账银行：<span class="user-black">{{ scope.row.in_account_alias_name }}</span></div>
              <div>提现时间：<span class="user-black">{{ timestampToFormattedString(scope.row.create_time) }}</span></div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="260">
            <template #default="scope">
              <p>创建：<span class="user-black">{{ scope.row.creator + `(${scope.row.department_name})` }}</span></p>
              <el-space>
                <p>操作：</p>
                <el-button size="default" type="primary" @click="viewTransit(scope.row)" link>
                  查看
                </el-button>
                <el-button v-if="store.canModify && scope.row.voucher_ext_last.is_audit == 0" size="default"
                  type="primary" @click="editTransit(scope.row)" link>
                  编辑
                </el-button>
                <el-button v-if="store.canModifyNote" size="default" type="primary" @click="noteTransit(scope.row)"
                  link>
                  备注
                </el-button>
                <el-button v-if="store.canCancel && scope.row.voucher_ext_last.is_audit == 1" size="default"
                  type="danger" @click="cancelTransit(scope.row)" link>
                  撤销
                </el-button>
                <el-button v-if="store.canAudit && scope.row.voucher_ext_last.is_audit == 1" size="default"
                  type="success" @click="auditTransit(scope.row)" link>
                  审核
                </el-button>
                <el-button v-if="scope.row.voucher_ext_last.is_audit == 0 && scope.row.status == 1" size="default"
                  type="primary" @click="arivalTransit(scope.row)" link>
                  到账
                </el-button>
              </el-space>

            </template>
          </el-table-column>

        </el-table>
        <el-pagination size="default" style="padding-top: 5px;" v-model:current-page="pageInfo.currentPage"
          v-show="pageInfo.totalCount > 0" v-model:page-size="pageInfo.pageSize" background="true"
          :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          :total="pageInfo.totalCount" />

        <el-drawer v-model="form.show" :title="formState.formTitle" direction="rtl" size="50%" destroy-on-close
          :close-on-click-modal="false" ref="drawRef" @closed="resetDetails">
          <template #default>
            <el-form :model="form" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="提现账户" prop="post.out_account_id" required :show-message="false">
                <div class="form-item-row" v-loading="formState.out_account_id_loading">
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

              <el-form-item label="提现支出金额" prop="post.origin_amount" required>
                <div class="form-item-row">
                  <el-input-number v-model="form.post.origin_amount"
                    :disabled="formState.getDisabledState('origin_amount')" style="width: 100%;" :precision="2"
                    clearable :controls="false">
                  </el-input-number>
                  <div>
                    <span :class="formState.available_color">可用余额</span>
                    <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
                    <span :class="formState.available_color == 'transparent' ? 'transparent' : 'red'">{{ " " +
          formState.out_account_id_currency }}</span>
                  </div>
                </div>

              </el-form-item>

              <el-form-item label="在途支出科目" prop="post.out_account_title_id" required :show-message="false">
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getDisabledState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="到账账户" prop="post.in_account_id" required :show-message="false">
                <div class="form-item-row" v-loading="formState.in_account_id_loading">
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

              <el-form-item label="提现手续费" prop="post.commission" :show-message="false">
                <el-input-number v-model="form.post.commission" :disabled="formState.getDisabledState('commission')"
                  style="width: 100%;" :precision="2" :controls="false">
                </el-input-number>
              </el-form-item>

              <el-form-item label="提现到账金额" prop="post.received_amount" required :show-message="false">
                <el-col :span="17">
                  <el-input-number v-model="form.post.received_amount" :precision="2" :controls="false"
                    style="width: 100%;" :disabled="formState.getDisabledState('received_amount')" />
                </el-col>
                <el-col :span="7">
                  <el-select v-model="form.post.received_currency" placeholder="" style="padding-left:5px">
                    <el-option v-for="item in bank.currencies" :key="item.id" :label="item.code" :value="item.code" />
                  </el-select>
                </el-col>
              </el-form-item>

              <el-form-item label="备注" prop="post.note" :show-message="false">
                <el-input v-model="form.post.note" type="textarea" :rows="3"
                  :disabled="formState.getDisabledState('note')"></el-input>
              </el-form-item>

              <el-form-item v-if="!formState.getDisabledState('application_reason')" label="修改原因" required
                prop="post.application_reason">
                <el-input v-model.trim="form.post.application_reason" type="textarea" :rows="3"></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="post.attachment_list">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transit"
                  :validate-min-count="formState.validate_min_count" :size="66"
                  :disabled="formState.getDisabledState('attachment_list')"></Upload>

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-tooltip effect="dark" content="创建在途资金后, 系统会自动创建支出记录, 无需手动创建支出记录!" placement="top">
                <el-button link>
                  <el-icon>
                    <QuestionFilled />
                  </el-icon>
                </el-button>
              </el-tooltip>
              <el-button v-show="!formState.getDisabledState('crop')" link type="danger" @click="crop">截图
                <el-icon>
                  <PictureFilled />
                </el-icon>
              </el-button>
              <el-button @click="cancelClick">取消</el-button>
              <el-button v-show="!formState.getDisabledState('button')" type="primary"
                @click="onSubmitForm">确认</el-button>
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
              <el-button type="primary" @click="submitCancelTransfit">
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
              <el-button type="primary" @click="submitAuditTransit">
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

.form-item-row {
  display: flex;
  flex-direction: column;
  width: 100%;
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

.bold {
  font-weight: 600
}

.user-black {
  color: black;
  user-select: text;
}

.transparent {
  color: transparent
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