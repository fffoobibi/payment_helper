<script setup>
import { onBeforeMount, reactive, ref, watch } from 'vue'
import { useUserStore, useAccountStore, useAirwallexStore } from '@/stores'
import { useLocalConfig } from "@/stores/config"
import { storeToRefs } from "pinia"
import api from '@/api'
import { Check, Close } from '@element-plus/icons-vue'
import { accountFormatter, accountParser, amountFormatter, amountParser } from '@/utils/format'
import { setUpCapture } from '@/utils/tools'
import Message from '@/utils/message'
import Airwallex from './Airwallex.vue'

const props = defineProps({
  approve: Object
})
const emit = defineEmits(['close'])

const cfgStore = useLocalConfig()
const { autoClick, autoConfirm} = storeToRefs(cfgStore)

watch(() => props.approve, () => {
  form.approval_number = props.approve?.approval_number || ''
  form.origin_total_amount = props.approve?.origin_total_amount || ''
  form.currency = props.approve?.currency || ''
  form.transaction_number = props.approve?.purchase_number || ''
  form.receiving_account = props.approve?.bank_account || ''
})

const form = reactive({
  approval_number: props.approve?.approval_number || '',
  account_id: '',
  pay_type: 1,
  receiving_account: props.approve?.bank_account || '',
  origin_total_amount: props.approve?.origin_total_amount,
  currency: props.approve?.currency || '',
  commission: '',
  transaction_number: props.approve?.purchase_number || '',
  note: props.approve?.note || '',
  transaction_number_airwallex: '',
  airwallex_status: '',
  attachment_list: [],
  is_binding: false
})
const formReset = () => {
  form.approval_number = props.approve?.approval_number || ''
  form.account_id = ''
  form.pay_type = 1
  form.receiving_account = props.approve?.bank_account || ''
  form.origin_total_amount = props.approve?.origin_total_amount || ''
  form.currency = props.approve?.currency || ''
  form.commission = ''
  form.transaction_number = props.approve?.purchase_number || ''
  form.note = props.approve?.note || ''
  form.transaction_number_airwallex = ''
  form.airwallex_status = ''
  form.attachment_list = []
  form.is_binding = false
}

const airwallexVisible = ref(false)
const uploadRef = ref(null)
const formRef = ref(null)
const rules = reactive({
  approval_number: [{ required: true, message: '请输入钉钉编号', trigger: 'blur' }],
  account_id: [{ required: true, message: '请选择打款账号', trigger: 'blur' }],
  receiving_account: [{ required: true, message: '请输入收款账号', trigger: 'blur' }],
  origin_total_amount: [{ required: true, message: '请输入打款金额', trigger: 'blur' }],
  currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
  transaction_number: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }],
})

const confirmDialogVisible = ref(false)

const store = useUserStore()

const accountStore = useAccountStore()
const currencies = accountStore.currencies
const accounts = accountStore.accounts.map(item => Object.assign({}, {'label': item.account_name, 'value': item.id}))

const airwallexStore = useAirwallexStore()
const airwallexConfig = airwallexStore.getConfig()
const airwallexTypes = [{label: 'airwallex', value: 1}, {label: 'paypal', value: 2}]

const getAirwallexConfig = async () => {
  if (!airwallexConfig?.airwallex_binding || airwallexConfig.airwallex_binding.length == 0) {
    const data = await api.getAirwallexConfig({})
    airwallexStore.setConfig(data)
    airwallexConfig.airwallex_binding = data.airwallex_binding
  }
}

setUpCapture(src => {
  form.attachment_list.push({ url: src })
})

const onSubmit = async el => {
  if (!el) return
  await el.validate(async (valid, _) => {
    if (!valid) return false
    const data = {
      approval_number: form.approval_number,
      origin_total_amount: form.origin_total_amount,
      currency: form.currency,
      commission: form.commission,
      attachment_list: [],
      account_items: [
        {
          account_id: form.account_id,
          receiving_account: form.receiving_account,
          transaction_number: form.transaction_number,
          note: form.note
        }
      ],
    }
    data.attachment_list = JSON.stringify((await uploadRef.value.uploadImage()) ?? [])
    if (form.transaction_number_airwallex) {
      data.account_items[0].transaction_number_airwallex = form.transaction_number_airwallex
      data.account_items[0].airwallex_status = form.airwallex_status
    }
    data.account_items = JSON.stringify(data.account_items)
    try {
      await api.addPaymentRecord(data)
      Message.success("打款提交成功")

      if (form.transaction_number_airwallex) {
        if (form.is_binding) {  // 更新本地airwallex记录
          electron.sql.update('dingtalk_submit_log', {
            bind_approval_number: form.approval_number,
            bind_type: '2',
            update_time: Math.round(new Date().getTime() / 1000),
          }, {
            transaction_number_airwallex: form.transaction_number_airwallex
          })
        } else {  // 插入airwallex新记录
          electron.sql.insert('dingtalk_submit_log', {
            bind_approval_number: form.approval_number,
            bind_type: '1',
            creator: store.user.username,
            create_time: Math.round(new Date().getTime() / 1000),
            update_time: Math.round(new Date().getTime() / 1000),
            transaction_number_airwallex: form.transaction_number_airwallex,
          })
        }
      }

      formReset()
      // 是否自动点单
      if (autoClick.value) {
        // 是否需要确认
        if (autoConfirm.value) {
          confirmDialogVisible.value = true
        } else {
          onConfirm()
        }
      } else {
        emit('close')
      }
    } catch (error) {
    }
  })
}

