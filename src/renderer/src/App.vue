<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
import { useLogStore } from './stores';
import message from './utils/message';

const imgStore = useImageStore()
const logStore = useLogStore()
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

electron.onUpdater((name, value) => {
  console.log('get updater msg ...');
  switch (name) {
    case 'checking-for-update':
      // console.log('版本检查中...');
      // message.success('版本检查中...')
      break;
    case 'update-available':
      console.log('有可用版本');
      message.success("有可用版本")
      break;
    default:
      break;
  }
})

console.log('app view ...');
// 

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
