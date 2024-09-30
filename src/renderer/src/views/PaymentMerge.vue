<script setup>
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from "pinia"
import { useAccountStore, useScreenShortStore } from '@/stores'
import api from '@/api'
import { amountFormatter } from '@/utils/format'
import { setUpCapture } from '@/utils/tools'
import Message from '@/utils/message'
import { useLocalConfig } from '../stores/config'

const shortStore = useScreenShortStore()
const cfgStore = useLocalConfig()
const { autoClick, autoConfirm } = storeToRefs(cfgStore)

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

watch(() => shortStore.image, (src) => {
  form.attachment_list.push({ url: src })
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
  transaction_number: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }],
  attachment_list: [{
    required: true, triger: 'blur', validator: (...args) => {
      return uploadRef.value.validate(...args)
    }
  }]
})
const uploadRef = ref(null)
const accountStore = useAccountStore()
const accounts = accountStore.accounts.map(item => Object.assign({}, { 'label': item.account_name, 'value': item.id }))

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
      if (autoClick.value) {
        // 是否需要确认
        if (autoConfirm.value) {
          confirmDialogVisible.value = true
        } else {
          onConfirm()
        }
      } else {
        emit('completed')
      }
    } catch (error) {
      console.log(error)
    } finally {
      formReset()
    }
  })
}

const errorMsg = ref('')
const centerDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const onConfirm = async () => {
  try {
    const data = {
      account_id: form.account_id,
      approval_number_item: JSON.stringify(props.approves.map(item => item.approval_number)),
    }
    await api.autoComplete(data, false)
    Message.success("自动点单成功")
    confirmDialogVisible.value = false
    emit('completed')
  } catch (error) {
    confirmDialogVisible.value = false
    centerDialogVisible.value = true
    errorMsg.value = error.msg
    // emit('completed')

  } finally {
    // confirmDialogVisible.value = false
    // emit('completed')
  }
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
      <el-input type="textarea" v-model="form.note" placeholder="" spellcheck="false" maxlength="100"
        show-word-limit></el-input>
    </el-form-item>
    <el-form-item label="附件" prop="attachment_list">
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


  <el-dialog title="自动点单确认" v-model="confirmDialogVisible" width="400" :close-on-click-modal="false" destroy-on-close
    align-center>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog title="自动点单失败" v-model="centerDialogVisible" width="500" align-center destroy-on-close :close-on-click-modal="false" append-to-body>
    <div v-html="errorMsg"></div>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="() => {
              centerDialogVisible = false
              emit('completed')
            }">
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>

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