<script setup>
import { computed, reactive, watch, ref, toRaw } from 'vue'
import { addNumbers, dateTimeFmt, numberFmt } from '@/utils/format'
import { Close, Check } from '@element-plus/icons-vue'
import api from '@/api'
import message from '../utils/message'

const props = defineProps({
  rows: Array,
  mode: Number  // 0 核销 1 复核
})

const table = reactive({
  data: [...props.rows.map(v=>({...toRaw(v)}))]
})

const disabled = computed(() => {
  if (props.mode === 0) {
    return false
  }
  return true
})

watch(() => props.rows, () => {
  table.data =[...props.rows.map(v=>({...toRaw(v)}))]
})

const totalAmountCNY = computed(() => {
  const rs = {}
  const s = new Set()
  table.data.forEach(v => {
    if (!s.has(v.currency)) {
      s.add(v.currency)
      rs[v.currency] = [v.__amount]
    } else {
      rs[v.currency].push(v.__amount)
    }
  })
  const ret = []
  Object.keys(rs).forEach(key => {
    ret.push({ value: numberFmt(rs[key].reduce((acc, cur) => addNumbers(acc, cur), 0)), currency: key })
  })
  return ret
})

const emit = defineEmits(['close'])

const onSubmit = async () => {

  // 核销
  if (props.mode === 0) {
    if(!updatetime.value){
      message.warning("请选择核销账期！")
      return
    }
    const items = table.data.map(item => {
      return {
        payment_id: item.payment_id,
        amount: item.__amount,
        currency: item.currency,
        note: item.note,
        type: item.type,
        update_time: updatetime.value.getTime() / 1000
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

const updatetime = ref(new Date())

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
    <el-table-column label="金额" width="140">
      <template #default="scope">
        <el-input v-model="scope.row.__amount" onkeyup="value=value.replace(/[^\-?\d.]/g,'')"
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
      <span class="amount t-red">{{ numberFmt(item.value) }}</span>
      <span class="currency">{{ item.currency }}</span>
    </div>
  </div>
  <div class="flex flex-between w-full">
    <el-form-item label="核销账期">
      <el-date-picker v-model="updatetime" type="month" placeholder="核销账期" :disabled="mode==1" />
    </el-form-item>
    <div>
      <el-button type="primary" :icon="Check" @click="onSubmit">提交</el-button>
      <el-button :icon="Close" @click="emit('close')">取消</el-button>
    </div>
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