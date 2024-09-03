<script setup>
import { reactive, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { dateTimeFmt, numberFmt } from '@/utils/format'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useUserStore } from "@/stores"

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const status = ref('unpayment')

const types = [
  { label: '待打款', value: 'pending', count: 10 },
  { label: '预打款', value: 'prepayment', count: 0 },
  { label: '已打款', value: 'processed', count: 8 }
]

const formData = reactive({
  user_id: store.user.id,
  type: 'pending',
  condition: '',
  currency: '',
  page: 1,
  limit: 15
})

const currencyList = ref(['USD', 'CNY', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'HKD', 'SGD', 'CHF', 'KRW', 'INR', 'RUB', 'MXN', 'BRL', 'ZAR', 'TRY', 'THB', 'IDR', 'MYR', 'PHP', 'VND', 'CZK', 'DKK','HUF', 'NOK', 'PLN', 'SEK'])

const approves = ref([])

const onAllCheck = () => {
  //
}

const onCheck = (item) => {
  item.isChecked = !item.isChecked
}

const onSubmit = async () => {
  try {
    const data = await api.getPaymentList(formData)
    if (formData.page == 1) {
      approves.value = data.list
    } else {
      approves.value = approves.value.concat(data.list)
    }
  } catch (error) {
    console.log(error)
  }
}

const onDetail = id => {
  router.push({ name: 'paymentInfo', params: { id }})
}
</script>


<template>
  <el-segmented class="segments" v-model="status" :options="types" block>
    <template #default="{ item }">
      <div class="segment-item">
        <span>{{ item.label }}</span>
        <span v-if="item.count > 0" class="badge">{{ item.count > 99 ? '99+' : item.count }}</span>
      </div>
    </template>
  </el-segmented>

  <div class="filter">
    <el-form :inline="true" :model="formData" @submit.prevent>
      <el-form-item>
        <el-input v-model="formData.condition" :suffix-icon="Search" placeholder="请输入关键字" @keyup.enter="onSubmit" clearable />
      </el-form-item>
      <el-form-item>
        <el-select v-model="formData.currency" placeholder="币种">
          <el-option label="全部" value="" />
          <el-option v-for="currency in currencyList" :label="currency" :value="currency" />
        </el-select>
      </el-form-item>
    </el-form>
  </div>

  <div class="list">
    <div class="list-header">
      <el-checkbox class="list-title" @change="onAllCheck()">全选 ({{ approves.length }})</el-checkbox>
    </div>
    <el-scrollbar class="rows">
      <div class="row" :class="{ active: route.path == '/payment/' + item.id, checked: item.isChecked }" v-for="item in approves" :key="item.id">
        <el-checkbox :value="item.id" :checked="item.isChecked" @change="onCheck(item)"></el-checkbox>
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
    </el-scrollbar>
  </div>
</template>


<style scoped>
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
  top: 1px;
  right: 1px;
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
  padding: 16px 10px;
}
.filter :deep(.el-form--inline) {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.filter :deep(.el-form-item) {
  margin: 0;
}
.filter :deep(.el-input) {
  width: 180px;
}
.filter :deep(.el-select) {
  width: 90px;
}

/* 列表 */
.list {
  height: calc(100% - 124px);
}
.list-header {
  display: flex;
  align-items: center;
  padding: 0 10px 10px;
}
.list-title {
  width: 100%;
  height: 20px;
}
.rows {
  height: calc(100% - 30px);
  border-top: 1px solid #e5e9ed;
  overflow-y: auto;
}
.row {
  display: flex;
  padding: 0 10px;
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
  width: 14px;
  height: 50px;
  padding: 0 0 12px;
}
.row-content {
  display: flex;
  flex-direction: column;
  width: calc(100% - 52px);
  flex: 1;
  padding: 8px 0 8px 10px;
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