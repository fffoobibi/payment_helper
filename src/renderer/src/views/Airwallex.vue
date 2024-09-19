<script setup>
import { reactive, ref } from 'vue'
import api from '@/api'
import { numberFmt } from '@/utils/format';


const props = defineProps({
  accountId: Number,
  accounts: Array,
})

const count = ref(0)
const form = reactive({
  account_id: props.accountId,
  status: [],
  payer: '',
  start_date: '',
  end_date: ''
})
const formRef = ref(null)
const statuses = reactive([
  { label: '处理中', value: 'Pending' },
  { label: '已完成', value: 'Settled' }
])

const table = reactive({
  data: [],
  total: 0,
  currentIndex: null
})

const onStartDate = date => {
  form.start_date = date.toLocaleDateString().replaceAll('/', '-')
  onSubmit()
}

const onEndDate = date => {
  form.end_date = date.toLocaleDateString().replaceAll('/', '-')
  onSubmit()
}

const onSelectRow = row => {
  console.log(row.$index)

  // table.currentIndex = row.$index
}

const onSubmit = async () => {
  try {
    table.data = await api.getAirwallexData({
      account_id: form.account_id,
      status: JSON.stringify(form.status),
      start_date: form.start_date,
      end_date: form.end_date
    })
  } catch (error) {
    console.error(error)
  }
}
</script>


<template>
  <el-form :model="form" ref="formRef" :inline="true" label-width="80" @submit.prevent>
    <el-form-item label="付款账号">
      <el-select v-model="form.account_id" disabled>
        <el-option v-for="item in accounts" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="选择状态">
      <el-select v-model="form.status" @blur="onSubmit" multiple>
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
  </el-form>

  <el-table :data="table.data" @current-change="onSelectRow" highlight-current-row>
    <el-table-column width="50" type="index">
      <template #default="scope">
        <el-radio :value="scope.$index" v-model="table.currentIndex"></el-radio>
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
    <el-table-column>
      <template #default="scope">
        <div class="item">
          <span class="item-label">金额：</span>
          <span class="item-value">{{ numberFmt(scope.row.amount) }} {{ scope.row.amount_currency }}</span>
        </div>
        <div class="item">
          <span class="item-label">手续费：</span>
          <span class="item-value">{{ numberFmt(scope.row.fee) }} {{ scope.row.fee_currency }}</span>
        </div>
        <div class="item">
          <span class="item-label">状态：</span>
          <span class="item-value" :class="'status-' + scope.row.airwallex_status.toLowerCase()">{{ scope.row.airwallex_status }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column>
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
h4 {
  padding: 0 10px;
  color: #333;
}
.text-total {
  line-height: 36px;
  padding-right: 16px;
  font-size: 0.8em;
  color: #409eff;
}
.el-form {
  padding: 8px;
}
.el-form--inline .el-form-item {
  width: 270px;
  margin: 0 0 8px;
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
</style>