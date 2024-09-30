<script setup>
import { reactive, ref, watch, computed } from "vue"
import { numberFmt, subNumbers } from "@/utils/format"
import api from "../api"
import { setUpCapture } from '@/utils/tools'
import message from "../utils/message"
import { useAccountStore } from "@/stores"
import { Check, Close } from '@element-plus/icons-vue'

const bank = useAccountStore()

const props = defineProps({
  item: Object
})
const emit = defineEmits(['onSuccess', 'onFail'])

watch(() => props.item, () => {
  resetForm()
})

const form = reactive({
  show: true,
  mode: 'add',
  validateMinCount: 1,
  post: {
    out_account_id: null,
    in_account_id: null,
    origin_amount: props.item.origin_amount,
    currency: props.item.currency,
    received_amount: null,
    received_currency: null,
    note: props.item.note,
    in_account_title_id: null,
    out_account_title_id: null,
    attachment_list: [],

    voucher_ext_id: null,
    application_reason: null,
    id: null,
  },
})
const uploadRef = ref(null)

const resetForm = () => {
  form.post = {
    out_account_id: null,
    in_account_id: null,
    origin_amount: props.item.origin_amount,
    currency: props.item.currency,
    received_amount: null,
    received_currency: null,
    note: props.item.note,
    in_account_title_id: null,
    out_account_title_id: null,
    attachment_list: [],
  }
  formRef.value?.clearValidate()
}

const handleCancel = () => {
  resetForm()
  form.show = false
}

const formState = reactive({
  in_account_id_loading: false,
  out_account_id_loading: false,
  in_account_id_color: 'transparent',
  out_account_id_color: 'transparent',
  in_account_id_balance: '',
  out_account_id_balance: '',
  in_account_id_currency: '',
  out_account_id_currency: '',
  available_balance: computed(() => {
    return numberFmt(subNumbers(formState.out_account_id_balance, form.post.origin_amount))
  }),
  available_color: computed(() => {
    if (form.post.origin_amount) {
      return "black"
    } return "transparent"
  }),
  getDisabledState: name => {
    const disabled = Object.keys(form.post)
    if (form.mode === "view") {
      return true
    }
    else if (form.mode == 'add') {
      if (["in_account_title_id", "out_account_title_id"].includes(name)) {
        return true
      } return false
    }
    else if (form.mode == 'edit') {
      if (["in_account_title_id", "out_account_title_id"].includes(name)) {
        return true
      } return false
    }
    return false
  },
  formTitle: computed(() => {
    if (form.mode == "add") {
      return "银行转账-添加"
    }
    else if (form.mode == "edit") {
      return "银行转账-编辑"
    }
    else if (form.mode == "view") {
      return "银行转账-查看"
    }
  })
})

watch(() => form.post.in_account_id, async () => {
  if (form.post.in_account_id) {
    formState.in_account_id_loading = true
    const resp = await api.getAccountDetail({ account_id: form.post.in_account_id })
    formState.in_account_id_color = 'black'
    formState.in_account_id_loading = false
    formState.in_account_id_balance = numberFmt(resp.available_balance)
    formState.in_account_id_currency = resp.currency
    form.post.received_currency = resp.currency
  } else {
    formState.in_account_id_color = 'transparent'
    formState.in_account_id_balance = ''
    formState.in_account_id_currency = ''
  }
})

watch(() => form.post.out_account_id, async () => {
  if (form.post.out_account_id) {
    formState.out_account_id_loading = true
    const resp = await api.getAccountDetail({ account_id: form.post.out_account_id })
    formState.out_account_id_color = 'black'
    formState.out_account_id_loading = false
    formState.out_account_id_balance = numberFmt(resp.available_balance)
    formState.out_account_id_currency = resp.currency
    form.post.currency = resp.currency
  } else {
    formState.out_account_id_color = 'transparent'
    formState.out_account_id_balance = ''
    formState.out_account_id_currency = ''
  }
})
const formRules = reactive({
  origin_amount: [
    {
      required: true, validator: (rule, value, callback) => {
        const a = (formState.available_balance || "0").replaceAll(",", "")
        if (parseFloat(a) < 0) {
          callback("可用余额不能为负数!")
        } else {
          callback()
        }
      }, trigger: 'blur'
    },
  ],
  attachment_list: [
    {
      required: true,
      validator: (rule, value, call_back) => {
        return uploadRef.value.validate(rule, value, call_back)
      }, trigger: 'change'
    }
  ],
  application_reason: [
    { required: true, trigger: "change", message: "请填写修改原因!" }
  ]
})

const crop = setUpCapture(src => {
  form.post.attachment_list.push({ url: src })
})

const onSubmit = async () => {
  if (form.mode == 'add') {
    form.validateMinCount = 1
    formRef.value.validate().then(async valid => {
      if (valid) {
        try {
          const uploads = await uploadRef.value.uploadImage()
          const post = { ...form.post }
          delete post.voucher_ext_id
          delete post.application_reason
          delete post.id
          post.attachment_list = JSON.stringify(uploads)
          await api.transfer.addTransfer(post)
          // form.show = false
          emit('onSuccess')
          message.success('银行转账已添加!')
        } catch (err) {
          emit('onFail', err)
          logger.error("银行转账添加失败", err)
        }
      }
    })
  }
}

