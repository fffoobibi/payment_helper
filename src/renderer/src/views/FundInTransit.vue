<script setup>
import { reactive, ref, watch, computed } from 'vue'
import { timestampToFormattedString } from "@/utils/format"
import { useUserStore, useAccountStore } from "@/stores"
import api from "@/api"
import axios from 'axios'
import Message from "@/utils/message"


const store = useUserStore()
const bank = useAccountStore()
const tableData = ref([])

const queryForm = reactive({
  out_account_alias_name: '',
  condition: '0',
  status: '0',
  user_id: store.user.id,
  page: 1,
  limit: 10,
})

const pageInfo = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: null,
})

watch(() => pageInfo.currentPage, async () => {
  await onSubmit()
})

watch(() => pageInfo.pageSize, async () => {
  pageInfo.currentPage = 1
  await onSubmit(1, null)
})

const onSubmit = async (page = null, pageSize = null) => {
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

// 增删改查
const details = reactive({
  show: false,
  previewImageShow: false,
  previewImageUrl: null,
  mode: "add",
  noteShow: false,
  modifyNote: "",
  notePost: {
    voucher_ext_id: null,
    note: ''
  }
})

const handlePictureCardPreview = (file) => {
  console.log('ff', file);
  details.previewImageShow = true
  details.previewImageUrl = file.url
}

const formState = reactive({
  out_account_id_disabled: computed(() => {
    if (details.mode === "arival") {
      return true
    } return false
  }),
  in_account_id_disabled: computed(() => {
    if (details.mode === "arival") {
      return true
    } return false
  }),
  out_account_title_disabled: computed(() => {
    if (details.mode === "arival") {
      return true
    } return false
  }),
  confirmButtonState: computed(() => {
    if (details.mode !== "view") {
      return true
    } return false
  }),
  uploadDisabled: computed(() => {
    if (["view"].includes(details.mode)) {
      return true
    } return false
  }),
  formTitle: computed(() => {
    if (details.mode == "add") {
      return "在途资金-添加"
    }
    else if (details.mode == "edit") {
      return "在途资金-编辑"
    }
    else if (details.mode == 'view') {
      return "在途资金-查看"
    }
    else if (details.mode == 'arival') {
      return "在途资金-到账"
    }
  })
})

const formRef = ref(null)
const form = reactive({
  available_balance: "",
  currency: "",
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
  }
})

// 详情查看
const viewTransit = async (out_account_id, data) => {
  // const resp = await api.transit.getAccountDetail({ user_id: store.user.id, account_id: out_account_id })
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
  details.mode = "view"
  details.show = true
}
// 编辑
const editTransit = async (out_account_id, data) => {
  // const resp = await api.transit.getAccountDetail({ user_id: store.user.id, account_id: out_account_id })
  form.post = {
    user_id: store.user.id,
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    attachment_list: data.attachment_list,
    note: data.note,
    commission: data.commission,
    out_account_title_id: data.out_account_title_id,
  }
  details.mode = "edit"
  details.show = true
}

// 到账
const arivalTransit = async (data) => {
  form.post = {
    user_id: store.user.id,
    out_account_id: data.out_account_id,
    in_account_id: data.in_account_id,
    origin_amount: data.origin_amount,
    currency: data.currency,
    received_amount: data.received_amount,
    received_currency: data.received_currency,
    attachment_list: data.attachment_list,
    note: data.note,
    commission: data.commission,
    out_account_title_id: data.out_account_title_id,
  }
  details.mode = 'arival'
  details.show = true
}
// {'voucher_ext_id': '3521589', 'user_id': '139', 'origin_amount': '8000.00', 'received_amount': '0.00', 'received_currency': 'CNY', 'attachment_list': '["/transit/202408/20240829094234_0.png"]', 'note': '收：service@ka-leka.com 提现111aaa', 'commission': '0.00', 'in_account_title_id': 195, 'out_account_title_id': 179}



// 新增
const resetForm = () => {
  form.post =
  {
    user_id: store.user.id,
    out_account_id: null,
    in_account_id: null,
    origin_amount: null,
    currency: null,
    received_amount: null,
    received_currency: null,
    attachment_list: [{ name: "11.png", url: 'http://bdfiletest.baizhoucn.com/transit/202408/222111.png' }],
    note: null,
    commission: null,
    out_account_title_id: null,
  }
}
const formRules = reactive({
  'post.origin_amount': [
    { required: true, message: '请输入提现支出金额', trigger: 'blur' },
  ],
  'post.out_account_id': [
    { required: true, message: '请选择提现账户', trigger: 'blur' },
  ]
})
const computedAvailableBalance = computed(() => {
  const a = form.available_balance || "0"
  const b = form.post.origin_amount || "0"
  const rs = parseFloat(a) - parseFloat(b)
  if (rs == 0) {
    return ""
  }
  return rs
})

