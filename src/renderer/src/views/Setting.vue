<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from "pinia"
import { useUserStore } from "@/stores"
import { useLocalConfig, getConfig, Keys } from "@/stores/config"
import { debounce } from "lodash"


import api from "@/api"
import message from '../utils/message'
const cfgStore = useLocalConfig()
const { autoClick, autoConfirm, formalUrl, testUrl } = storeToRefs(cfgStore)
const store = useUserStore()

const showHidden = ref(false)
const handleCtrlShiftQ = event => {
  if (event.ctrlKey && event.shiftKey && event.code === 'KeyQ') {
    showHidden.value = true
  }
}
onMounted(() => {
  console.log('auto click ==>', autoClick.value)
  console.log('auto confirm ===>', autoConfirm.value);
  console.log('formalUrl ', formalUrl.value)
  window.addEventListener('keydown', handleCtrlShiftQ)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleCtrlShiftQ)
})
const changeForm = reactive({
  username: store.user.username,
  orig_pws: null,
  new_pws: null,
  confirm: null
})
const updateFormalUrl = debounce(() => {
  cfgStore.updateFormalUrl()
}, 500)
const updateTestUrl = debounce(() => {
  cfgStore.updateTestUrl()
}, 500)


const formRef = ref(null)
const changePwd = async () => {
  formRef.value.validate().then(async valid => {
    if (valid) {
      try {
        const data = { ...changeForm }
        delete data.confirm
        const resp = await api.changePwd(data)
        message.success("密码已修改!")
        formRef.value.resetFields()
      } catch (error) {

      }
    }


  })
}
const validatePass = (rule, value, callback) => {
  if (!value) {
    callback(new Error('不能为空'))
  } else if ((value && value.length < 6) || (value && value.length > 12)) {
    callback(new Error("密码长度6-12位!"))
  } else {
    callback()
  }
}

const validatePassConfirm = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('不能为空!'))
  } else if (value !== changeForm.new_pws) {
    callback(new Error("两次输入不一致!"))
  } else {
    callback()
  }
}
</script>


<template>
  <Layout>
    <template #layout-main-inner>
      <Header>
        <template #title>
          <h4>设置</h4>
        </template>

        <template #option>
          <el-button size="small" class="option-btn" link>
            <i class="iconfont icon-setting"></i>
          </el-button>
        </template>
      </Header>
      <el-scrollbar>
        <div class="pannel">
          <span class="black" style="font-size: 11pt;border-bottom: 2px solid purple;">密码重置</span>
          <el-form label-width="auto" ref="formRef" :model="changeForm">
            <el-form-item label="原始密码" prop="orig_pws"
              :rules="[{ required: true, message: '请输入原始密码', trigger: 'blur' }]">
              <el-input style="width: 200px;" type="password" autocomplete="off"
                v-model="changeForm.orig_pws"></el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="new_pws"
              :rules="[{ validator: validatePass, trigger: 'blur', required: true, }]">
              <el-input style="width: 200px;" type="password" autocomplete="off"
                v-model="changeForm.new_pws"></el-input>
            </el-form-item>
            <el-form-item label="请确认" prop="confirm"
              :rules="[{ validator: validatePassConfirm, trigger: 'blur', required: true, }]">
              <el-input style="width: 200px; margin-right: 10px;" type="password" autocomplete="off"
                v-model="changeForm.confirm"></el-input>
              <el-button type="primary" @click="changePwd">提交</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="pannel">
          <span class="black" style="font-size: 11pt;border-bottom: 2px solid purple;">点单设置</span>
          <el-form label-width="auto">
            <el-form-item label="自动点单">
              <el-checkbox label="自动点单确认" v-model="autoConfirm" @change="v => {
            cfgStore.updateAutoConfirm()
          }" />
              <el-checkbox label="关闭自动点单" v-model="autoClick" @change="v => {
            cfgStore.updateAutoClick()
          }" />
            </el-form-item>
          </el-form>
        </div>
        <div class="pannel">
          <span class="black" style="font-size: 11pt;border-bottom: 2px solid purple;">截图设置</span>
          <el-form label-width="auto">
            <el-form-item label="">
              <el-checkbox label="隐藏窗口截图" value="Value A" />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="showHidden" class="pannel">
          <span class="black"
            style="font-size: 11pt;border-bottom: 2px solid purple; margin-bottom: 10px!important;">开发设置</span>
          <el-form label-width="auto">
            <el-form-item label="正式/测试服">
              <el-input style="width: 350px; margin-right: 10px;" placeholder="正式服" v-model="formalUrl"
                @input="v => updateFormalUrl()" clearable></el-input>
              <el-input style="width: 350px;" placeholder="测试服" v-model="testUrl" clearable @input="v => updateTestUrl()">
              </el-input>

            </el-form-item>

          </el-form>
        </div>


      </el-scrollbar>


    </template>
  </Layout>
</template>


<style scoped>
h4 {
  padding: 0 10px;
  color: #333;
}

.black {
  color: black;
}

.pannel {
  margin: 10px;
  padding: 10px;
  background-color: white;
}
</style>