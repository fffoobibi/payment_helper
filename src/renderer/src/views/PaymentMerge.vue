<script setup>
import { reactive, ref } from 'vue'
import { useAccountStore } from '@/stores'
import api from '@/api'
import { amountFormatter } from '@/utils/format'
import { setUpCapture } from '@/utils/tools'
import Message from '@/utils/message'

const props = defineProps({
  approves: Array,
  total_amount: String,
  currency: String
})
const emit = defineEmits(['completed'])

const state = reactive({
  ending_balance: '',   // 实时余额
  balance_currency: '', // 余额币种
  total_amount: props.total_amount,     // 打款总金额
  currency: props.currency,         // 总金额币种
})

const form = reactive({
  account_id: '',
  attachment_list: [],
  note: '',
  transaction_number: '',
})
const formReset = () => {
  form.account_id = ''
  form.attachment_list = []
  form.note = ''
  form.transaction_number = ''
  state.ending_balance = ''
  state.balance_currency = ''
  state.total_amount = ''
  state.currency = ''
}
const formRef = ref(null)
const rules = reactive({
  account_id: [{ required: true, message: '请选择打款账号', trigger: 'blur' }],
  transaction_number: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }]
})
const uploadRef = ref(null)
const accountStore = useAccountStore()
const accounts = accountStore.accounts.map(item => Object.assign({}, {'label': item.account_name, 'value': item.id}))

const onSelect = async value => {
  // 实时查询该账户的余额
  const res = await api.getAccountDetail({ account_id: value })
  state.ending_balance = res.ending_balance
  state.balance_currency = res.currency
}

setUpCapture(src => {
  form.attachment_list.push({ url: src })
})

const onSubmit = async el => {
  if (!el) return
  await el.validate(async (valid, _) => {
    if (!valid) return false
    const data = {
      account_id: form.account_id,
      note: form.note,
      transaction_number: form.transaction_number,
      approval_number_list: JSON.stringify(props.approves.map(item => item.approval_number)),
    }
    data.attachment_list = JSON.stringify((await uploadRef.value.uploadImage()) ?? [])

    try {
      await api.mergePayment(data)
      Message.success("打款提交成功")
      emit('completed')
    } catch (error) {
      console.log(error)
    } finally {
      formReset()
    }
  })
}
</script>


<template>
  <el-form :model="form" ref="formRef" :rules="rules" label-width="100" style="max-width: 550px" @submit.prevent>
    <el-form-item label="付款账号" prop="account_id" required>
      <el-select v-model="form.account_id" filterable @change="onSelect">
        <el-option v-for="item in accounts" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="实时余额">
      <el-text type="warning">{{ amountFormatter(state.ending_balance) }} {{ state.balance_currency }}</el-text>
    </el-form-item>
    <el-form-item label="打款总金额">
      <el-text type="danger">{{ amountFormatter(state.total_amount) }} {{ state.currency }}</el-text>
    </el-form-item>
    <el-form-item label="交易流水号" prop="transaction_number" required>
      <el-input v-model="form.transaction_number" clearable></el-input>
    </el-form-item>
    <el-form-item label="备注" size="normal">
      <el-input type="textarea" v-model="form.note" placeholder="" spellcheck="false" maxlength="100" show-word-limit ></el-input>
    </el-form-item>
    <el-form-item label="附件">
      <Upload action="upload" ref="uploadRef" v-model="form.attachment_list" :limit="10" dir="payment" :size="66">
      </Upload>
    </el-form-item>
    <el-form-item label=" ">
      <div class="form-tips">提示：CTRL + Q 快速截图</div>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="onSubmit(formRef)">提交</el-button>
    </el-form-item>
  </el-form>

</template>


<style scoped>
.balance {
  text-align: right;
  color: #ff8872;
}
.form-tips {
  color: #409eff;
}
</style>