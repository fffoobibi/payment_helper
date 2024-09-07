<script setup>
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useRouter, useRoute } from 'vue-router'
import { useImageStore } from '@/stores/images'
const imgStore = useImageStore()
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

</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
