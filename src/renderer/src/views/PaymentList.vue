<script setup>
import { onBeforeMount, reactive, ref, watch, onActivated, onDeactivated } from 'vue'
import { Check, Delete, Files, Warning, Remove, Search, RefreshLeft } from '@element-plus/icons-vue'
import { dateTimeFmt, numberFmt } from '@/utils/format'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import Message from '@/utils/message'
import { useAccountStore, useExcelStore, useDingdingSubmitStore, useUserStore } from '@/stores'
import PaymentMerge from './PaymentMerge.vue'
import PaymentInfo from './PaymentInfo.vue'
import BankTransferAdd from './BankTransferAdd.vue'
import { useLocalConfig } from "@/stores/config"
import { useIntervalFn } from "@vueuse/core"

const route = useRoute()
const router = useRouter()
const cfg = useLocalConfig()
const dd = useDingdingSubmitStore()
const store = useUserStore()

onBeforeMount(() => {
  onSearch()
})

const { pause, resume, isActive } = useIntervalFn(() => {
  if (store.user.id) {
    onSearch()
  }
}, 1000 * 60 * 10)

onActivated(() => {
  // if (!isActive.value) {
  //   console.log('resume')
  //   resume()
  // }
  onSearch()
})

// onDeactivated(() => {
//   if (isActive.value) {
//     console.log('pause')
//     pause()
//   }
// })

const checkAll = ref(false)
const isIndeter = ref(false)
const listTitle = ref('全选（0）')
const approves = ref([])
const mergeState = reactive({
  currency: '',
  total_amount: '',
  approves: []
})
const passDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const rejectCommentVisible = ref(false)
const mergeDialogVisible = ref(false)
let preprocess = []
let isLoading = false

const types = reactive([
  { label: '待打款', value: 'pending', count: 0 },
  { label: '预打款', value: 'preprocess', count: 0 },
  { label: '已打款', value: 'processed', count: 0 }
])
const reasons = {
  0: '',
  1: '付款方式选择错误',
  2: '顾客收款账号错误',
  3: '打款金额错误',
  4: '打款币种错误',
  5: '其它',
}

const form = reactive({
  type: 'pending',
  condition: '',
  currency: '',
  payment_date: '',
  page: 1,
  limit: 20
})

const noMore = ref(false)

const dialogForm = reactive({
  status: 0,
  approval_number_item: [],
  reasonType: '',
  comment: ''
})
const dialogFormReset = () => {
  dialogForm.status = 0
  dialogForm.approval_number_item = []
  dialogForm.reasonType = ''
  dialogForm.comment = ''
  passDialogVisible.value = false
  rejectDialogVisible.value = false
  rejectCommentVisible.value = false
}

const scrollbarRef = ref()

watch(() => dialogForm.reasonType, () => {
  rejectCommentVisible.value = dialogForm.reasonType == 5
})

const accountStore = useAccountStore()
const currencies = accountStore.currencies

const onAllCheck = val => {
  approves.value.forEach(item => item.isChecked = val)
  preprocess = val ? approves.value : []
  types[1].count = preprocess.length
  isIndeter.value = false
  listTitle.value = val ? `已选 ${approves.value.length} 个` : `全选（${approves.value.length}）`
}

const onCheck = () => {
  const checks = approves.value.filter(item => item.isChecked)
  if (checks.length == approves.value.length) {
    isIndeter.value = false
    checkAll.value = true
    listTitle.value = `已选 ${checks.length} 个`
  } else if (checks.length == 0) {
    isIndeter.value = false
    checkAll.value = false
    listTitle.value = `全选（${approves.value.length}）`
  } else {
    isIndeter.value = true
    listTitle.value = `已选 ${checks.length} 个`
  }
  preprocess = checks
  types[1].count = preprocess.length
}

const onDate = val => {
  form.page = 1
  form.payment_date = val.toLocaleDateString().replaceAll('/', '-')
  onSearch()
}

const onRefresh = () => {
  form.page = 1
  onSearch()
}

