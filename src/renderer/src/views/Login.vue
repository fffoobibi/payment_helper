<script setup>
import { nextTick, reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router';
import Toolbar from '@/components/Toolbar.vue';
import api from "@/api"
import { useUserStore, useAccountStore } from '@/stores'

const router = useRouter();
const userStore = useUserStore()
const accountStore = useAccountStore()

const formData = reactive({
  username: '王盼盼',
  password: 'wzwl1234',
  remember: false
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

const onSubmit = () => {
  formRef.value.validate(async valid => {
    if (!valid) {
      return false
    }

    try {
      const res = await api.login(formData)
      userStore.setUser(res)
      localStorage.setItem('token', res.token)
      nextTick(() => formRef.value.resetFields())
      window.ipcRenderer.send('login', toRaw(formData))
      router.replace({ name: 'home' })

      api.getAccountList({ user_id: res.id, limit: 500 }).then(resp => {
        accountStore.setAccounts(resp.list)
      })

      api.getPayOutList().then(resp => {
        accountStore.setPayouts(resp)
      })
      api.getInComeList().then(resp => {
        accountStore.setInComes(resp)
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
    <Toolbar title="百舟打款助手" closeType="0" onlyClose />

    <el-form :model="formData" :rules="formRules" ref="formRef" style="width: 240px;">
      <el-form-item prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名" maxLength="10" clearable>
          <template #prefix>
            <el-icon class="el-input__icon">
              <user />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="password">
        <el-input v-model="formData.password" type="password" placeholder="请输入密码" maxLength="20" show-password
          clearable>
          <template #prefix>
            <el-icon class="el-input__icon">
              <lock />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item prop="remember">
        <el-checkbox v-model="formData.remember">
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