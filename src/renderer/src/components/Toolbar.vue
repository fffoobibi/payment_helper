<script setup>
import { ref, onMounted, computed, watch, nextTick, watchEffect, onActivated } from 'vue'
import { storeToRefs } from "pinia"
import { useLocalConfig } from "@/stores/config"
import { useOperateRecords, useUserStore } from "@/stores"
import { dateTimeFmt } from "@/utils/format"
import message from '../utils/message'
import EventBus from "../utils/eventbus"

const configStore = useLocalConfig()
const store = useUserStore()
const { isPin } = storeToRefs(configStore)
import appInfo from "../../../../package.json"
import { useClient } from '../utils/client'

const { width } = useClient()
const recordStore = useOperateRecords()
const recordRef = ref(null)
const { current, treeData, treeProps, treeExpand, totalCount, todayCount } = storeToRefs(recordStore)

const isMax = ref(false)
const emit = defineEmits(['close', 'appClose'])
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
  },
  mode: {
    type: String,
    default: 'config'
  },
  showRecords: {
    type: Boolean,
    default: true
  },
  fulled: {
    type: Boolean,
    default: true
  },
  forcePin: {
    type: Boolean,
    default: false
  },
  isDialog: {
    type: Boolean,
    default: false
  }
})

const pinState = computed(() => {
  if (props.forcePin) {
    return false
  }
  return !props.onlyClose
})

const maxState = computed(() => {
  if (props.forcePin) {
    return false
  }
  return !props.onlyClose
})

const minState = computed(() => {
  if (props.forcePin) {
    return true
  }
  return !props.onlyClose
})