const onSearch = async () => {
  checkAll.value = false
  try {
    const data = await api.getPaymentList(form)
    data.list.forEach(item => item.isChecked = false)
    if (form.page == 1) {
      approves.value = data.list
      isIndeter.value = false
      scrollbarRef.value.setScrollTop(0)
    } else {
      approves.value = approves.value.concat(data.list)
      isIndeter.value = approves.value.some(item => item.isChecked)
      if (data.list.length < form.limit) {
        noMore.value = true
      }
    }
    if (form.type == 'pending') {
      const checks = preprocess.map(item => item.id)
      approves.value.forEach(item => {
        item.isChecked = checks.includes(item.id)
      })
      listTitle.value = checks.length ? `已选 ${checks.length} 个` : `全选（${approves.value.length}）`
      isIndeter.value = checks.length > 0 && checks.length != approves.value.length
      checkAll.value = checks.length == approves.value.length
      types[0].count = data.count
    }
  } finally {
    isLoading = false
  }
}

const onDetail = (id, item) => {
  if (form.type === 'pending') {
    firstItem.value = item.items[0]
    if (bankAccountTitleIds.includes(firstItem.value.account_title_id)) {
      showAddDrawer.value = true
    } else {
      preSubmitdingding(item)
    }
  } else {
    router.push({ name: 'paymentInfo', params: { id }, query: { type: form.type } })
  }
}

const showAddDrawer = ref(false)
const firstItem = ref(null)
const bankAccountTitleIds = [181, 197]

const preSubmitdingding = async (item) => {
  dd.approve = item
  dd.change()
  router.push({ name: 'paymentForm' })
}


const onSegmented = val => {
  if (val == 'processed') {
    router.push({ name: 'blank', query: { type: val } })
  }
  noMore.value = false
  if (val == 'preprocess') {
    router.push({ name: 'blank', query: { type: val } })
    approves.value = preprocess
    return
  }
  form.page = 1
  form.payment_date = ''
  form.condition = ''
  form.currency = ''

  onSearch()
  if (val == 'pending') {
    router.push({ name: 'paymentForm' })
  }
}

const onScroll = options => {
  if (form.type == 'preprocess' || noMore.value) return
  const listHeight = document.querySelector('.el-scrollbar__view').clientHeight
  const boxHeight = document.querySelector('.rows').clientHeight
  if (options.scrollTop > 0 && options.scrollTop >= listHeight - boxHeight - 1 && !isLoading) {
    isLoading = true
    form.page++
    onSearch()
  }
}

const onRemove = index => {
  approves.value.splice(index, 1)
  preprocess = approves.value
  types[1].count = preprocess.length
  Message.success('移除成功')
}

const onAllRemove = () => {
  if (preprocess.length == 0) {
    Message.warning('请选择要操作的审批')
    return
  }
  preprocess = approves.value = []
  types[1].count = 0
  Message.success('移除成功')
}

const onShowReviewDialog = status => {
  if (preprocess.length == 0) {
    Message.warning('请选择要操作的审批')
    return
  }
  dialogForm.status = status
  dialogForm.approval_number_item = preprocess.map(item => item.approval_number)
  status == 1 ? (passDialogVisible.value = true) : (rejectDialogVisible.value = true)
}

// 合并打款
const onMergePayment = async () => {
  if (preprocess.length < 2) {
    Message.warning('请选择要合并的审批')
    return
  }
  const approval_number_list = preprocess.map(item => item.approval_number)

  // 校验是否能合并
  try {
    const res = await api.checkMergePayment({
      approval_number_list: JSON.stringify(approval_number_list)
    })
    mergeState.approves = preprocess
    mergeState.total_amount = res.origin_total_amount;
    mergeState.currency = res.currency
    mergeDialogVisible.value = true
  } catch (error) {

  }
}

// 合并打款完成
const onMerged = () => {
  mergeDialogVisible.value = false
  approves.value = []
  preprocess = []
  mergeState.approves = []
  types[1].count = 0
}

const onBatchReview = async status => {
  if (status == 2) {
    if (dialogForm.reasonType) {
      dialogForm.comment = dialogForm.reasonType == 5 ? dialogForm.comment : reasons[dialogForm.reasonType]
    }
    if (!dialogForm.comment) {
      Message.error('请输入拒绝理由')
      return
    }
  }
  await api.batchReview({
    status,
    approval_number_item: JSON.stringify(dialogForm.approval_number_item),
    comment: dialogForm.comment
  })
  dialogFormReset()
  preprocess = []
  approves.value = []
  types[1].count = 0
  Message.success('提交成功')
}

