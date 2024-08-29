import { nextTick, reactive, ref, toRaw } from 'vue'
import { useRouter } from 'vue-router';

import { useUserStore } from '@/stores'
import api from "@/api"

const router = useRouter()
const store = useUserStore()

export function useLogin() {

  const loading = ref(false)

  const formData = reactive({
    username: '',
    password: '',
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
    formRef.value.validate(valid => {
      if (!valid) {
        return false
      }

      store.setUserInfo(formData)
      window.ipcRenderer.send('login', toRaw(formData))
      router.push('/home')
      nextTick(() => {
        formRef.value.resetFields()
      })
    })
  }

  return {
    loading,
    formData,
    formRef,
    formRules,
    onSubmit
  }
}