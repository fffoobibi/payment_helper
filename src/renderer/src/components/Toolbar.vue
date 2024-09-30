<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useLocalConfig } from "@/stores/config"
import { useUserStore } from "@/stores"
const configStore = useLocalConfig()
const store = useUserStore()
const { isPin } = storeToRefs(configStore)
import appInfo from "../../../../package.json"

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
    default: 0  // 0：关闭  1：隐藏
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

defineExpose({
  onClose
})
</script>


<template>
  <div class="toolbar" :class="{ 'only-close': onlyClose }">
    <div class="drag" :class="{ 'title': onlyClose }">

      <slot>
        {{ title }}
      </slot>
    </div>
    <div class="win-options">
      <slot name="options">

      </slot>
      <el-space class="drag">
        <svg v-if="!configStore.mode" t="1727581711509" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="2579" width="16" height="16">
          <path
            d="M1022.06544 583.40119c0 11.0558-4.034896 20.61962-12.111852 28.696576-8.077979 8.077979-17.639752 12.117992-28.690436 12.117992L838.446445 624.215758c0 72.690556-14.235213 134.320195-42.718941 184.89915l132.615367 133.26312c8.076956 8.065699 12.117992 17.634636 12.117992 28.690436 0 11.050684-4.034896 20.614503-12.117992 28.691459-7.653307 8.065699-17.209964 12.106736-28.690436 12.106736-11.475356 0-21.040199-4.041036-28.690436-12.106736L744.717737 874.15318c-2.124384 2.118244-5.308913 4.88424-9.558703 8.283664-4.259 3.3984-13.180184 9.463536-26.78504 18.171871-13.598716 8.715499-27.415396 16.473183-41.439808 23.276123-14.029528 6.797823-31.462572 12.966313-52.289923 18.49319-20.827351 5.517667-41.446971 8.28571-61.842487 8.28571L552.801776 379.38668l-81.611739 0 0 571.277058c-21.668509 0-43.250036-2.874467-64.707744-8.615215-21.473057-5.734608-39.960107-12.749372-55.476499-21.039175-15.518438-8.289804-29.541827-16.572444-42.077328-24.867364-12.541641-8.290827-21.781072-15.193027-27.739784-20.714787l-9.558703-8.93244L154.95056 998.479767c-8.500605 8.921183-18.699897 13.386892-30.606065 13.386892-10.201339 0-19.335371-3.40454-27.409257-10.202363-8.079002-7.652284-12.437264-17.10968-13.080923-28.372188-0.633427-11.263531 2.659573-21.143553 9.893324-29.647227l128.787178-144.727219c-24.650423-48.464805-36.980239-106.699114-36.980239-174.710091L42.738895 624.207571c-11.057847 0-20.61655-4.041036-28.690436-12.111852-8.079002-8.082072-12.120039-17.640776-12.120039-28.696576 0-11.050684 4.041036-20.61962 12.120039-28.689413 8.073886-8.072863 17.632589-12.107759 28.690436-12.107759l142.81466 0L185.553555 355.156836l-110.302175-110.302175c-8.074909-8.077979-12.113899-17.640776-12.113899-28.691459 0-11.04966 4.044106-20.61962 12.113899-28.690436 8.071839-8.076956 17.638729-12.123109 28.691459-12.123109 11.056823 0 20.612457 4.052293 28.692482 12.123109l110.302175 110.302175 538.128077 0 110.303198-110.302175c8.070816-8.076956 17.632589-12.123109 28.690436-12.123109 11.050684 0 20.617573 4.052293 28.689413 12.123109 8.077979 8.070816 12.119015 17.640776 12.119015 28.690436 0 11.050684-4.041036 20.614503-12.119015 28.691459l-110.302175 110.302175 0 187.448206 142.815683 0c11.0558 0 20.618597 4.034896 28.690436 12.113899 8.076956 8.069793 12.117992 17.638729 12.117992 28.683273l0 0L1022.06544 583.40119 1022.06544 583.40119zM716.021162 216.158085 307.968605 216.158085c0-56.526411 19.871583-104.667851 59.616796-144.414087 39.733956-39.746236 87.88256-59.611679 144.411017-59.611679 56.529481 0 104.678084 19.865443 144.413064 59.611679C696.156742 111.48921 716.021162 159.631674 716.021162 216.158085L716.021162 216.158085 716.021162 216.158085 716.021162 216.158085z"
            fill="#8a8a8a" p-id="2580"></path>
        </svg>
        <!-- <el-icon v-if="!configStore.mode" class="iconfont icon-debug-gray" color="gray" :size="16"></el-icon> -->
        <span v-if="!onlyClose" style="color:gray;font-size: 10pt;font-weight:600;">
          v{{ appInfo.version }}</span>
      </el-space>
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