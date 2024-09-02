<script setup>
import { reactive, ref } from 'vue'

const form = reactive({
  number: '',
  bankAccount: '',
  receiveAccount: '',
  amount: '',
  currency: '',
  fee: '',
  waterNumber: '',
  note: '',
})

const rules = reactive({
  number: [
    { required: true, message: '请输入', trigger: 'blur' },
    { min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur' }
  ],
  bankAccount: [{ required: true, message: '请选择', trigger: 'change' }],
  receiveAccount: [{ required: true, message: '请输入', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择', trigger: 'change' }],
})

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
}
</script>


<template>
  <el-form :model="form" :rules="rules" label-width="auto">
    <el-form-item>
      <el-input v-model="form.number" placeholder="钉钉编号" />
    </el-form-item>
    <el-form-item>
      <el-select v-model="form.bankAccount" placeholder="银行账号">
        <el-option label="Zone one" value="shanghai" />
        <el-option label="Zone two" value="beijing" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.receiveAccount" placeholder="顾客收款账号" />
    </el-form-item>
    <el-form-item>
      <el-col :span="10">
        <el-input v-model="form.amount" placeholder="打款金额" />
      </el-col>
      <el-col :span="6" :offset="1">
        <el-select v-model="form.currency" placeholder="币种">
          <el-option label="USD" value="USD" />
          <el-option label="CNY" value="CNY" />
        </el-select>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-input v-model="form.fee" placeholder="手续费" />
      </el-col>
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.waterNumber" placeholder="交易流水号" />
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.note" type="textarea" placeholder="备注" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onSubmit">提交</el-button>
      <el-button>取消</el-button>
    </el-form-item>
  </el-form>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
}
</style>