const closeType = computed(() => {
  if (props.mode === 'config') {
    return configStore.closeMode
  }
  return props.closeType
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
  if (props.forcePin) {
    onWindow('pin', { isPin: true })
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
  EventBus.emit('close')
  onWindow('close', { closeType: closeType.value })
  emit('close')
}

const onWindow = (action, data) => {
  electron.window(action, data)
}
const showOperateRecords = () => {
  console.log(treeData.value)
  console.log(current.value);
  console.log(treeExpand.value)
}



const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  message.success("复制成功")
}

const showDebug = ref(false)
const showValues = ref(null)
const showDebugTitle = ref('')
const showDebugError = ref(false)
const showErrMsg = ref('')
const showDebugContent = (operate_data, url, data) => {
  // if (!configStore.mode) {
  showDebug.value = true
  showValues.value = JSON.parse(operate_data)
  showDebugTitle.value = url
  if (data.status == 0) {
    showErrMsg.value = ''
    showDebugError.value = false
  } else {
    showErrMsg.value = data.statusMsg
    showDebugError.value = true
  }
  // }

}

const toolbarRef = ref(null)
const maxTitleLabelWidth = computed(() => {
  if (props.fulled) {
    return 500
  } else {
    return width.value - 50 - 320 - 6 * 60 - 100
  }
})
const advance = ref(false)
const query = ref('')
const success = ref('-1')
const filterMethod = (query, node) => {
  let search
  if (success.value == "-1") {
    // 全部
    search = node.title + (node.detail ?? "") + (node.statusMsg ?? "")
  } else if (success.value == '0') {
    //成功
    search = node.title + (node.detail ?? "")
    return node.status === 0 && search.includes(query)
  } else {
    // 失败
    search = node.title + (node.detail ?? "") + (node.statusMsg ?? "")
    return node.status !== 0 && search.includes(query)
  }
  return search.includes(query)
}

const trigger = ref(Date.now())
const currentRef = ref(null)
const currentTooltipDisabled = computed(() => {
  trigger.value
  if (currentRef.value) {
    if (currentRef.value.offsetWidth < currentRef.value.scrollWidth) {
      // 文本被截断
      return false
    }
    return true
  }
})
const updateTooltipDisabled = () => {
  trigger.value++
}
watch(width, () => {
  updateTooltipDisabled()
})

onMounted(() => {
  nextTick(() => {
    updateTooltipDisabled()
  })
})

onActivated(() => {
  nextTick(() => {
    updateTooltipDisabled()
  })
})

defineExpose({
  onClose,
  updateTooltipDisabled
})

</script>


<template>
  <div class="toolbar" :class="{ 'only-close': onlyClose }" ref="toolbarRef">
    <div class="drag" :class="{ 'title': onlyClose }">

      <slot>
        {{ title }}
      </slot>
    </div>
    <div class="win-options">
      <slot name="options">

      </slot>

      <el-popover v-if="configStore.operate && showRecords" placement="bottom" title="操作记录（近15天）" trigger="click"
        hide-after="0" transition="none" :width="520" :persistent="false" @after-enter="() => {
    if (current) {
      recordRef?.scrollToNode(current.id)
    }
  }">
        <el-space alignment="center" style="margin-bottom: 4px; height: 32px">
          <span class="t-gray f-12 ">总计 <span class="t-red f-12">{{ totalCount }}</span>条</span>
          <span class="t-gray f-12 ">今日 <span class="t-red f-12 ">{{ todayCount }}</span>条</span>
          <el-button link @click="advance = !advance">
            <el-icon>
              <Search />
            </el-icon>
          </el-button>
          <template v-if="advance">
            <el-input v-model="query" placeholder="搜索" clearable
              @keyup.enter="() => recordRef?.filter(query)"></el-input>
            <el-select style="width: 100px;" :teleported="false" v-model="success"
              @change="() => recordRef?.filter(query)">
              <el-option label="全部" value="-1"></el-option>
              <el-option label="成功" value="0"></el-option>
              <el-option label="失败" value="1"></el-option>
            </el-select>

          </template>

        </el-space>

        <el-tree-v2 :data="treeData" :props="treeProps" :default-expanded-keys="treeExpand" ref="recordRef" indent="4"
          :filter-method="filterMethod">
          <template #default="{ node: { label, data, isLeaf } }">
            <span v-if="!isLeaf">{{ label }} {{ ` (${data.children.length})` }}</span>
            <div v-else class="flex gap-4 flex-between w-full" style="padding-right: 10px">
              <div class="flex gap-4 w-full">
                <span :class="['tree-item', data.status == 0 ? 't-black' : 't-red']" style="max-width: 400px;">
                  <span class="t-gray t-n m-r-4">{{ dateTimeFmt(data.create_time, 6) }}</span>
                  <span class="t-primary t-n m-r-4"> {{ data.title }}</span>
                  <span v-if="data.status == 0" class="t-black" style="flex:1;">{{ data.detail?.replaceAll('<br>', ' ')
                    }}</span>
                  <span v-else class="t-red" style="flex:1;">{{ data.statusMsg.replaceAll('<br>', ' ') }}</span>
                </span>
              </div>
              <el-button type="info" link @click="showDebugContent(data.operate_data, data.url, data)">
                {{ "查看 " }}
                <el-icon>
                  <SuccessFilled v-if="data.status == 0" style="color: #55AA55" />
                  <CircleCloseFilled v-else color="red" />
                </el-icon>
              </el-button>
            </div>
          </template>
        </el-tree-v2>

        <template #reference>
          <el-button link @click="showOperateRecords">
            <el-space alignment="center" v-if="showRecords && current">
              <span class="t-black f-12  t-n">{{ dateTimeFmt(current.create_time / 1000, 6) }}</span>
              <span class="t-primary t-n f-12"> {{ current.title }}</span>
              <el-tooltip :disabled="currentTooltipDisabled"
                :content="current.status == 0 ? current.detail?.replaceAll('<br>', ' ') : current.statusMsg?.replaceAll('<br>', ' ')">
                <span v-if="current.status == 0" class="t-black t-n f-12 tree-item" ref="currentRef"
                  :style="{ maxWidth: maxTitleLabelWidth + 'px' }"> {{ current.detail?.replaceAll('<br>', ' ')
                  }}</span>
                <span v-else ref="currentRef" class="t-red t-n f-12 tree-item"
                  :style="{ maxWidth: maxTitleLabelWidth + 'px' }">
                  {{ current.statusMsg?.replaceAll('<br>', ' ') }}
                </span>
              </el-tooltip>

              <el-icon>
                <SuccessFilled v-if="current.status == 0" style="color: #55AA55" />
                <CircleCloseFilled v-else color="red" />
              </el-icon>
            </el-space>
            <span v-else-if="totalCount === 0" class="t-gray f-12 t-n">暂无记录</span>

          </el-button>
        </template>

      </el-popover>

      <el-space class="drag">
        <svg v-if="!configStore.mode" t="1727581711509" class="icon" viewBox="0 0 1024 1024" version="1.1"
          xmlns="http://www.w3.org/2000/svg" p-id="2579" width="16" height="16">
          <path
            d="M1022.06544 583.40119c0 11.0558-4.034896 20.61962-12.111852 28.696576-8.077979 8.077979-17.639752 12.117992-28.690436 12.117992L838.446445 624.215758c0 72.690556-14.235213 134.320195-42.718941 184.89915l132.615367 133.26312c8.076956 8.065699 12.117992 17.634636 12.117992 28.690436 0 11.050684-4.034896 20.614503-12.117992 28.691459-7.653307 8.065699-17.209964 12.106736-28.690436 12.106736-11.475356 0-21.040199-4.041036-28.690436-12.106736L744.717737 874.15318c-2.124384 2.118244-5.308913 4.88424-9.558703 8.283664-4.259 3.3984-13.180184 9.463536-26.78504 18.171871-13.598716 8.715499-27.415396 16.473183-41.439808 23.276123-14.029528 6.797823-31.462572 12.966313-52.289923 18.49319-20.827351 5.517667-41.446971 8.28571-61.842487 8.28571L552.801776 379.38668l-81.611739 0 0 571.277058c-21.668509 0-43.250036-2.874467-64.707744-8.615215-21.473057-5.734608-39.960107-12.749372-55.476499-21.039175-15.518438-8.289804-29.541827-16.572444-42.077328-24.867364-12.541641-8.290827-21.781072-15.193027-27.739784-20.714787l-9.558703-8.93244L154.95056 998.479767c-8.500605 8.921183-18.699897 13.386892-30.606065 13.386892-10.201339 0-19.335371-3.40454-27.409257-10.202363-8.079002-7.652284-12.437264-17.10968-13.080923-28.372188-0.633427-11.263531 2.659573-21.143553 9.893324-29.647227l128.787178-144.727219c-24.650423-48.464805-36.980239-106.699114-36.980239-174.710091L42.738895 624.207571c-11.057847 0-20.61655-4.041036-28.690436-12.111852-8.079002-8.082072-12.120039-17.640776-12.120039-28.696576 0-11.050684 4.041036-20.61962 12.120039-28.689413 8.073886-8.072863 17.632589-12.107759 28.690436-12.107759l142.81466 0L185.553555 355.156836l-110.302175-110.302175c-8.074909-8.077979-12.113899-17.640776-12.113899-28.691459 0-11.04966 4.044106-20.61962 12.113899-28.690436 8.071839-8.076956 17.638729-12.123109 28.691459-12.123109 11.056823 0 20.612457 4.052293 28.692482 12.123109l110.302175 110.302175 538.128077 0 110.303198-110.302175c8.070816-8.076956 17.632589-12.123109 28.690436-12.123109 11.050684 0 20.617573 4.052293 28.689413 12.123109 8.077979 8.070816 12.119015 17.640776 12.119015 28.690436 0 11.050684-4.041036 20.614503-12.119015 28.691459l-110.302175 110.302175 0 187.448206 142.815683 0c11.0558 0 20.618597 4.034896 28.690436 12.113899 8.076956 8.069793 12.117992 17.638729 12.117992 28.683273l0 0L1022.06544 583.40119 1022.06544 583.40119zM716.021162 216.158085 307.968605 216.158085c0-56.526411 19.871583-104.667851 59.616796-144.414087 39.733956-39.746236 87.88256-59.611679 144.411017-59.611679 56.529481 0 104.678084 19.865443 144.413064 59.611679C696.156742 111.48921 716.021162 159.631674 716.021162 216.158085L716.021162 216.158085 716.021162 216.158085 716.021162 216.158085z"
            fill="#8a8a8a" p-id="2580"></path>
        </svg>
        <span class="t-gray f-12 b-500 t-n">
          v{{ appInfo.version }}</span>
      </el-space>


      <el-button v-if="pinState" class="win-option win-pin" @click="onPin" :title="isPin ? '取消固定' : '固定'" text>
        <el-icon class="iconfont" :class="[isPin ? 'icon-pin' : 'icon-unpin']"></el-icon>
      </el-button>
      <el-button v-if="minState" class="win-option" @click="onMinimize" title="最小化" text>
        <el-icon :class="['iconfont', 'icon-min']"></el-icon>
      </el-button>
      <el-button v-if="maxState" class="win-option" @click="onMaximize" :title="isMax ? '向下还原' : '最大化'" text>
        <el-icon class="iconfont" :class="[isMax ? 'icon-normal' : 'icon-max']"></el-icon>
      </el-button>
      <el-button class="win-option danger" @click="onClose" title="关闭" text>
        <el-icon :class="['iconfont', 'icon-close']"></el-icon>
      </el-button>
    </div>
  </div>

  <!-- 日志详情 -->
  <el-dialog v-model="showDebug" width="600" destroy-on-close title="数据" lock-scroll :append-to="recordRef?.$el">
    <div class="flex flex-col">
      <div class="flex flex-between flex-center">
        <div>
          <span v-if="!configStore.mode" class="t-black f-14 b-600">{{ showDebugTitle }}
          </span>
          <el-button link>
            <el-icon @click="onCopy(showDebugTitle)">
              <CopyDocument />
            </el-icon>
          </el-button>
        </div>

        <el-button type="danger" link @click="async () => {
    let r = ''
    Object.keys(showValues).forEach(k => {
      r += `${k}:${showValues[k]}\n`
    })
    onCopy(r)
  }">复制为FormData</el-button>
      </div>
      <div v-if="showDebugError">
        <span class="t-red f-12" v-html="showErrMsg"></span>
      </div>

    </div>

    <json-viewer copyable :value="showValues" expanded></json-viewer>
  </el-dialog>
</template>


<style scoped>
:deep(.el-tree-node__content) {
  width: 100% !important;
}

.tree-item {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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
  /* justify-content: first baseline */
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