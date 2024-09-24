<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '@/api'
import { numberFmt, dateTimeFmt } from '@/utils/format'
import { Check, Close, Search } from '@element-plus/icons-vue'
import Message from '../utils/message';


const props = defineProps({
  accountId: Number,
  accounts: Array,
})

const emit = defineEmits(['submit', 'cancel'])

const today = new Date()
const form = reactive({
  account_id: props.accountId,
  status: ['Settled'],
  payer: '',
  start_date: new Date(today.setDate(today.getDate() - 1)),
  end_date: new Date()
})
const formRef = ref(null)
const statuses = reactive([
  { label: '处理中', value: 'Pending' },
  { label: '已完成', value: 'Settled' }
])

const table = reactive({
  data: [],
  total: 0,
  currentRow: null,
  loading: false
})
const loading = ref(false)
const local = reactive({
  data: []
})

const onStartDate = date => {
  form.start_date = date
}

const onEndDate = date => {
  form.end_date = date
}

const onSelectRow = row => {
  table.currentRow = row
}

const onSearch = async () => {
  loading.value = true
  try {
    table.data = await api.getAirwallexData({
      account_id: form.account_id,
      status: JSON.stringify(form.status),
      start_date: form.start_date ? dateTimeFmt(form.start_date, 3) : '',
      end_date: form.end_date ? dateTimeFmt(form.end_date, 3) : ''
    })
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const onSubmit = () => {
  if (!table.currentRow) {
    Message.error('请选择一行数据！')
    return
  }
  emit('submit', table.currentRow, local.data.includes(table.currentRow.transaction_number_airwallex))
}

const queryRecord = async () => {
  const endDate = Math.round(new Date().getTime() / 1000)
  const startDate = endDate - 86400 * 30
  const res = await electron.sql.query(`SELECT * FROM dingtalk_submit_log WHERE update_time BETWEEN ${startDate} AND ${endDate}`, {})
  local.data = res.map(item => item.transaction_number_airwallex)
}

onMounted(() => {
  onSearch()
  queryRecord()
})
</script>


<template>
  <el-form :model="form" ref="formRef" :inline="true" label-width="80" @submit.prevent>
    <el-form-item label="付款账号">
      <el-select v-model="form.account_id" disabled>
        <el-option v-for="item in accounts" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="选择状态">
      <el-select v-model="form.status" multiple>
        <el-option v-for="item in statuses" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="付款人">
      <el-input v-model="form.payer" placeholder="请搜索付款人" clearable />
    </el-form-item>
    <el-form-item label="开始时间">
      <el-date-picker v-model="form.start_date" placeholder="请选择开始时间" @change="onStartDate" clearable />
    </el-form-item>
    <el-form-item label="结束时间">
      <el-date-picker v-model="form.end_date" placeholder="请选择结束时间" @change="onEndDate" clearable />
    </el-form-item>
    <el-form-item label=" ">
      <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
    </el-form-item>
  </el-form>

  <el-table :data="table.data" @current-change="onSelectRow" v-loading="loading" highlight-current-row>
    <el-table-column width="50">
      <template #default="scope">
        <el-icon color="#dcdfe6" size="20" v-show="table.currentRow != scope.row">
          <i class="iconfont icon-radio"></i>
        </el-icon>
        <el-icon color="#409eff" size="20" v-show="table.currentRow == scope.row">
          <i class="iconfont icon-radio-fill"></i>
        </el-icon>
      </template>
    </el-table-column>

    <el-table-column>
      <template #default="scope">
        <div class="item">
          <span class="item-label">付款账号：</span>
          <span class="item-value">{{ scope.row.account_name }}</span>
        </div>
        <div class="item">
          <span class="item-label">交易类型：</span>
          <span class="item-value">{{ scope.row.transaction_event_code }}</span>
        </div>
        <div class="item">
          <span class="item-label">付款人：</span>
          <span class="item-value">{{ scope.row.payer_full_name }}</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column width="160">
      <template #default="scope">
        <div class="item">
          <span class="item-label">金额：</span>
          <span class="item-value">{{ numberFmt(scope.row.amount) }} {{ scope.row.amount_currency }}</span>
        </div>
        <div class="item">
          <span class="item-label">手续费：</span>
          <span class="item-value">{{ numberFmt(scope.row.fee) }} {{ scope.row.fee_currency }}</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column width="130">
      <template #default="scope">
        <div class="item">
          <span class="item-label">状态：</span>
          <span class="item-value" :class="'status-' + scope.row.airwallex_status.toLowerCase()">{{ scope.row.airwallex_status }}</span>
        </div>
        <div class="item" v-if="local.data.includes(scope.row.transaction_number_airwallex)">
          <span class="item-label">是否关联：</span>
          <span class="item-value status-binding">已关联</span>
        </div>
      </template>
    </el-table-column>

    <el-table-column width="200">
      <template #default="scope">
        <div class="item">
          <span class="item-label">创建时间：</span>
          <span class="item-value">{{ scope.row.initiation_date }}</span>
        </div>
        <div class="item">
          <span class="item-label">更新时间：</span>
          <span class="item-value">{{ scope.row.updated_date }}</span>
        </div>
        <div class="item">
          <span class="item-label">备注：</span>
          <span class="item-value">{{ scope.row.note }}</span>
        </div>
      </template>
    </el-table-column>
  </el-table>

  <div class="btns">
    <el-button :icon="Close" @click="emit('cancel')" plain>取消</el-button>
    <el-button type="primary" :icon="Check" @click="onSubmit">确认</el-button>
  </div>
</template>


<style scoped>
.win {
  width: 100vw;
  height: 100vh;
  border-radius: 8px;
  background-color: #f5f6f9;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}
.text-total {
  line-height: 36px;
  padding-right: 16px;
  font-size: 0.8em;
  color: #409eff;
}
.el-form {
  padding: 8px 0;
}
.el-form--inline .el-form-item {
  width: 260px;
  margin: 0 0 8px;
}
:deep(.cell) {
  padding: 0 5px;
}
.item {
  display: flex;
  align-items: center;
}
.item-label {
  color: #99a;
  font-size: 12px;
}
.item-value {
  color: #353549;
  font-size: 13px;
}
.status-settled {
  color: #67c23a;
}
.status-pending {
  color: #409eff;
}
.status-binding {
  color: #f56c6c;
}
:deep(td:first-child .cell) {
  text-align: center !important;
}
.el-icon .iconfont {
  font-size: inherit;
}
.btns {
  padding: 16px 8px 0;
  text-align: right;
}
</style>