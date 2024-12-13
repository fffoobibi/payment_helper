<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from "pinia"
import Toolbar from '@/components/Toolbar.vue'
import api from "@/api"
import { useUserStore, useAccountStore, useUpdateStore, useAirwallexStore, useOperateRecords } from '@/stores'
import { Keys, useLocalConfig } from "@/stores/config"

import app_info from '../../../../package.json'
import { CircleCloseFilled } from '@element-plus/icons-vue'
import updater from '../utils/update'


const router = useRouter()
const userStore = useUserStore()
const accountStore = useAccountStore()
const configStore = useLocalConfig()
const updateStore = useUpdateStore()
const airwallexStore = useAirwallexStore()
const recordStore = useOperateRecords()
const errorText = ref('')

const { currentUserName: username, currentUserPasswd: password, currentUserRemeber: remember } = storeToRefs(configStore)

const version = computed(() => {
  if (updateStore.version) {
    return "v" + updateStore.version.version
  }
})

const checkMsg = computed(() => {
  if (updateStore.update_err) {
    return "版本检查失败"
  }
  if (updateStore.update_available) {
    return "新版本: " + version.value
  } else {
    return app_info.version
  }
})

const buttonLabel = computed(() => {
  console.log('aaa ', updateStore.canUpdate, updateStore.checking)
  if (updateStore.checking) {
    return "更新检查中"
  }
  if (updateStore.canUpdate) {
    return "下载新版本"
  }
  return "登录"
})

const formData = reactive({
  username,
  password,
  remember
})
const pwdRef = ref(null)
const formRef = ref(null)
const formRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

onMounted(async ()=>{
  try{
    updateStore.checking=true
  const r = await updater.checkUpdates(true)
  }finally{
    updateStore.checking = false
  }
})

const onSubmit = async () => {
  if (updateStore.checking) {
    return
  }
  if (updateStore.canUpdate) {
    updater.open(updateStore.version)
  } else {
    formRef.value.validate(async valid => {
      if (!valid) {
        return false
      }
      try {
        const res = await api.login(formData)
        userStore.setUser(res)
        localStorage.setItem('token', res.token)
        electron.login({ username: formData.username, password: formData.password, remember: formData.remember })
        router.push({ name: 'home' })

        if (formData.remember) {
          configStore.setConfig(Keys.username, username.value)
          configStore.setConfig(Keys.password, password.value, 7)
          configStore.setConfig(Keys.remmber, remember.value)
        } else {
          configStore.setConfig(Keys.username, username.value)
          configStore.setConfig(Keys.password, null)
          configStore.setConfig(Keys.remmber, remember.value)
        }

        // 加载操作日志
        recordStore.loadRecords(res.id)

        // await nextTick(() => formRef.value.resetFields())
        api.getAccountList({ user_id: res.id, limit: 500 }).then(resp => {
          accountStore.setAccounts(resp.list)
          console.log('fetch accounts success ', resp)
        }).catch(err => {
          console.log('fetch accounts err', err)
        })

        api.getPayOutList().then(resp => {
          accountStore.setPayouts(resp)
          console.log('payouts: ', resp)
        })
        api.getInComeList().then(resp => {
          accountStore.setInComes(resp)
          console.log('incomes: ', resp)
        })
        api.getCurrencyList().then(resp => {
          accountStore.setCurrencies(resp)
          console.log('currencies: ', resp)
        })

        api.getAirwallexConfig({}).then(resp => {
          airwallexStore.setConfig(resp)
        })

      } catch (error) {
        errorText.value = error.msg
        setTimeout(() => {
          errorText.value = ''
        }, 5000)
      }
    })
  }

}

</script>


<template>
  <div class="login-panel">
    <Toolbar :closeType="0" onlyClose :show-records="false" />

    <div class="flex flex-col flex-c-center flex-center w-full flex-1">
      <el-form :model="formData" :rules="formRules" ref="formRef" style="width: 240px;">
        <div class="logo">
          <img src="../assets/images/login-logo.webp" alt="" width="191" height="31">
          <!-- <img src="../assets/images/logo-test.png" alt="" width="230" height="31"> -->
        </div>

        <el-form-item prop="username">
          <el-input v-model="username" placeholder="请输入用户名" maxLength="10" clearable @keyup.enter="() => {
      pwdRef.focus()
    }">
            <template #prefix><i class="iconfont icon-user" style="font-size: 0.9em"></i></template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input ref="pwdRef" v-model="password" type="password" placeholder="请输入密码" maxLength="20" show-password
            clearable @keyup.enter="() => {
      onSubmit()
    }">
            <template #prefix><i class="iconfont icon-password" style="font-size: 0.9em"></i></template>
          </el-input>
        </el-form-item>

        <el-form-item prop="remember" class="remember">
          <el-checkbox v-model="remember">
            <span class="remember-text">记住密码（保存两周）</span>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="updateStore.checking" @click="onSubmit('formData')" round>
            {{ buttonLabel }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <div class="message-box" v-show="errorText">
            <el-icon color="#f56c6c">
              <CircleCloseFilled />
            </el-icon>
            <el-text type="danger">{{ errorText }}</el-text>
          </div>
          <div class="message-empty" v-show="!errorText"></div>
        </el-form-item>
      </el-form>

      <div class="footer">
        <p>
          {{ configStore.mode ? '' : '测试服' }}
          <span style="font-weight: 600" v-if="!updateStore.update_available">{{ "v" + app_info.version }}</span>
          <span style="font-size: 10pt" v-else
            :class="[updateStore.update_available || updateStore.update_err ? 'red' : 'trans']">{{ checkMsg }}</span>
        </p>
      </div>

    </div>

  </div>
</template>


<style scoped>
.gray {
  color: gray
}

.trans {
  color: transparent
}

.red {
  color: red;
}

.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  /* background: url(../assets/images/login-bg.webp) no-repeat center; */
  background-image: url(../assets/images/login-bg.webp);
  background-repeat: no-repeat;
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}

.logo {
  width: 240px;
  margin-bottom: 30px;
  text-align: center;
}

:deep(.el-input__wrapper) {
  background-color: #fff5;
  border-radius: 16px;
  box-shadow: 0 0 0 1px #fcfcfc;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff;
}

.remember :deep(.el-form-item__content) {
  padding-left: 20px;
}

.remember-text {
  font-size: 12px;
  color: #999;
}

.el-button {
  width: 100%;
  height: 36px;
}

.message-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 34px;
  background: #fcd3d388;
  box-shadow: 0 0 0 1px #f56c6c;
  border-radius: 18px;
  font-size: 1em;
}

.message-empty {
  width: 100%;
  height: 34px;
}

.footer {
  color: #000000;
  font-size: 0.8em;
}
</style>