// const showRecordDrawer = ref(false)
const showRecordDrawer = ref(false)
const activeItem = ref(null)
const passSingleDialogVisible = ref(false)
const rejectSingleDialogVisible = ref(false)
const rejectSingleCommentVisible = ref(false)
const abnormalSingleDialogVisible = ref(false)
const abnormalCommentVisible = ref(false)
const dialogSingleForm = reactive({
  status: 0,
  reasonType: '',
  comment: '',
})
const dialogSingleFormReset = () => {
  dialogSingleForm.status = 0
  dialogSingleForm.reasonType = ''
  dialogSingleForm.comment = ''
  passSingleDialogVisible.value = false
  rejectSingleDialogVisible.value = false
  rejectSingleCommentVisible.value = false
  abnormalSingleDialogVisible.value = false
  abnormalCommentVisible.value = false
}


watch(() => dialogSingleForm.reasonType, () => {
  if (dialogSingleForm.status == 2) {
    rejectSingleCommentVisible.value = dialogSingleForm.reasonType == 5
  } else if (dialogSingleForm.status == 3) {
    abnormalCommentVisible.value = dialogSingleForm.reasonType == 5
  }
})

const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  Message.success("复制成功")
}
const feePayers = { 0: '--', 1: '我方', 2: '顾客', 3: '双方平摊' }

const fetchData = async () => {
  const data = await api.getPaymentDetail({
    id: props.detailId
  })
  approve.value = data.payment_detail.detail
  approve.value.cashier = data.payment_cashier.cashier
  approve.value.payment_error_msg = data.payment_cashier.payment_error_msg
  approve.value.payment_status = data.payment_cashier.payment_status
  approve.value.fee_payer_str = feePayers[data.payment_detail.detail?.fee_payer]

  tableData.value = data.payment_detail.items
  if (data.payment_detail.items.length > 0) {
    firstItem.value = data.payment_detail.items[0]
    if (bankAccountTitleIds.includes(firstItem.value.account_title_id)) {
      isBankTransfer.value = true
    }
  }
}

const detailsShow = ref(false)
const detailId = ref(null)
const viewPaymentDetails = id => {
  detailsShow.value = true
  detailId.value = id
}

const onShowDialog = (status, item) => {
  console.log('item ', item)
  console.log('dd ', dd.approve);
  activeItem.value = item
  dialogSingleForm.status = status
  switch (status) {
    case 1: passSingleDialogVisible.value = true; break;
    case 2: rejectSingleDialogVisible.value = true; break;
    case 3: abnormalSingleDialogVisible.value = true; break;
    default: passSingleDialogVisible.value = true; break;
  }
}

// 审核通过/拒绝
const onReview = async () => {
  if (dialogSingleForm.status == 2) {
    dialogSingleForm.comment = dialogSingleForm.reasonType == 5 ? dialogSingleForm.comment : reasons[dialogSingleForm.reasonType]
    if (!dialogSingleForm.comment) {
      Message.error('请输入拒绝理由')
      return
    }
  }

  if (dialogSingleForm.status == 1) {
    passSingleDialogVisible.value = false
  } else {
    rejectSingleDialogVisible.value = false
  }

  try {
    await api.review({
      id: activeItem.value.id,
      status: dialogSingleForm.status,
      comment: dialogSingleForm.comment.trim()
    })
    Message.success('审批完成')
    onSearch()
    // fetchData()
  } catch (error) {
    Message.success('审批失败')
  } finally {
    dialogSingleFormReset()
  }
}

// 打款异常
const onAbnoraml = async () => {
  dialogSingleForm.comment = dialogSingleForm.reasonType == 5 ? dialogSingleForm.comment : reasons[dialogSingleForm.reasonType]
  if (!dialogSingleForm.comment) {
    Message.error('请输入异常原因')
    return
  }

  abnormalSingleDialogVisible.value = true
  try {
    await api.abnormal({
      purchase_number: activeItem.value.purchase_number,
      payment_error_msg: dialogSingleForm.comment.trim()
    })
    onSearch()
  } catch (error) {
    console.log('err ', error)
  } finally {
    dialogSingleFormReset()
  }
}


</script>


