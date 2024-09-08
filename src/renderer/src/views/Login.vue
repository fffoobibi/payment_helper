<script setup>
import { nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router';
import { storeToRefs } from "pinia"
import Toolbar from '@/components/Toolbar.vue';
import api from "@/api"
import { useUserStore, useAccountStore } from '@/stores'
import { Keys, useLocalConfig } from "@/stores/config"

const router = useRouter();
const userStore = useUserStore()
const accountStore = useAccountStore()
const configStore = useLocalConfig()
const { currentUserName: username, currentUserPasswd: password, currentUserRemeber: remember } = storeToRefs(configStore)


const formData = reactive({
  username,
  password,
  remember
})

const formRef = ref(null)
const formRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

const onSubmit = async () => {
  formRef.value.validate(async valid => {
    if (!valid) {
      return false
    }
    try {
      const res = await api.login(formData)
      userStore.setUser(res)
      localStorage.setItem('token', res.token)
      electron.login({ username: formData.username, password: formData.password, remember: formData.remember })
      router.replace({ name: 'home' })

      if (formData.remember) {
        configStore.setConfig(Keys.username, username.value)
        configStore.setConfig(Keys.password, password.value, 7)
        configStore.setConfig(Keys.remmber, remember.value)
      } else {
        configStore.setConfig(Keys.username, username.value)
        configStore.setConfig(Keys.password, null)
        configStore.setConfig(Keys.remmber, remember.value)
      }
      await nextTick(() => formRef.value.resetFields())

      api.getAccountList({ user_id: res.id, limit: 500 }).then(resp => {
        accountStore.setAccounts(resp.list)
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
      })

    } catch (error) {
      console.log(error)
    }
  })
}
</script>


<template>
  <div class="login-panel">
    <Toolbar title="百舟打款助手" :closeType="0" onlyClose />

    <el-form :model="formData" :rules="formRules" ref="formRef" style="width: 240px;">
      <el-form-item prop="username">
        <el-input v-model="username" placeholder="请输入用户名" maxLength="10" clearable>
          <template #prefix>
            <el-icon class="el-input__icon">
              <user />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="password" type="password" placeholder="请输入密码" maxLength="20" show-password clearable>
          <template #prefix>
            <el-icon class="el-input__icon">
              <lock />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="remember">
        <el-checkbox v-model="remember">
          <span class="remember-text">记住密码（保存两周）</span>
        </el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" style="width: 100%;" @click="onSubmit('formData')">登录</el-button>
      </el-form-item>
    </el-form>

    <div class="footer">v2.0.1</div>
  </div>
</template>


<style scoped>
.login-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background-color: #f5f6f9;
}

.remember-text {
  font-size: 12px;
  color: #999;
}

.footer {
  color: #99a;
  font-size: 0.8em;
}
</style>