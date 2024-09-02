<script setup>
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { timestampToFormattedString, numberFmt } from "@/utils/format"
import { useClient } from "@/utils/client"
import { useUserStore, useAccountStore } from "@/stores"
import api from "@/api"
import Message from "@/utils/message"

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
  },
  previewImageShow: false,
  previewImageUrl: null,

  noteShow: false,
  modifyNote: "",
  notePost: {
    voucher_ext_id: null,
    note: ''
  },


})

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
    attachment_list: [],
    note: null,
    commission: null,
    out_account_title_id: 179, // 财务费-在途支出
  }
  formState.in_account_id_loading = false
  formState.out_account_id_loading = false
  formRef.value?.resetFields()
}

const formState = reactive({
  currentPreviewImageIndex: 0,
  currentPreviewSrc: '',
  previewImageShow: false,
  in_account_id_loading: false,
  out_account_id_loading: false,
  in_account_id_color: 'transparent',
  out_account_id_color: 'transparent',
  in_account_id_balance: '',
  out_account_id_balance: '',
  in_account_id_currency: '',
  out_account_id_currency: '',
  available_balance: computed(() => {
    const rs = parseFloat((formState.out_account_id_balance || '0').replaceAll(',', '')) - parseFloat((form.post.origin_amount || '0').toString().replaceAll(',', ''))
    return numberFmt(rs)
  }),
  available_color: computed(() => {
    if (form.post.origin_amount) {
      return "black"
    } return "transparent"
  }),
  previewList: computed(() => {
    return form.post.attachment_list.map(v => v.url)
  }),
  currentPreviewIndex: computed(() => {

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
    formState.in_account_id_color = 'black'
    formState.in_account_id_loading = false
    formState.in_account_id_balance = numberFmt(resp.available_balance)
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
    formState.out_account_id_balance = numberFmt(resp.available_balance)
    formState.out_account_id_currency = resp.currency
  } else {
    formState.out_account_id_color = 'transparent'
    formState.out_account_id_balance = ''
    formState.out_account_id_currency = ''
  }
})

//新增
const addTransit = () => {
  resetForm()
  form.show = true
  form.mode = 'add'
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
  }
  form.mode = 'arival'
  form.show = true
}
// {'voucher_ext_id': '3521589', 'user_id': '139', 'origin_amount': '8000.00', 'received_amount': '0.00', 'received_currency': 'CNY', 'attachment_list': '["/transit/202408/20240829094234_0.png"]', 'note': '收：service@ka-leka.com 提现111aaa', 'commission': '0.00', 'in_account_title_id': 195, 'out_account_title_id': 179}

// 备注
const noteTransit = async (row) => {
  form.notePost.note = row.note
  form.notePost.voucher_ext_id = row.voucher_ext_id
  form.noteShow = true
}

const submitNoteTransit = async () => {
  const data = { user_id: store.user.id, voucher_ext_id: form.notePost.voucher_ext_id, note: form.notePost.note }
  console.log('post data', data);
  try {
    const resp = await api.transit.noteTransit(data)
    form.noteShow = false
    form.notePost.note = ''
    form.notePost.voucher_ext_id = null
    Message.success("已修改!")
  } catch (error) {
    Message.error(error)
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


const uploadRef = ref(null)
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
  resetForm()
}

electron.onCapture(async (src) => {
  // const url = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(buffer)))
  form.post.attachment_list.push({
    url: src
  })
})

const crop = () => {
  electron.capture().then(res => {
    console.log('rs ===> ', res)
  })
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
        <div ref="queryFormRef">
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
              <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
              <el-button type="primary" @click="addTransit">添加</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- style="height: calc(100vh - 210px)" -->
        <el-table :data="tableData" :height="tableHeight" stripe>
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
                <el-button size="default" type="primary" @click="viewTransit(scope.row)" link>
                  查看
                </el-button>
                <el-button size="default" type="primary" @click="editTransit(scope.row)" link>
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

        <el-drawer v-model="form.show" :title="formState.formTitle" direction="rtl" size="50%" @closed="handleClose"
          ref="drawRef">
          <template #default>
            <el-form :model="form" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

              <el-form-item label="提现账户" prop="post.out_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;"
                  v-loading="formState.out_account_id_loading">
                  <el-select v-model="form.post.out_account_id" filterable
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

              <el-form-item label="提现支出金额" prop="post.origin_amount" required>
                <div style=" display: flex;flex-direction: column;width: 100%;">
                  <el-input-number v-model="form.post.origin_amount"
                    :disabled="formState.getDisabledState('origin_amount')" style="width: 100%;" :precision="2"
                    :controls="false">

                  </el-input-number>
                  <p>
                    <span :class="formState.available_color">可用余额</span>
                    <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
                    <span :class="formState.available_color == 'transparent' ? 'transparent' : 'red'">{{ " " +
            formState.out_account_id_currency }}</span>
                  </p>
                </div>

              </el-form-item>

              <el-form-item label="在途支出科目" prop="post.out_account_title_id" required>
                <el-select v-model="form.post.out_account_title_id" filterable
                  :disabled="formState.getDisabledState('out_account_title_id')">
                  <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>

              <el-form-item label="提现手续费" prop="post.commission">
                <el-input-number v-model="form.post.commission" :disabled="formState.getDisabledState('commission')"
                  style="width: 100%;" :precision="2" :controls="false">
                  <template #suffix>
                    <span>{{ form.currency }}</span>
                  </template>
                </el-input-number>
              </el-form-item>

              <el-form-item label="到账账户" prop="post.in_account_id" required>
                <div style=" display: flex;flex-direction: column;width: 100%;"
                  v-loading="formState.in_account_id_loading">
                  <el-select v-model="form.post.in_account_id" filterable
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

              <el-form-item label="提现到账金额" prop="post.received_amount" required>
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

              <el-form-item label="备注" prop="post.note">
                <el-input v-model="form.post.note" type="textarea" :rows="3"
                  :disabled="formState.getDisabledState('note')"></el-input>
              </el-form-item>

              <el-form-item label="图片上传" prop="post.attachment_list">
                <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transit"
                  :handlePreview="(file, index) => {
            formState.currentPreviewImageIndex = index
            formState.currentPreviewSrc = file.url
            formState.previewImageShow = true
            console.log('file ==> ', form.post.attachment_list)
          }" :disabled="formState.getDisabledState('attachment_list')" @done="r => {
            console.log('rs', r)
          }"></Upload>

              </el-form-item>

            </el-form>
          </template>
          <template #footer>
            <div style="flex: auto">
              <el-button v-show="!formState.getDisabledState('crop')" link type="danger" @click="crop">截图
                <el-icon>
                  <PictureFilled />
                </el-icon>
              </el-button>
              <el-button @click="cancelClick">取消</el-button>
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

        <el-drawer v-model="formState.previewImageShow" size="100%">
          <div style="display: flex; justify-content: center;align-items: center">
            <el-image :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" fit="cover"
              :initial-index="formState.currentPreviewImageIndex" :src="formState.currentPreviewSrc"
              :preview-src-list="formState.previewList">
              <template #error>
                <div class="image-slot">
                  <el-empty description="404" />
                </div>
              </template>
            </el-image>
          </div>

        </el-drawer>

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

.red {
  color: red
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>