const handleBankChange = (accountId) => {
  const info = bank.getAccountInfo(accountId)
  form.available_balance = info.available_balance
  form.currency = info.currency
}

const uploadRef = ref(null)
const uploadImage = async (options) => {
  const f = new FormData()
  const { data, file, action } = options
  Object.keys(data).forEach(key => {
    // console.log('add field', key, data[key])
    f.append(key, data[key])
  })
  f.append('file', file)
  // console.log('options ==> ', options)
  const response = await axios.post("/upload", f, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  })
  // console.log('upload resp: ', response)
  console.log("file list ", form.post.attachment_list)
  return response.data

}
const drawRef = ref(null)

const confirmClick = () => {
  // uploadRef.value.submit()
  uploadRef.value.uploadImage()
  console.log("data ==> ", form.post)
}
const cancelClick = () => {
  drawRef.value.handleClose()
}
const handleClose = () => {
  formRef.value.resetFields()
  resetForm()
}

// 备注
const modifyNoteForm = reactive({
  show: false,
  post: {
    note: '',
    voucher_ext_id: null
  }
})
const noteTransit = async (row) => {
  console.log('row ==> ', row);
  modifyNoteForm.post.note = row.note
  modifyNoteForm.post.voucher_ext_id = row.voucher_ext_id
  modifyNoteForm.show = true
}

const submitNoteTransit = async () => {
  const data = { user_id: store.user.id, voucher_ext_id: modifyNoteForm.post.voucher_ext_id, note: modifyNoteForm.post.note }
  console.log('post data', data);
  try {
    const resp = await api.transit.noteTransit(data)
    modifyNoteForm.show = false
    modifyNoteForm.post.note = ''
    modifyNoteForm.post.voucher_ext_id = null
    Message.success("已修改!")
  } catch (error) {
    Message.error(error)
  }
}
const handleNoteTransitClose = () => {

}

</script>