<template>
  <div class="wrapper">
    <el-segmented class="segments" v-model="form.type" :options="types" @change="onSegmented" block>
      <template #default="{ item }">
        <div class="segment-item">
          <span>{{ item.label }}</span>
          <span v-if="item.count > 0" class="badge">{{ item.count > 99 ? '99+' : item.count }}</span>
        </div>
      </template>
    </el-segmented>

    <div class="filter">
      <el-form :inline="true" :model="form" v-show="form.type != 'preprocess'" @submit.prevent>
        <el-form-item v-show="form.type != 'preprocess'">
          <el-input v-model="form.condition" :prefix-icon="Search" placeholder="请输入关键字" @keyup.enter="onSearch"
            clearable />
        </el-form-item>
        <el-form-item v-show="form.type != 'preprocess'">
          <el-select v-model="form.currency" placeholder="币种" @change="onSearch" filterable>
            <el-option label="全部" value="" />
            <el-option v-for="item in currencies" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="tips" v-show="form.type == 'preprocess'">
        <el-popover placement="right-start" :width="400" trigger="hover">
          <template #reference>
            <el-button style="margin-right: 16px" :icon="Warning">合并要求</el-button>
          </template>
          <div>
            <ul class="tip-content">
              <li>合并打款的验证条件</li>
              <li>1、钉钉审批编号必须是系统中存在的记录；</li>
              <li>2、钉钉审批记录数必须在2条以上；</li>
              <li>3、合并付款的钉钉审批信息中的收款账号和币种必须相同；</li>
              <li>4、已打款的钉钉审批不能合并重复打款；</li>
            </ul>
          </div>
        </el-popover>
        <el-popover placement="right-start" :width="500" trigger="hover">
          <template #reference>
            <el-button style="margin-right: 16px" :icon="Warning">操作提示</el-button>
          </template>
          <div>
            <ul class="tip-content">
              <li>操作提示：</li>
              <li>1、合并打款操作条件，合并打款审批不能少于2条，不多于20条，打款币种和供应商收款账号需要相同，合并后的金额不能超过钉钉审批打款总金额。</li>
              <li>
                2、自动点单操作说明，自动点单功能是模拟打款员在各个后台（B2，GVG，VGolds和Mediamz）完成打款单的快捷操作方式，前置条件是钉钉打款审批来自各个系统自动提交的钉钉审批，手工创建的钉钉打款审批目前无法实现自动点单操作。
              </li>
              <li>3、已完成的打款单如系统未提示自动点单操作，需打款员手动点“通过”或“批量通过”操作。</li>
            </ul>
          </div>
        </el-popover>
      </div>
    </div>

    <div class="list">
      <div class="list-header">
        <div class="header-checkbox" v-show="form.type == 'pending'">
          <el-checkbox class="list-title" v-model="checkAll" :indeterminate="isIndeter" @change="onAllCheck">{{
      listTitle
    }}</el-checkbox>
          <el-tooltip content="布局" placement="top" hide-after="0" transition="none">
            <div class="custom-style">
              <el-segmented v-model="cfg.layout" size="small" :options="[
      { label: 'iconfont icon-buju-1x1', value: false, color: 'gray' },
      { label: 'iconfont icon-buju3', value: true, color: 'gray' }]">
                <template #default="{ item }">
                  <el-icon :color="item.color" :class="item.label">
                  </el-icon>
                </template>
              </el-segmented>
            </div>
          </el-tooltip>
        </div>
        <div class="header-btns" v-show="form.type == 'preprocess'">
          <el-tooltip content="通过" placement="top">
            <el-button type="success" size="small" :icon="Check" @click="onShowReviewDialog(1)" plain></el-button>
          </el-tooltip>
          <el-tooltip content="拒绝" placement="top">
            <el-button type="danger" size="small" :icon="Remove" @click="onShowReviewDialog(2)" plain></el-button>
          </el-tooltip>
          <el-tooltip content="移除" placement="top">
            <el-button type="warning" size="small" :icon="Delete" @click="onAllRemove" plain></el-button>
          </el-tooltip>
          <el-tooltip content="合并打款" placement="top">
            <el-button type="primary" size="small" :icon="Files" @click="onMergePayment" plain></el-button>
          </el-tooltip>
        </div>
        <el-form class="header-form" :inline="true" :model="form" v-show="form.type == 'processed'" @submit.prevent>
          <el-form-item>
            <el-date-picker v-model="form.payment_date" placeholder="请选择打款日期" @change="onDate" clearable />
          </el-form-item>
          <el-form-item>
            <el-button :icon="RefreshLeft" @click="onRefresh"></el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-scrollbar class="rows" @scroll="onScroll" ref="scrollbarRef">
        <div class="row" :class="{ active: route.path == '/payment/' + item.id, checked: item.isChecked }"
          v-for="(item, index) in approves" :key="item.id">
          <el-checkbox v-if="form.type == 'pending'" v-model="item.isChecked" @change="onCheck(item)"></el-checkbox>
          <el-button v-if="form.type == 'preprocess'" size="small" @click="onRemove(index)" type="warning"
            :icon="Delete" link></el-button>
          <div class="space" v-if="form.type == 'processed'"></div>
          <div class="row-content" @click="() => {
      if (form.type != 'pending') {
        onDetail(item.id, item)
      }
      if (!cfg.layout) {
        onDetail(item.id, item)
      }
    }">
            <div class="row-top">
              <div class="row-title">{{ item.process_name }}</div>
              <div class="row-time">{{ dateTimeFmt(item.create_time) }}</div>
            </div>
            <div class="row-bottom">
              <div class="row-subtitle user-select">{{ item.approval_number }}</div>
              <div class="row-other">{{ numberFmt(item.origin_total_amount) }} <span>{{ item.currency }}</span></div>
            </div>
            <div style="display: flex; width: 100%; flex-direction: column;gap:2px;margin-top:2px; " v-if="cfg.layout">
              <!-- <span class="user-select more error" v-if="item.payment_error_msg"><span class="error">审批异常：</span>{{ item.payment_error_msg }}</span> -->
              <span class="user-select more gray"><span class="gray">银行账号：</span>{{ item.bank_account || "--" }}</span>
              <span class="user-select more gray"><span class="gray">采购单号：</span>{{ item.purchase_number || "--"
                }}</span>
              <span class="user-select more gray"><span class="gray">支付对象/方式：</span>{{ item.payment_object || '--' }}
                <span class="more" style="color:#5BA3ED">{{ item.payment_method }}</span></span>

              <span class="user-select more gray"><span class="gray">申请人/部门：</span>{{ item.creator || "--" }} <span
                  class="more" style="color:#5BA3ED">{{ item.department_name }}</span> </span>
              <!-- <span class="user-select more gray"><span class="gray">所属部门：</span>{{ item.department_name || "--"}}</span> -->
              <span class="user-select more error" v-if="item.payment_error_msg"><span class="error"></span>{{
      item.payment_error_msg }}</span>

              <div v-show="form.type === 'pending'" style="display: flex; justify-content: flex-start;margin-top: 5px ">
                <el-button size="small" type="warn" @click="viewPaymentDetails(item.id)" link>查看</el-button>
                <el-button size="small" type="success" @click="onShowDialog(1, item)" link>通过</el-button>
                <el-button size="small" type="danger" @click="onShowDialog(2, item)" link>拒绝</el-button>
                <el-button size="small" type="info" @click="onShowDialog(3, item)" link>异常</el-button>
                <el-button size="small" type="warning" @click="onDetail(item.id, item)" link>填充</el-button>
              </div>

            </div>

          </div>
          <div class="row-abnormal" v-if="item.payment_error_msg"></div>
        </div>
        <div class="no-more" v-show="noMore">~ 到底啦 ~</div>
        <el-empty description=" " v-if="approves.length == 0" />
        <el-backtop target=".el-scrollbar__wrap" :bottom="20" :right="0" />
      </el-scrollbar>
    </div>
  </div>

  <!-- 批量通过确认弹窗 -->
  <el-dialog v-model="passDialogVisible" title="批量通过" width="320" align-center :close-on-click-modal="false">
    <div class="dialog-content">以下 {{ dialogForm.approval_number_item.length }} 条记录将被通过</div>
    <el-form :model="dialogForm">
      <el-form-item>
        <el-input :value="dialogForm.approval_number_item.join('\n')" rows="4" autocomplete="off" type="textarea"
          placeholder="请输入审批编号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormReset">取消</el-button>
        <el-button type="primary" @click="onBatchReview(1)">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 批量拒绝确认弹窗 -->
  <el-dialog v-model="rejectDialogVisible" title="批量拒绝" width="320" align-center :close-on-click-modal="false">
    <div class="dialog-content">以下 {{ dialogForm.approval_number_item.length }} 条记录将被拒绝</div>
    <el-form :model="dialogForm">
      <el-form-item>
        <el-input :value="dialogForm.approval_number_item.join('\n')" rows="4" autocomplete="off" type="textarea"
          placeholder="请输入审批编号" />
      </el-form-item>
      <el-form-item label="拒绝原因" placeholder="请选择拒绝原因" required>
        <el-select v-model="dialogForm.reasonType">
          <el-option label="顾客收款账号错误" value="2" />
          <el-option label="打款金额错误" value="3" />
          <el-option label="打款币种错误" value="4" />
          <el-option label="其它原因" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item v-show="rejectCommentVisible">
        <el-input v-model="dialogForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因"
          spellcheck="false" maxlength="100" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogFormReset">取消</el-button>
        <el-button type="primary" @click="onBatchReview(2)">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="mergeDialogVisible" title="合并付款" width="600" align-center destroy-on-close
    :close-on-click-modal="false">
    <PaymentMerge :approves="mergeState.approves" :total_amount="mergeState.total_amount"
      :currency="mergeState.currency" @completed="onMerged" />
  </el-dialog>

  <!-- 打款通过确认弹窗 -->
  <el-dialog v-model="passSingleDialogVisible" width="320" align-center :close-on-click-modal="false">
    <div class="dialog-content"><el-icon size="20" color="#409eff">
        <QuestionFilled />
      </el-icon> 确认已完成打款了吗？</div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSingleFormReset">取消</el-button>
        <el-button type="primary" @click="onReview">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 打款拒绝确认弹窗 -->
  <el-dialog v-model="rejectSingleDialogVisible" title="拒绝原因" width="320" align-center :close-on-click-modal="false">
    <el-form :model="dialogSingleForm">
      <el-form-item>
        <el-select v-model="dialogSingleForm.reasonType">
          <el-option label="请选择" value="" />
          <el-option label="付款方式选择错误" value="1" />
          <el-option label="顾客收款账号错误" value="2" />
          <el-option label="打款金额错误" value="3" />
          <el-option label="打款币种错误" value="4" />
          <el-option label="其它原因" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item v-show="rejectSingleCommentVisible">
        <el-input v-model="dialogSingleForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因"
          spellcheck="false" maxlength="100" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSingleFormReset">取消</el-button>
        <el-button type="primary" @click="onReview">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 打款异常弹窗 -->
  <el-dialog v-model="abnormalSingleDialogVisible" title="异常原因" width="320" align-center :close-on-click-modal="false">
    <el-form :model="dialogSingleForm">
      <el-form-item>
        <el-select v-model="dialogSingleForm.reasonType">
          <el-option label="请选择" value="" />
          <el-option label="付款方式选择错误" value="1" />
          <el-option label="顾客收款账号错误" value="2" />
          <el-option label="打款金额错误" value="3" />
          <el-option label="打款币种错误" value="4" />
          <el-option label="其它原因" value="5" />
        </el-select>
      </el-form-item>
      <el-form-item v-show="abnormalCommentVisible">
        <el-input v-model="dialogSingleForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因"
          spellcheck="false" maxlength="100" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSingleFormReset">取消</el-button>
        <el-button type="primary" @click="onAbnoraml">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 詳情弹窗 -->
  <el-dialog v-model="detailsShow" width="80%" title="明细查看" destroy-on-close :close-on-click-modal="false">
    <PaymentInfo :detail-id="detailId" mode="view"></PaymentInfo>
  </el-dialog>

  <!-- 银行转账抽屉 -->
  <el-drawer v-model="showAddDrawer" title="新增银行转账" direction="rtl" size="600" :close-on-press-escape="false"
    :close-on-click-modal="false" destroy-on-close>
    <BankTransferAdd :item="firstItem" @close="showAddDrawer = false" />
  </el-drawer>

