<script setup>
import { reactive, ref, watch } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores'
import Message from '@/utils/message'
import api from '@/api'
import { amountFormatter, amountParser } from '@/utils/format'

const props = defineProps({
  ext: Object
})
const emit = defineEmits(['close'])

watch(() => props.ext, () => {
  formReset()
})

const accountStore = useAccountStore()
const currencies = accountStore.currencies
const accountItems = accountStore.accounts.map(item => Object.assign({}, {'label': item.account_name, 'value': item.id}))

const form = reactive({
  voucher_ext_id: props.ext.voucher_ext_id,
  account_id: props.ext.account_id,
  receiving_account: props.ext.receiving_account,
  transaction_number: props.ext.transaction_number,
  origin_amount: props.ext.origin_amount,
  currency: props.ext.currency,
  note: props.ext.note,
  attachment_list: JSON.parse(JSON.stringify(props.ext.attachment_list).replace(/path/g, 'url')),
  application_reason: ''
})

const uploadRef = ref(null)
const formRef = ref(null)
const rules = reactive({
  account_id: [
    { required: true, message: '请选择打款账号', trigger: 'blur' }
  ],
  receiving_account: [
    { required: true, message: '请输入收款账号', trigger: 'blur' }
  ],
  transaction_number: [
    { required: true, message: '请输入交易流水', trigger: 'blur' }
  ],
  origin_amount: [
    { required: true, message: '请输入支出金额', trigger: 'blur' }
  ],
  currency: [
    { required: true, message: '请选择币种', trigger: 'change' }
  ],
  application_reason: [
    {required: true, message: '请输入修改原因', trigger: 'change'}
  ]
})

const formReset = () => {
  form.voucher_ext_id = props.ext.voucher_ext_id
  form.account_id = props.ext.account_id
  form.receiving_account = props.ext.receiving_account
  form.transaction_number = props.ext.transaction_number
  form.origin_amount = props.ext.origin_amount
  form.currency = props.ext.currency
  form.note = props.ext.note
  form.attachment_list = JSON.parse(JSON.stringify(props.ext.attachment_list).replace(/path/g, 'url'))
  form.application_reason = ''
}

const onSubmit = async (el) => {
  if (!el) return
  await el.validate(async (valid, _) => {
    if (!valid) return false

    // form.attachment_list = JSON.stringify((await uploadRef.value.uploadImage()) ?? [])
    try {
      // await Promise.all([
      //   api.updatePaymentRecordExt(form),
      //   // api.updatePaymentAttachments({
      //   //   attachment_list: form.attachment_list,
      //   //   voucher_ext_id: form.voucher_ext_id
      //   // })
      // ])
      
      const data = {...form}
      delete data.attachment_list
      await api.updatePaymentRecordExt(data)
      Message.success("申请修改已提交")
      el.resetFields()
      emit('close')
    } catch (error) {

    }
  })
}
</script>


<template>
  <!-- 信息编辑 -->
  <el-form class="form" ref="formRef" :rules="rules" :model="form" label-width="80px" style="max-width: 480px" @submit.prevent>
    <el-form-item label="付款账号" prop="account_id" required>
      <el-select v-model="form.account_id" filterable>
        <el-option v-for="item in accountItems" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="收款账号" prop="receiving_account" required>
      <el-input v-model="form.receiving_account"  clearable />
    </el-form-item>
    <el-form-item label="交易流水" prop="transaction_number" required>
      <el-input v-model="form.transaction_number" clearable />
    </el-form-item>
    <el-form-item label="打款金额" required>
      <el-col :span="14">
        <el-form-item prop="origin_amount">
          <el-input v-model="form.origin_amount" placeholder="请输入金额" :formatter="amountFormatter" :parser="amountParser" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="9" :offset="1">
        <el-form-item prop="currency">
          <el-select v-model="form.currency" placeholder="币种" filterable>
            <el-option label="全部" value="" />
            <el-option v-for="item in currencies" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="form.note" type="textarea" spellcheck="false" />
    </el-form-item>
    <el-form-item label="修改原因" prop="application_reason">
      <el-input v-model="form.application_reason" type="textarea" spellcheck="false" />
    </el-form-item>
    <el-form-item label="附件" class="mb" >
      <Upload action="upload" ref="uploadRef" disabled v-model="form.attachment_list" :limit="10" dir="payment" :size="66">
      </Upload>
    </el-form-item>
    <el-form-item class="mb">
      <el-button type="primary" :icon="Check" @click="onSubmit(formRef)">提交</el-button>
      <el-button :icon="Close" @click="emit('close')">取消</el-button>
    </el-form-item>
  </el-form>
</template>


<style scoped>
.item-label,
:deep(.el-form-item__label) {
  color: #99a;
  font-size: 12px;
}
.item-value {
  color: #353549;
  font-size: 13px;
}

.el-form-item:not(.mb) {
  margin-bottom: 20px;
}
.el-col .el-form-item {
  margin-bottom: 0;
}
</style>