<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>在途资金</h4>
        </template>

        <template #option>
          <el-button size="small" class="option-add" link @click="onAdd">
            <i class="iconfont icon-tianjia"></i>
            新增</el-button>
        </template>
      </Header>

      <div class="pannel">
        <el-form :inline="true" :model="queryForm" class="demo-form-inline">
          <el-form-item label="提现银行">
            <el-input v-model="queryForm.out_account_alias_name" placeholder="支持模糊查找" clearable />
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
            <el-button type="primary" @click="onSubmit(1, null)">查询</el-button>
            <el-button type="primary" @click="() => {
            details.mode = 'add'
            details.show = true
          }">添加</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="tableData" style="height: calc(100vh - 210px)" stripe>
          <template #empty>
            <el-empty :image-size="200" />
          </template>
          <el-table-column label="序号" width="60">
            <template #default="scope">
              <div>{{ scope.$index + 1 }}</div>
            </template>
          </el-table-column>
          <el-table-column label="摘要信息">
            <template #default="scope">
              <div>编号：{{ scope.row.sn }}</div>
              <div>状态：<span :style="{ color: scope.row.status === 1 ? 'red' : 'green' }">{{
            scope.row.status === 1 ? '在途中' :
              '已到账' }}</span></div>
              <div>备注：{{ scope.row.note }}</div>
            </template>
          </el-table-column>
          <el-table-column label="银行信息">
            <template #default="scope">
              <div>提现银行：{{ scope.row.out_account_alias_name }}</div>
              <div>到账银行：{{ scope.row.in_account_alias_name }}</div>
              <div>提现时间：{{ timestampToFormattedString(scope.row.create_time) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="操作">
            <template #default="scope">
              <p>创建：{{ scope.row.creator + `(${scope.row.department_name})` }}</p>
              <el-space class="row-bg">
                <p>操作: </p>
                <el-button size="default" type="primary" @click="viewTransit(scope.row.out_account_id, scope.row)" link>
                  查看
                </el-button>
                <el-button size="default" type="primary" @click="editTransit(scope.row.out_account_id, scope.row)" link>
                  编辑
                </el-button>
                <el-button size="default" type="primary" @click="noteTransit(scope.row)" link>
                  备注
                </el-button>
                <el-button size="default" type="primary" @click="arivalTransit(scope.row)" link>
                  到账
                </el-button>
              </el-space>

            </template>
          </el-table-column>

        </el-table>
        <el-pagination size="default" style="padding-top: 5px;" v-model:current-page="pageInfo.currentPage"
          v-model:page-size="pageInfo.pageSize" background="true" :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper" :total="pageInfo.totalCount" />

        <el-drawer v-model="details.show" :title="formState.formTitle" direction="rtl" size="50%" @closed="handleClose"
          ref="drawRef">
          <template #default>
            <el-form :model="form" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="提现账户" prop="post.out_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
                    :disabled="formState.out_account_id_disabled">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>

                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span style="color:black">实时余额 </span>
                      <span style="color:black">{{ form.available_balance }}</span>
                      <span style="color:red">{{ " " + form.currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="提现支出金额" prop="post.origin_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input v-model="form.post.origin_amount">
                    <template #suffix>
                      <p>{{ form.currency }}</p>
                    </template>
                  </el-input>
                  <p>
                    <span style="color:black">可用余额 {{ computedAvailableBalance }}</span>
                    <span style="color:red">{{ " " + form.currency }}</span>
                  </p>
                </div>

              </el-form-item>

              <el-form-item label="在途支出科目" prop="post.out_account_title_id" required>
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.out_account_title_disabled">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="提现手续费" prop="post.commission">
                <el-input v-model="form.post.commission">
                  <template #suffix>
                    <span>{{ form.currency }}</span>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="到账账户" prop="post.in_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-select v-model="form.post.in_account_id" filterable :disabled="formState.in_account_id_disabled">
                    <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                      :value="item.id" />
                  </el-select>
                  <div style="display: flex;justify-content: flex-start;align-items: center">
                    <p><span style="color:black">实时余额 </span>
                      <span style="color:black">{{ form.available_balance }}</span>
                      <span style="color:red">{{ " " + form.currency }}</span>
                    </p>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="提现到账金额" prop="post.received_amount" required>
                <el-col :span="17">
                  <el-input v-model="form.post.received_amount" type="number" />
                </el-col>
                <el-col :span="7">
                  <el-select v-model="form.post.received_currency" placeholder="" style="padding-left:5px">
                    <el-option v-for="item in bank.currencies" :key="item.id" :label="item.code" :value="item.code" />
                  </el-select>
                </el-col>
              </el-form-item>

              <el-form-item label="备注" prop="post.note">
                <el-input v-model="form.post.note" type="textarea" :rows="3" show-word-limit></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="post.note">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transit" :disabled="formState.uploadDisabled"
                  @done="r => {
            console.log('rs', r)
          }"></Upload>

                <!-- <el-upload ref="uploadRef" action="http://bduploadtest.baizhoucn.com" list-type="picture-card"
                  accept="image/*" :data="{
            dir: 'transit',
            file_name: '11.png',
            token: 'b7M89zeAFj8ts493d1Ujz2HrjC'
          }" :auto-upload="false" :show-file-list="true" :http-request="uploadImage" multiple
                  v-model:file-list="form.post.attachment_list" :on-preview="handlePictureCardPreview"
                  :on-error="(rsp, f, fs) => { console.log('error upload', rsp) }"
                  :on-success="(rsp, f, fs) => { console.log('ssss ==> ', rsp) }">
                  <el-icon>
                    <Plus />
                  </el-icon>
                </el-upload> -->

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-button @click="cancelClick">取消</el-button>
              <el-button v-show="formState.confirmButtonState" type="primary" @click="confirmClick">确认</el-button>
            </div>
          </template>
        </el-drawer>

        <el-dialog v-model="modifyNoteForm.show" title="备注修改" width="500" :before-close="handleClose">
          <el-input type="textarea" v-model="modifyNoteForm.post.note"></el-input>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="modifyNoteForm.show = false">关闭</el-button>
              <el-button type="primary" @click="submitNoteTransit">
                确认
              </el-button>
            </div>
          </template>
        </el-dialog>

        <!-- <el-drawer v-model="details.previewImageShow" size="100%">
          <el-image 
            :src="details.previewImageUrl" 
            :zoom-rate="1.2" :max-scale="7"
            :min-scale="0.2" fit="cover" :initial-index="0"
            :preview-src-list="['http://bdfiletest.baizhoucn.com/transit/202408/222111.png']"
            />
        </el-drawer> -->

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

:deep(.el-upload.el-upload--picture-card),
:deep(.el-upload-list__item-actions),
:deep(.el-upload-list__item-thumbnail),
:deep(.el-upload-list__item) {
  width: 66px !important;
  height: 66px !important;
}
</style>