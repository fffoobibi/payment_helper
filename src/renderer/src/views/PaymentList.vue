<script setup>
import { onBeforeMount, reactive, ref, watch } from 'vue'
import { Check, Delete, Download, Files, Warning, Remove, Search } from '@element-plus/icons-vue'
import { dateTimeFmt, numberFmt } from '@/utils/format'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import Message from '@/utils/message'


const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  onSubmit()
})

const checkAll = ref(false)
const isIndeter = ref(false)
const listTitle = ref('全选（0）')
const approves = ref([])
const passDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
let preprocess = []
let isLoading = false

const types = reactive([
  { label: '待打款', value: 'pending', count: 0 },
  { label: '预打款', value: 'preprocess', count: 0 },
  { label: '已打款', value: 'processed', count: 0 }
])

const form = reactive({
  type: 'pending',
  condition: '',
  currency: '',
  payment_date: '',
  page: 1,
  limit: 20
})
const dialogForm = reactive({
  status: 0,
  numbers: []
})

const currencyList = ref(['CNY', 'USD', 'HKD', 'EUR', 'JPY', 'BRL', 'AUD', 'TWD', 'KRW', 'PLN', 'RUF', 'PHP', 'MXN'])


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
  onSubmit()
}

const onSubmit = async () => {
  checkAll.value = false
  try {
    const data = await api.getPaymentList(form)
    data.list.forEach(item => item.isChecked = false)
    if (form.page == 1) {
      approves.value = data.list
      isIndeter.value = false
    } else {
      approves.value = approves.value.concat(data.list)
      isIndeter.value = approves.value.some(item => item.isChecked)
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
  } catch (error) {
    console.log(error)
  } finally {
    isLoading = false
  }
}

const onDetail = id => {
  router.push({ name: 'paymentInfo', params: { id }})
}

const onSegmented = val => {
  router.push({ name: 'blank' })
  if (val == 'preprocess') {
    approves.value = preprocess
    return
  }
  form.page = 1
  form.payment_date = ''
  form.condition = ''
  form.currency = ''

  onSubmit()
}

const onScroll = options => {
  if (form.type == 'preprocess') return
  const listHeight = document.querySelector('.el-scrollbar__view').clientHeight
  const boxHeight = document.querySelector('.rows').clientHeight
  if (options.scrollTop > 0 && options.scrollTop >= listHeight - boxHeight && !isLoading) {
    isLoading = true
    form.page ++
    onSubmit()
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

const onExport = async () => {
  // const data = await api.getPaymentList(form)
  // const blob = new Blob([JSON.stringify(data.list)], { type: 'application/json' })
  // const url = URL.createObjectURL(blob)
  // const a = document.createElement('a')
  // a.href = url
  // a.download = '打款列表.json'
  // a.click()
}

const onBatchReview = status => {
  if (preprocess.length == 0) {
    Message.warning('请选择要操作的审批')
    return
  }
  dialogForm.status = status
  if (status == 1 || status == 2) {
    status == 1 ? (passDialogVisible.value = true) : (rejectDialogVisible.value = true)
    dialogForm.numbers = preprocess.map(item => item.approval_number)
  } else {

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
          <el-input v-model="form.condition" :prefix-icon="Search" placeholder="请输入关键字" @keyup.enter="onSubmit" clearable />
        </el-form-item>
        <el-form-item v-show="form.type != 'preprocess'">
          <el-select v-model="form.currency" placeholder="币种" @change="onSubmit">
            <el-option label="全部" value="" />
            <el-option v-for="currency in currencyList" :label="currency" :value="currency" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="tips" v-show="form.type == 'preprocess'">
        <el-popover placement="right-start" :width="200" trigger="hover">
          <template #reference>
            <el-button style="margin-right: 16px" :icon="Warning">打款说明</el-button>
          </template>
          <div>一次合并打款个数不超过20个</div>
        </el-popover>
        <el-popover placement="right-start" :width="400" trigger="hover">
          <template #reference>
            <el-button style="margin-right: 16px" :icon="Warning">操作提示</el-button>
          </template>
          <div>
            <div class="tip-content">
              <p>1. 预打款功能用于在打款前预览打款金额，并预览打款时间。</p>
              <p>2. 预打款功能仅用于预览，打款时间将按照实际打款时间进行打款。</p>
              <p>3. 预打款功能仅用于预览，打款时间将按照实际打款时间进行打款。</p>
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <div class="list">
      <div class="list-header">
        <div class="header-checkbox" v-show="form.type == 'pending'">
          <el-checkbox class="list-title" v-model="checkAll" :indeterminate="isIndeter" @change="onAllCheck">{{ listTitle }}</el-checkbox>
        </div>
        <div class="header-btns" v-show="form.type == 'preprocess'">
          <el-button type="success" size="small" title="通过" :icon="Check" @click="onBatchReview(1)" plain></el-button>
          <el-button type="danger" size="small" title="拒绝" :icon="Remove" @click="onBatchReview(2)" plain></el-button>
          <el-button type="warning" size="small" title="移除" :icon="Delete" @click="onAllRemove" plain></el-button>
          <el-button type="primary" size="small" title="合并打款" :icon="Files" @click="onBatchReview(3)" plain></el-button>
        </div>
        <el-form class="header-form" :inline="true" :model="form" v-show="form.type == 'processed'" @submit.prevent>
          <el-form-item>
            <el-date-picker v-model="form.payment_date" placeholder="请选择打款日期" @change="onDate" clearable />
          </el-form-item>
          <el-form-item>
            <el-button :icon="Download" @click="onExport">导出</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-scrollbar class="rows" @scroll="onScroll">
        <div class="row" :class="{ active: route.path == '/payment/' + item.id, checked: item.isChecked }" v-for="(item, index) in approves" :key="item.id">
          <el-checkbox v-if="form.type == 'pending'" v-model="item.isChecked" @change="onCheck(item)"></el-checkbox>
          <el-button v-if="form.type == 'preprocess'" size="small" @click="onRemove(index)" type="warning" :icon="Delete" link></el-button>
          <div class="space" v-if="form.type == 'processed'"></div>
          <div class="row-content" @click="onDetail(item.id)">
            <div class="row-top">
              <div class="row-title">{{ item.process_name }}</div>
              <div class="row-time">{{ dateTimeFmt(item.create_time) }}</div>
            </div>
            <div class="row-bottom">
              <div class="row-subtitle">{{ item.approval_number }}</div>
              <div class="row-other">{{ numberFmt(item.origin_total_amount)}} <span>{{ item.currency }}</span></div>
            </div>
          </div>
        </div>
        <el-empty description=" " v-if="approves.length == 0" />
        <el-backtop target=".el-scrollbar__wrap" :bottom="20" :right="0" />
      </el-scrollbar>
    </div>
  </div>

  <!-- 批量通过确认弹窗 -->
  <el-dialog v-model="passDialogVisible" title="批量通过" width="320" align-center>
    <div class="dialog-content">以下 {{ dialogForm.numbers.length }} 条记录将被通过</div>
    <el-form :model="dialogForm">
      <el-form-item>
        <el-input :value="dialogForm.numbers.join('\n')" rows="4" autocomplete="off" type="textarea" placeholder="请输入审批编号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="passDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="passDialogVisible = false">确认</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 批量拒绝确认弹窗 -->
  <el-dialog v-model="rejectDialogVisible" title="批量拒绝" width="320" align-center>
    <div class="dialog-content">以下 {{ dialogForm.numbers.length }} 条记录将被拒绝</div>
    <el-form :model="dialogForm">
      <el-form-item>
        <el-input :value="dialogForm.numbers.join('\n')" rows="4" autocomplete="off" type="textarea" placeholder="请输入审批编号" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="rejectDialogVisible = false">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>


<style scoped>
.wrapper {
  height: 100%;
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
:deep(.el-form--inline) {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 8px;
}
:deep(.el-form-item) {
  margin: 0;
}
:deep(.el-input),
:deep(.el-date-picker) {
  width: 180px;
}
:deep(.el-select),
.el-form :deep(.el-button) {
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
  border-top: 1px solid #e5e9ed;
  overflow-y: auto;
}
.rows :deep(.el-backtop) {
  position: fixed;
  left: 290px;
}
.row {
  display: flex;
  padding-right: 10px;
  background-color: #fff;
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
.row :deep(.el-button) {
  width: 34px;
  height: 38px;
  padding: 10px;
  font-size: 1em;
}
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
.row-time {
  font-size: 0.75em;
  color: #9d9d9d;
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
</style>