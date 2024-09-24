<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
import { useLogStore, useUpdateStore, useUserStore, useWindowStore } from './stores';
import message from './utils/message';
import { useIntervalFn } from "@vueuse/core"
import updater from "@/utils/update"
import appInfo from '../../../package.json'
import logger from './utils/logger';

const store = useUserStore()
const imgStore = useImageStore()
const logStore = useLogStore()
const wStore = useWindowStore()
const updateStore = useUpdateStore()
const router = useRouter()
const route = useRoute()

const { pause, resume, isActive } = useIntervalFn(async () => {
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
            router.push({ name: 'setting' })
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

electron.onOpenExcel((user, filePath, data) => {
  store.setUser(user)
  wStore.user = user
  wStore.excelFile = filePath
  wStore.excelData = data
  console.log('excel data', data);
  router.push({ name: 'excel' })
})

electron.onUpdater((name, value, ...args) => {
  switch (name) {
    case 'checking-for-update':
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

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
