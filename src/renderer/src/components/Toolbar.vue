<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useLocalConfig } from "@/stores/config"
import { useUserStore } from "@/stores"
const configStore = useLocalConfig()
const store = useUserStore()
const { isPin } = storeToRefs(configStore)

const isMax = ref(false)
const emit = defineEmits(['close'])
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  onlyClose: {
    type: Boolean,
    default: false
  },
  closeType: {
    type: Number,
    default: 1  // 0：关闭  1：隐藏
  }
})

onMounted(async () => {
  if (store.user?.id) {
    if (isPin.value) {
      onWindow('pin', { isPin: true })
      configStore.setPin(true)
    } else {
      onWindow('pin', { isPin: false })
      configStore.setPin(false)
    }
  }
})

const onPin = () => {
  console.log('aaaaa');
  onWindow('pin', { isPin: !isPin.value })
  configStore.setPin(!isPin.value)
}

const onMinimize = () => {
  onWindow('minimize')
}
const onMaximize = () => {
  isMax.value = !isMax.value
  onWindow(isMax.value ? 'maximize' : 'unmaximize')
}
const onClose = () => {
  onWindow('close', { closeType: props.closeType })
  emit('close')
}

const onWindow = (action, data) => {
  electron.window(action, data)
}
</script>


<template>
  <div class="toolbar" :class="{ 'only-close': onlyClose }">
    <div class="drag" :class="{ 'title': onlyClose }">{{ title }}</div>
    <div class="win-options">
      <el-button v-if="!onlyClose" class="win-option win-pin" @click="onPin" :title="isPin ? '取消固定' : '固定'" text>
        <el-icon class="iconfont" :class="[isPin ? 'icon-pin' : 'icon-unpin']"></el-icon>
      </el-button>
      <el-button v-if="!onlyClose" class="win-option" @click="onMinimize" title="最小化" text>
        <el-icon :class="['iconfont', 'icon-min']"></el-icon>
      </el-button>
      <el-button v-if="!onlyClose" class="win-option" @click="onMaximize" :title="isMax ? '向下还原' : '最大化'" text>
        <el-icon class="iconfont" :class="[isMax ? 'icon-normal' : 'icon-max']"></el-icon>
      </el-button>
      <el-button class="win-option danger" @click="onClose" title="关闭" text>
        <el-icon :class="['iconfont', 'icon-close']"></el-icon>
      </el-button>
    </div>
  </div>
</template>


<style scoped>
.toolbar {
  display: flex;
  width: 100%;
  height: 30px;
  background-color: #fff;
}

.toolbar.only-close {
  background: none;
}

.title {
  padding: 2px 0 0 40px;
  font-size: 0.9em;
  color: #678eb7;
  text-align: center;
}

.drag {
  flex: 1;
}

.win-options {
  display: flex;
}

.win-option {
  width: 45px;
  height: 30px;
  margin: 0;
  border-radius: 0;
  outline: none !important;
}

:deep(.el-button:not(.danger):hover) {
  background: #e5e5e5;
}

.win-option.danger:hover {
  background-color: #e81123;
}

:deep(.iconfont::before) {
  color: #000;
  font-size: 1em;
}

.win-pin :deep(.iconfont::before) {
  font-size: 1.2em;
}

:deep(.danger:hover .iconfont::before) {
  color: #fff;
}
</style>