</template>


<style scoped>
:deep(.custom-style .el-segmented) {
  --el-segmented-item-selected-color: var(--el-text-color-primary);
  --el-segmented-item-selected-bg-color: rgb(212, 212, 212);
  --el-border-radius-base: 0px;
  border: 1px solid rgb(239, 238, 238);
  padding: 0px;
}

:deep(.custom-style .el-segmented__group) {
  border-radius: 0px;
}

:deep(.el-button span) {
  font-size: 10pt !important;
}

.wrapper {
  height: 100%;
}

.user-select {
  user-select: text
}

.more {
  font-size: 9pt;
}

.gray {
  /* color: gray; */
  color: black;
  font-weight: 500
}

.error {
  /* color: #ef8787; */
  text-align: center;
  color: white;
  background-color: rgb(205, 7, 7);
  /* background-color: black; */
}

/* 选项卡 */
.segments {
  padding: 0 10px;
  min-height: 30px;
}

:deep(.el-segmented__item-label) {
  font-size: 0.9em;
}

:deep(.el-segmented__group) {
  background-color: #fff;
  border: none;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-segmented__item) {
  position: relative;
}

.badge {
  display: inline-block;
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  padding: 0 5px;
  background-color: #ff6262;
  box-shadow: 1px 1px 1px 0 #ff4545;
  color: #fff;
  font-size: 11px;
  border-radius: 8px;
}

