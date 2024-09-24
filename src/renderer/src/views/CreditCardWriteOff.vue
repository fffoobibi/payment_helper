<script setup>
import { computed, reactive, watch } from 'vue'
import { dateTimeFmt, numberFmt } from '@/utils/format'
import { Close, Check } from '@element-plus/icons-vue'
import api from '@/api';
import message from '../utils/message';


const props = defineProps({
  rows: Array
})

const table = reactive({
  data: props.rows
})

watch(() => props.rows, () => {
  table.data = props.rows
})

const totalAmountCNY = computed(() => {
  return table.data.reduce((acc, cur) => acc + parseFloat(cur.cny_total_amount), 0)
})

const emit = defineEmits(['close'])

const onSubmit = async () => {
  const items = table.data.map(item => {
    return {
      payment_id: item.payment_id,
      cny_amount: item.cny_total_amount,
      note: item.note
    }
  })

  try {
    await api.creditCard.review({
      item_list: JSON.stringify(items)
    })
    message.success('提交成功')
  } finally {
    emit('close')
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
    <el-table-column label="金额" width="120" align="right">
      <template #default="scope">
        <span class="amount">{{ numberFmt(scope.row.origin_total_amount) }}</span>
        <span class="currency">{{ scope.row.currency }}</span>
      </template>
    </el-table-column>
    <el-table-column label="人民币金额" width="140" align="right">
      <template #default="scope">
        <el-input v-model="scope.row.cny_total_amount" onkeyup="value=value.replace(/[^\-?\d.]/g,'')" class="input-amount">
          <template #append>元</template>
        </el-input>
      </template>
    </el-table-column>
    <el-table-column label="备注">
      <template #default="scope">
        <el-input v-model="scope.row.note" spellcheck="false" maxlength="50"></el-input>
      </template>
    </el-table-column>
    <el-table-column label="创建时间" width="110">
      <template #default="scope">
        {{ dateTimeFmt(scope.row.create_time, 2) }}
      </template>
    </el-table-column>
  </el-table>
  <div class="total-amount">
    <span class="label">本次核销金额：</span>
    <span class="amount">{{ numberFmt(totalAmountCNY.toFixed(2)) }}</span>
    <span class="currency">CNY</span>
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