</script>

<template>
  <el-form :model="form.post" label-width="auto" style="width:100%" ref="formRef" :rules="formRules">

    <el-form-item label="转出账户" prop="out_account_id" required :show-message="false">
      <div style=" display: flex;flex-direction: column;width: 100%;" v-loading="formState.out_account_id_loading">
        <el-select v-model="form.post.out_account_id" filterable @change="handleBankChange"
          :disabled="formState.getDisabledState('out_account_id')">
          <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name" :value="item.id" />
        </el-select>

        <div style="display: flex;justify-content: flex-start;align-items: center">
          <p><span :class="formState.out_account_id_color">实时余额 </span>
            <span style="color:black">{{ formState.out_account_id_balance }}</span>
            <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
          </p>
        </div>
      </div>
    </el-form-item>

    <el-form-item label="转账支出科目" prop="out_account_title_id" required :show-message="false">
      <el-select v-model="form.post.out_account_title_id" filterable
        :disabled="formState.getDisabledState('out_account_title_id')">
        <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item label="转出金额" prop="origin_amount" required>
      <div style=" display: flex;flex-direction: column;width: 100%;">
        <div style=" display: flex;justify-content: center; width: 100%;">
          <el-input-number v-model="form.post.origin_amount" style="width:70%"
            :max="formState.out_account_id_balance?.replaceAll(',', '')"
            :disabled="formState.getDisabledState('origin_amount')" :precision="2" :controls="false">
            <template #suffix>
              <p>{{ form.currency }}</p>
            </template>
          </el-input-number>
          <el-select :validate-event="false" style="width: 30%; padding-left: 5px" v-model="form.post.currency">
            <el-option v-for="item in bank.currencies" :key="item.code" :label="item.code" :value="item.code" />
          </el-select>
        </div>
        <p>
          <span :class="formState.available_color">可用余额</span>
          <span :class="formState.available_color">{{ " " + formState.available_balance }}</span>
          <span :class="formState.available_color == 'transparent' ? 'transparent' : 'red'">{{ " " +
formState.out_account_id_currency }}</span>
        </p>
      </div>

    </el-form-item>

    <el-form-item label="转入账户" prop="in_account_id" required :show-message="false">
      <div style=" display: flex;flex-direction: column;width: 100%;" v-loading="formState.in_account_id_loading">
        <el-select v-model="form.post.in_account_id" filterable
          :disabled="formState.getDisabledState('in_account_id')">
          <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name" :value="item.id" />
        </el-select>

        <div style="display: flex;justify-content: flex-start;align-items: center">
          <p><span :class="formState.in_account_id_color">实时余额 </span>
            <span style="color:black">{{ formState.in_account_id_balance }}</span>
            <span style="color:red">{{ " " + formState.in_account_id_currency }}</span>
          </p>
        </div>
      </div>
    </el-form-item>

    <el-form-item label="到账收入科目" prop="in_account_title_id" required :show-message="false">
      <el-select v-model="form.post.in_account_title_id" filterable
        :disabled="formState.getDisabledState('in_account_title_id')">
        <el-option v-for="item in bank.incomes" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item label="到账金额" prop="received_amount" required :show-message="false">
      <div style=" display: flex; justify-content: center;width: 100%;">
        <el-input-number v-model="form.post.received_amount"
          :disabled="formState.getDisabledState('received_amount')" :precision="2" :controls="false"
          style="width: 70%">
          <template #suffix>
            <p>{{ form.currency }}</p>
          </template>
        </el-input-number>
        <el-select :validate-event="false" style="width: 30%; padding-left: 5px"
          v-model="form.post.received_currency">
          <el-option v-for="item in bank.currencies" :key="item.code" :label="item.code" :value="item.code" />
        </el-select>
      </div>

    </el-form-item>

    <el-form-item label="备注" prop="note">
      <el-input v-model="form.post.note" type="textarea" :rows="3" show-word-limit
        :disabled="formState.getDisabledState('note')"></el-input>
    </el-form-item>

    <el-form-item label="图片上传" prop="attachment_list">
      <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10" dir="transfer"
        :validate-min-count="form.validateMinCount" :disabled="formState.getDisabledState('attachment_list')">
      </Upload>
    </el-form-item>

    <el-form-item label=" ">
      <el-button v-if="!formState.getDisabledState('crop')" link type="danger" @click="crop">
        <el-icon>
          <PictureFilled />
        </el-icon>截图
      </el-button>
    </el-form-item>

    <el-form-item label=" ">
      <el-button :icon="Close" @click="handleCancel">取消</el-button>
      <el-button v-show="!formState.getDisabledState('button')" type="primary" :icon="Check" @click="onSubmit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.black {
  color: black
}
</style>