/* 筛选表单 */
.filter {
  padding: 14px 10px 8px;
}

.filter :deep(.el-form--inline),
.header-form {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 8px;
}

.filter :deep(.el-form-item),
.header-form :deep(.el-form-item) {
  margin: 0;
}

.filter :deep(.el-input),
.header-form :deep(.el-input) {
  width: 180px;
}

.filter :deep(.el-select),
.filter .el-form :deep(.el-button),
.header-form :deep(.el-button) {
  width: 90px;
}

.tips {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  gap: 5px;
  line-height: 32px;
  padding: 0 10px;
}

.tips :deep(.el-button) {
  margin: 0 !important;
}

.tips :deep(.el-icon) {
  font-size: 1.2em;
}

/* 列表 */
.list {
  height: calc(100% - 114px);
}

.header-checkbox {
  display: flex;
  align-items: center;
  padding: 10px;
}

.list-title {
  width: 100%;
  height: 20px;
}

.header-btns {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 6px 10px 10px;
}

.header-btns :deep(.el-button) {
  font-size: 1em;
  margin: 0;
}

.header-form {
  padding: 0 10px 8px;
}

.rows {
  height: calc(100% - 40px);
  border-top: 1px solid #e7e7e7;
  overflow-y: auto;
}

.rows :deep(.el-backtop) {
  position: fixed;
  left: 290px;
}

