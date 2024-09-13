<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
import { useLogStore } from './stores';

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

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
