<script setup>
import Toolbar from '@/components/Toolbar.vue';
import { useUpdateStore } from '@/stores/index'
const update = useUpdateStore()
import updater from "@/utils/update"

const download = () => {
  if (update.update_success) {
    console.log('send install ...');
    updater.install()
  } else {
    update.downloading = true
    updater.download()
  }
}
</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar title="更新" :close-type="4" :only-close="true">
            </Toolbar>
        </div>
        <div class="content">
            <div v-if="false">
                <p class="bold black">发现新版本!</p>
                <p>版本：{{ "v" + update.version.version }}</p>
                <div style="display: flex" v-if="update.downloading || update.update_success">
                    <span style="margin-right: 0px;">进度：</span>
                    <el-progress :text-inside="true" :stroke-width="20" :percentage="update.percent"
                        style="width:85%" />
                </div>
                <p v-if="update.downloading">速度：<span style="font-size: 10pt;" class="black">{{ update.download_info
                        }}</span>
                </p>
            </div>
            <div v-else style="text-align: center;">
                <p class="bold black">无可用更新</p>
            </div>
            <el-button :type="update.update_success ? 'danger' : 'primary'" :loading="update.downloading"
              @click="download">
              {{ update.update_success ? "退出重启" : '更新' }}
            </el-button>
        </div>

    </div>
</template>

<style scoped>
.bold {
    font-weight: 600;
}

.black {
    color: black;
}

.main {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #fff;
    color: black;
}

.content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    width: 100%;
    border: none !important;
}

:deep(.drag) {
    padding: 2px 0 0 40px;
    font-size: 10pt !important;
    color: black;
    text-align: left;
    font-weight: bold
}

:deep(.el-image-viewer__btn.el-image-viewer__close) {
    display: none;
    border: none;
}

:deep(.el-image-viewer__mask),
:deep(.el-image-viewer__wrapper),
:deep(.el-image-viewer__wrapper:focus),
:deep(.el-image-viewer__mask:focus) {
    position: fixed;
    top: 30px;
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
}
</style>