const onConfirm = async () => {
  try {
    await api.autoComplete({
      account_id: form.account_id,
      approval_number_item: JSON.stringify([form.approval_number]),
    })
    Message.success("自动点单成功")
  } catch (error) {

  } finally {
    confirmDialogVisible.value = false
    emit('close')
  }
}

const onRelateAirwallex = () => {
  // 打开新窗口
  // electron.newWindow('airwallex', { id: form.account_id })
  // 改为弹层形式
  airwallexVisible.value = true
}

const onSelectAirwallex = (row, isBinding) => {
  airwallexVisible.value = false
  form.transaction_number_airwallex = row.transaction_number_airwallex
  form.airwallex_status = row.airwallex_status
  form.is_binding = isBinding
}

onBeforeMount(() => {
  getAirwallexConfig()
})
</script>


<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" @submit.prevent>
    <el-form-item label="钉钉编号" prop="approval_number" required>
      <el-input v-model="form.approval_number" />
    </el-form-item>
    <el-form-item label="付款账号" prop="account_id" required>
      <el-select v-model="form.account_id" filterable>
        <el-option v-for="item in accounts" :label="item.label" :value="item.value"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="支付方式" v-if="airwallexConfig.airwallex_binding.includes(form.account_id)" required>
      <el-col :span="17">
        <el-select v-model="form.pay_type">
          <el-option v-for="item in airwallexTypes" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-col>
      <el-col :span="6" :offset="1" v-show="form.pay_type == 2">
        <el-form-item>
          <el-button type="primary" @click="onRelateAirwallex">关联Airwallex</el-button>
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label=" " v-if="form.transaction_number_airwallex" size="small">
      <el-text type="primary">已关联：{{ form.transaction_number_airwallex }}</el-text>
    </el-form-item>
    <el-form-item label="顾客收款账号" prop="receiving_account" required>
      <el-input v-model="form.receiving_account" :formatter="accountFormatter" :parser="accountParser" clearable />
    </el-form-item>
    <el-form-item label="打款金额" required>
      <el-col :span="10">
        <el-form-item prop="origin_total_amount">
          <el-input v-model="form.origin_total_amount" placeholder="打款金额" :formatter="amountFormatter" :parser="amountParser" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-form-item prop="currency">
          <el-select v-model="form.currency" placeholder="币种" filterable>
            <el-option label="全部" value="" />
            <el-option v-for="item in currencies" :value="item.code" />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="6" :offset="1">
        <el-form-item>
          <el-input v-model="form.commission" placeholder="手续费" :formatter="amountFormatter" :parser="amountParser" clearable />
        </el-form-item>
      </el-col>
    </el-form-item>
    <el-form-item label="交易流水号" prop="transaction_number" required>
      <el-input v-model="form.transaction_number" spellcheck="false" />
    </el-form-item>
    <el-form-item label="备注">
      <el-input v-model="form.note" type="textarea" spellcheck="false" maxlength="100" show-word-limit />
    </el-form-item>
    <el-form-item label="附件">
      <Upload action="upload" ref="uploadRef" v-model="form.attachment_list" :limit="10" dir="payment" :size="66">
      </Upload>
    </el-form-item>
    <el-form-item label=" " size="small">
      <el-text type="primary">提示：Ctrl + Q 快速截图</el-text>
    </el-form-item>
    <el-form-item label=" ">
      <el-button type="primary" :icon="Check" @click="onSubmit(formRef)">提交</el-button>
      <el-button :icon="Close" @click="emit('close')">取消</el-button>
    </el-form-item>
  </el-form>

  <el-dialog title="关联Airwallex" v-model="airwallexVisible" width="88%" :close-on-click-modal="false" destroy-on-close>
    <Airwallex :account-id="form.account_id" :accounts="accounts" @submit="onSelectAirwallex" @cancel="airwallexVisible = false" />
  </el-dialog>

  <el-dialog title="自动点单确认" v-model="confirmDialogVisible" width="400" :close-on-click-modal="false" destroy-on-close align-center>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>

</template>


<style scoped>
.el-form-item {
  margin-bottom: 20px;
}
.el-col .el-form-item {
  margin-bottom: 0;
}
</style>