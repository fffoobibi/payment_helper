<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
import { useLogStore, useUpdateStore, useUserStore, useExcelStore, useScreenShortStore, useOperateRecords, useDialogStore } from './stores';
import message from './utils/message';
import { useIntervalFn } from "@vueuse/core"
import updater from "@/utils/update"
import appInfo from '../../../package.json'
import logger from './utils/logger'
import { ref } from "vue"
import EventBus from "./utils/eventbus"


const shortStore = useScreenShortStore()
const store = useUserStore()
const imgStore = useImageStore()
const logStore = useLogStore()
const wStore = useExcelStore()
const updateStore = useUpdateStore()
const recordStore = useOperateRecords()
const dialogStore = useDialogStore()

const router = useRouter()
const route = useRoute()

const show = ref(false)
const download = () => {
  if (updateStore.update_success) {
    updater.install()
  } else {
    updateStore.downloading = true
    updater.download()
  }
}

useIntervalFn(async () => {
  if (store.user.id) {
    try {
      if (store.showUpdate === false) {
        const rs = await updater.checkUpdates(false)
        if (rs) {
          const remote = parseInt(rs.updateInfo.version.replaceAll('.', ''))
          const current = parseInt(appInfo.version.replaceAll('.', ''))
          if (current < remote) {
            message.success('发现新版本！')
            store.showUpdate = true
            show.value = true
            // router.push({ name: 'setting' })
          }
        }
      }
    } catch (err) {
      logger.error('error in check update', err)
    }
  }
}, 1000 * 60 * 10)

electron.onPreviewImage((urls, index, render) => {
  imgStore.index = index
  imgStore.render = render
  imgStore.setUrls(urls)
  if (route.name != 'image') {
    router.push({ name: 'image' })
  }
})

electron.onNewWindow((urlname, params) => router.push({ name: urlname, params: params }))

electron.onOpenLog((content, path) => {
  router.push({ name: 'log' })
  electron.files.readFile(path, (err, data) => {
    logStore.file = path
    if (!err) {
      logStore.content = data
    }
  })
}, (c, path) => {
  logStore.file = path
  logStore.append(c)
})

electron.onOpenUpdate(version => {
  updateStore.canUpdate = true
  updateStore.version = version
  router.push({ name: 'update' })
})

electron.onOpenExcel(
  (user, filePath, data) => {
    store.setUser(user)
    wStore.user = user
    wStore.excelFile = filePath
    wStore.excelData = data
    router.push({ name: 'excel' })
  },
  () => {
    wStore.excelLoading = false
  })

electron.onUpdater((name, value, ...args) => {
  switch (name) {
    case 'checking-for-update':
      console.log('checking ...')
      updateStore.update_err = false
      updateStore.checking = true
      break;
    case 'update-not-available':
      updateStore.checking = false
      updateStore.update_err = false
      updateStore.canUpdate = false
      updateStore.version = value
      break
    case 'update-available':
      updateStore.update_success = false
      updateStore.canUpdate = true
      updateStore.downloading = false
      updateStore.checking = false
      updateStore.version = value
      if (args[0]) {
        message.success('有可用版本')
      }
      break;
    case 'download-progress':
      updateStore.update_success = false
      updateStore.downloading = true
      updateStore.update_info = value
      console.log('downloading ', value)
      break
    case 'update-downloaded':
      updateStore.downloading = false
      updateStore.update_success = true
      break;
    case 'error':
      updateStore.update_success = false
      updateStore.downloading = false
      updateStore.checking = false
      updateStore.update_err = true
      break
    default:
      break;
  }
})

electron.onShortCutCapture(async src => {
  shortStore.image = src
})

// 操作事件
electron.operate.onRecordEvent(data => {
  recordStore.append(data)
})

// 打款详情查看
electron.onOpenDetailDialog((user, detailId) => {
  store.setUser(user)
  dialogStore.setUser(user)
  dialogStore.dynamic.detailId = detailId
  dialogStore.dynamic.fetchDetailFlag= true
  router.push({ name: "detail" })
})

EventBus.on('close',()=>{
  console.log('clsoe ./...')
})

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>

  <el-dialog v-model="show" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
    append-to-body>

    <div v-loading="updateStore.checking" element-loading-background="white" element-loading-text="检查更新中">
      <div v-if="updateStore.update_err">
        <p class="bold red" style="text-align: center">检查失败</p>
      </div>
      <div v-else-if="updateStore.canUpdate">
        <p class="bold black">发现新版本!</p>
        <p>版本：{{ "v" + updateStore.version.version }}</p>
        <el-scrollbar v-if="(!updateStore.downloading) && (!updateStore.update_success)"
          :height="updateStore.downloading ? '50px' : '140px'">
          <div style="font-size: 10pt; color:black" v-html="updateStore.version.content">
          </div>
        </el-scrollbar>
        <div style="display: flex; width: 100%;" v-if="updateStore.downloading || updateStore.update_success">
          <span style="margin-right: 0px;">进度：</span>
          <el-progress :stroke-width="10" :percentage="updateStore.percent" style="width:90%"
            :status="updateStore.update_success ? 'success' : ''" />
        </div>
        <p v-if="updateStore.downloading">速度：<span style="font-size: 10pt;" class="black">{{ updateStore.download_info
            }}</span>
        </p>
      </div>
      <div v-else style="text-align: center">
        <p class="bold black">无可用更新</p>
      </div>
    </div>

    <template #footer v-if="!updateStore.checking">
      <div v-if="updateStore.canUpdate">
        <el-button :type="updateStore.update_success ? 'danger' : 'primary'" :loading="updateStore.downloading"
          @click="download">
          {{ updateStore.update_success ? "退出重启" : '更新' }}
        </el-button>
      </div>

    </template>
  </el-dialog>

</template>
