<script setup>
import { computed, reactive, watch } from 'vue'
import { addNumbers, dateTimeFmt, numberFmt } from '@/utils/format'
import { Close, Check } from '@element-plus/icons-vue'
import api from '@/api';
import message from '../utils/message';


const props = defineProps({
  rows: Array,
  mode: Number
})

const table = reactive({
  data: props.rows
})

const disabled = computed(() => {
  if (props.mode === 0) {
    return false
  }
  return true
})

watch(() => props.rows, () => {
  table.data = props.rows
})

const totalAmountCNY = computed(() => {
  const rs = {}
  const s = new Set()
  table.data.forEach(v => {
    if (!s.has(v.currency)) {
      s.add(v.currency)
      rs[v.currency] = [v.origin_total_amount]
    } else {
      rs[v.currency].push(v.origin_total_amount)
    }
  })
  const ret = []
  Object.keys(rs).forEach(key => {
    ret.push({ value: numberFmt(rs[key].reduce((acc, cur) => addNumbers(acc, cur), 0)), currency: key })
    // return table.data.reduce((acc, cur) => acc + parseFloat(cur.origin_total_amount), 0)
  })
  console.log('ret ==> ', ret, rs)
  return ret
  // return table.data.reduce((acc, cur) => acc + parseFloat(cur.origin_total_amount), 0)
})

const emit = defineEmits(['close'])

const onSubmit = async () => {

  // 核销
  if (props.mode === 0) {
    const items = table.data.map(item => {
      return {
        payment_id: item.payment_id,
        amount: item.origin_total_amount,
        currency: item.currency,
        note: item.note,
        type: item.type
      }
    })

    try {
      console.log('items', items)
      await api.creditCard.review({
        item_list: JSON.stringify(items)
      })
      message.success('提交成功')
    } finally {
      emit('close')
    }
  }
  // 复核
  else if (props.mode === 1) {
    const items = table.data.map(item => {
      return {
        id: item.id,
        type: item.type
      }
    })
    try {
      await api.creditCard.checkReview({
        item_list: JSON.stringify(items)
      })
      message.success('提交成功')
    } finally {
      emit('close')
    }
  }

}
</script>


<template>
  <el-table :data="table.data" height="381" :row-key="row => 'tb-' + row.id">
    <el-table-column type="index" label="#" width="30" />
    <el-table-column prop="creator" label="申请人" width="70"></el-table-column>
    <el-table-column label="部门" width="150">
      <template #default="scope">
        {{ scope.row.department_name }}丨{{ scope.row.company_name }}
      </template>
    </el-table-column>
    <!-- <el-table-column label="金额" width="120" align="right">
      <template #default="scope">
        <span class="amount">{{ numberFmt(scope.row.origin_total_amount) }}</span>
        <span class="currency">{{ scope.row.currency }}</span>
      </template>
    </el-table-column> -->
    <el-table-column label="金额" width="140" align="left">
      <template #default="scope">
        <el-input v-model="scope.row.origin_total_amount" onkeyup="value=value.replace(/[^\-?\d.]/g,'')"
          :disabled="disabled" class="input-amount">
          <template #append>{{ scope.row.currency }}</template>
        </el-input>
      </template>
    </el-table-column>
    <el-table-column label="备注">
      <template #default="scope">
        <el-input v-model="scope.row.note" spellcheck="false" maxlength="50" :disabled="disabled"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="创建时间" width="110">
      <template #default="scope">
        {{ dateTimeFmt(scope.row.create_time, 2) }}
      </template>
    </el-table-column>
  </el-table>
  <div class="total-amount flex gap-4 flex-c-center">
    <span class="label">{{ props.mode === 0 ? '本次核销金额：' : '本次复核金额' }}</span>
    <div v-for="item in totalAmountCNY" class="flex gap-2 flex-c-center">
      <!-- <span class="amount" v-for="item in totalAmountCNY">{{ numberFmt(item.value) }}</span> -->
      <span class="amount t-red" >{{ numberFmt(item.value) }}</span>
      <span class="currency">{{ item.currency }}</span>
    </div>
    <!-- <span class="amount" v-for="item in totalAmountCNY">{{ numberFmt(totalAmountCNY.toFixed(2)) }}</span>
    <span class="currency">{{ props.rows[0].currency }}</span> -->
    <!-- <span class="amount" v-for="item in totalAmountCNY">{{ numberFmt(totalAmountCNY.toFixed(2)) }}</span> -->
  </div>

  <div class="btn-group">
    <el-button type="primary" :icon="Check" @click="onSubmit">提交</el-button>
    <el-button :icon="Close" @click="emit('close')">取消</el-button>
  </div>

</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
}

:deep(.cell) {
  padding: 0 5px;
}

:deep(.el-input-group__append) {
  padding: 0 6px;
  font-size: 0.8em;
}

.input-amount :deep(.el-input__wrapper) {
  padding: 0 10px 0 5px;
}

.input-amount :deep(.el-input__inner) {
  text-align: right;
}

.amount {
  padding-right: 5px;
  color: #303133;
  font-size: 1.1em;
}

.currency {
  color: #353535;
  font-weight: 600;
}

.total-amount {
  padding: 5px 0;
}

.btn-group {
  text-align: right;
}
</style>