.row {
  display: flex;
  position: relative;
  padding-right: 10px;
  background-color: #fff;
  border-bottom: 1px solid rgb(234, 234, 234);
}

.row.checked {
  background-color: #eff7ff;
}

.row.active,
.row:hover {
  background-color: #f1f1f1;
}

.row.active.checked {
  background-color: #e0edf9;
}

.row :deep(.el-checkbox) {
  width: 34px;
  height: 38px;
  padding: 10px;
}

/* .row :deep(.el-button) {
  width: 34px;
  height: 38px;
  padding: 10px;
  font-size: 1em;
} */

.row .space {
  width: 10px;
  height: 10px;
}

.row-content {
  display: flex;
  flex-direction: column;
  width: calc(100% - 52px);
  flex: 1;
  padding: 8px 0 8px 0;
  color: #333;
}

.row-top,
.row-bottom {
  display: flex;
  justify-items: center;
  gap: 8px;
}

.row-title,
.row-subtitle {
  flex: 1;
}

.row-subtitle {
  color: black !important;
  font-weight: 500;
}

.row-title {
  font-size: 0.85em;
  font-weight: 500;
  color: #383a3d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-subtitle {
  font-size: 0.8em;
  color: #979b9d;
}

.row-time,
.row-other {
  min-width: 50px;
  text-align: right;
}

.row-other {
  color: rgb(78, 72, 72) !important;
  font-weight: 500;
  /* color: black !important; */
}

.row-time {
  font-size: 0.75em;
  /* color: #9d9d9d; */
  color: black;
}

.row-other {
  font-size: 0.8em;
  color: #675757;
  text-wrap: nowrap;
}

.row-other span {
  font-size: 0.8em;
  color: #333;
  font-weight: bold;
}

ul {
  padding-left: 0;
}

.row-abnormal {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, transparent 50%, #ff6262 50%);
}

.no-more {
  height: 30px;
  line-height: 30px;
  text-align: center;
  color: #b0b7cc;
  font-size: 0.8em;
}
</style>