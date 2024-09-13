<script setup>
import { reactive, ref, watch } from 'vue'
import { useAccountStore } from '@/stores'
import api from '@/api'
import { Check, Close } from '@element-plus/icons-vue'

const props = defineProps({
  approve: Object
})
const emit = defineEmits(['close'])

watch(() => props.approve, () => {
  form.approval_number = props.approve.approval_number
  form.origin_total_amount = props.approve.origin_total_amount
  form.currency = props.approve.currency
})

const form = reactive({
  approval_number: props.approve.approval_number,
  account_id: '',
  receiving_account: '',
  origin_total_amount: props.approve.origin_total_amount,
  currency: props.approve.currency,
  fee: '',
  transaction_number: props.approve.purchase_number,
  note: props.approve.note,
  attachment_list: []
})

const uploadRef = ref(null)
const formRef = ref(null)
const rules = reactive({
  approval_number: [{ required: true, message: '请输入钉钉编号', trigger: 'blur' }],
  account_id: [{ required: true, message: '请选择打款账号', trigger: 'change' }],
  receiving_account: [{ required: true, message: '请输入收款账号', trigger: 'blur' }],
  origin_total_amount: [{ required: true, message: '请输入打款金额', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
  transaction_number: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }],
})

const accountStore = useAccountStore()
const accountItems = accountStore.accounts.map(item => Object.assign({}, {'label': item.account_name, 'value': item.id}))

const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const disabled = ref(false)

const handleRemove = (file) => {
  console.log(file)
}

const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}

const handleDownload = (file) => {
  console.log(file)
}

const onSubmit = () => {
  console.log('submit!')
  // form.attachment_list = await uploadRef.value.uploadImage()
  // api.addPaymentRecord(form)
}
</script>


<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
    <el-form-item label="钉钉编号" prop="approval_number" required>
      <el-input v-model="form.approval_number" />
    </el-form-item>
    <el-form-item label="打款账号" prop="account_id" required>
      <el-select v-model="form.account_id">
        <el-option v-for="item in accountItems" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="顾客收款账号" prop="receiving_account" required>
      <el-input v-model="form.receiving_account" />
    </el-form-item>
    <el-form-item label="打款金额" required>
      <el-col :span="10">
        <el-form-item prop="origin_total_amount">
          <el-input v-model="form.origin_total_amount" placeholder="打款金额" />
        </el-form-item>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-form-item prop="currency">
          <el-select v-model="form.currency" placeholder="币种">
            <el-option label="USD" value="USD" />
            <el-option label="CNY" value="CNY" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-form-item>
          <el-input v-model="form.fee" placeholder="手续费" />
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label="交易流水号" prop="transaction_number" required>
      <el-input v-model="form.transaction_number" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="form.note" type="textarea" />
    </el-form-item>
    <el-form-item label="附件">
      <Upload action="upload" ref="uploadRef" v-model="form.attachment_list" :limit="10" dir="payment" :size="66">
      </Upload>
    </el-form-item>
    <el-form-item label=" ">
      <el-button type="primary" :icon="Check" @click="onSubmit">提交</el-button>
      <el-button :icon="Close" @click="emit('close')">取消</el-button>
    </el-form-item>
  </el-form>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
}
</style>