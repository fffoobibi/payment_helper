<script setup>
import { reactive, ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from "pinia"
import { useUpdateStore, useUserStore } from "@/stores"
import { useLocalConfig } from "@/stores/config"
import api from "@/api"
import message from '../utils/message'
import updater from "@/utils/update"
import app_info from '../../../../package.json'
import { useRoute } from "vue-router"
import { computed } from 'vue'

const cfgStore = useLocalConfig()
const { autoClick, autoConfirm, formalUrl, testUrl, uploadFormalUrl, uploadTestUrl, mode } = storeToRefs(cfgStore)
const store = useUserStore()
const update = useUpdateStore()

const showHidden = ref(false)
const handleCtrlShiftQ = event => {
  if (event.ctrlKey && event.shiftKey && event.code === 'KeyQ') {
    showHidden.value = true
  }
}
onMounted(() => {
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

const reset = () => {
  formalUrl.value = 'http://bdapi.baizhoucn.com:2501'
  testUrl.value = 'http://192.168.0.10:20011'
  uploadFormalUrl.value = 'http://bdupload.baizhoucn.com'
  uploadTestUrl.value = 'http://192.168.0.10/index.php'
  cfgStore.updateFormalUrl()
  cfgStore.updateTestUrl()
  cfgStore.updateUploadFormal()
  cfgStore.updateUploadTest()
  message.success('域名已重置')
}
const openLog = () => {
  electron.viewLog()
}

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

const showDialog = computed(() => {
  if (update.canUpdate) {
    return true
  } if (update.update_err) {
    return true
  } if (update.update_success) {
    return true
  } if (update.downloading) {
    return true
  }
  return false
})

const show = ref(false)
const checkUpdates = () => {
  if (update.downloading) {

  }
  else if (update.update_success) {

  }
  else {
    update.checking = true
    updater.checkUpdates(false)
  }
  show.value = true
}

watch(showDialog, v => {
  show.value = v
}, {immediate: true})

const download = () => {
  if (update.update_success) {
    updater.install()
  } else {
    update.downloading = true
    updater.download()
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
      </Header>
      <el-scrollbar>

        <div class="pannel">
          <span class="black" style="font-size: 11pt;border-bottom: 2px solid purple;">版本信息</span>
          <el-form>
            <el-form-item label="当前版本">
              <el-space>
                <span class="black">{{ "v" + app_info.version }}</span>
                <el-button @click="checkUpdates" :loading="update.checking">检查更新</el-button>
              </el-space>
            </el-form-item>
          </el-form>


        </div>
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
              <el-checkbox label="自动点单" v-model="autoClick" @change="v => {
                  cfgStore.updateAutoClick()
                }" />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="showHidden" class="pannel">
          <el-space>
            <span class="black"
              style="font-size: 11pt;border-bottom: 2px solid purple; margin-bottom: 0px!important;">开发设置</span>
            <el-button link @click="reset">
              <el-icon color="black">
                <RefreshRight />
              </el-icon>
              重置
            </el-button>

          </el-space>

          <el-form label-width="auto" style=" margin-top: 5px!important;">
            <el-form-item label="切换">
              <el-space align="center">
                <el-radio-group v-model="mode">
                  <el-radio :value="true">正式服</el-radio>
                  <el-radio :value="false">测试服</el-radio>
                </el-radio-group>
                <el-button link @click="openLog">打开日志</el-button>
              </el-space>

            </el-form-item>
            <el-form-item label='接口'>
              <el-input type="text" style="width: 45%; margin-right: 10px;" placeholder="正式服" v-model="formalUrl"
                @input="v => cfgStore.updateFormalUrl()" clearable>
                <template #prefix>
                  <i class="iconfont icon-xianshang" />
                </template>
              </el-input>
              <el-input type="text" style="width:45%;" placeholder="测试服" v-model="testUrl" clearable
                @input="v => cfgStore.updateTestUrl()">
                <template #prefix>
                  <i class="iconfont icon-debug" />
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label='图片'>
              <el-input style="width: 45%; margin-right: 10px;" placeholder="正式服" v-model="uploadFormalUrl"
                @input="v => cfgStore.updateUploadFormal()" clearable>
                <template #prefix>
                  <i class="iconfont icon-xianshang" />
                </template></el-input>
              <el-input style="width: 45%;" placeholder="测试服" v-model="uploadTestUrl" clearable
                @input="v => cfgStore.updateUploadTest()">
                <template #prefix>
                  <i class="iconfont icon-debug" />
                </template>
              </el-input>
            </el-form-item>


          </el-form>
        </div>


      </el-scrollbar>

      <el-dialog v-model="show" :close-on-click-modal="false">

        <div v-loading="update.checking" element-loading-background="white" element-loading-text="检查更新中">
          <div v-if="update.update_err">
            <p class="bold red" style="text-align: center">检查失败</p>
          </div>
          <div v-else-if="update.canUpdate">
            <p class="bold black">发现新版本!</p>
            <p>版本：{{ "v" + update.version.version }}</p>
            <el-scrollbar v-if="(!update.downloading) && (!update.update_success)"
              :height="update.downloading ? '50px' : '140px'">
              <div style="font-size: 10pt; color:black" v-html="update.version.content">
              </div>
            </el-scrollbar>
            <div style="display: flex; width: 100%;" v-if="update.downloading || update.update_success">
              <span style="margin-right: 0px;">进度：</span>
              <el-progress :stroke-width="10" :percentage="update.percent" style="width:90%"
                :status="update.update_success ? 'success' : ''" />
            </div>
            <p v-if="update.downloading">速度：<span style="font-size: 10pt;" class="black">{{ update.download_info
                }}</span>
            </p>
          </div>
          <div v-else style="text-align: center">
            <p class="bold black">无可用更新</p>
          </div>
        </div>

        <template #footer v-if="!update.checking">
          <div v-if="update.canUpdate">
            <el-button  @click="show = false">关闭</el-button>
            <el-button :type="update.update_success ? 'danger' : 'primary'" :loading="update.downloading"
              @click="download">
              {{ update.update_success ? "退出重启" : '更新' }}
            </el-button>
          </div>

        </template>
      </el-dialog>
    </template>
  </Layout>
</template>

<style scoped>
:deep(.el-progress__text) {
  font-size: 10pt !important
}

h4 {
  padding: 0 10px;
  color: #333;
}

.bold {
  font-weight: 600;
}

.red {
  color: red;
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