<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
import { useLogStore, useUpdateStore } from './stores';
import message from './utils/message';
import notification from './utils/notification';

const imgStore = useImageStore()
const logStore = useLogStore()
const updateStore = useUpdateStore()
const router = useRouter()
const route = useRoute()

electron.onPreviewImage((urls, index, render) => {
  imgStore.index = index
  imgStore.render = render
  imgStore.setUrls(urls)
  if (route.name != 'image') {
    router.push({ name: 'image' })
  }
})

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
  // updateStore.canUpdate = true
  console.log('get version ', version)
  updateStore.canUpdate = true
  updateStore.version = version
  router.push({ name: 'update' })
})

electron.onUpdater((name, value, ...args) => {
  console.log('get ', name, value);
  switch (name) {
    case 'checking-for-update':
      updateStore.update_err = false
      updateStore.checking = true
      break;
    case 'update-not-available':
      updateStore.checking = false
      updateStore.update_err = false
      // updateStore.update_available = false
      updateStore.canUpdate = false
      updateStore.version = value
      break
    case 'update-available':
      updateStore.update_success = false
      updateStore.canUpdate = true
      updateStore.downloading = false
      updateStore.checking = false
      // updateStore.update_available = true
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
      // notification.error("更新失败: " + value)
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
