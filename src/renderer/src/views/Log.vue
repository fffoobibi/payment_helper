<script setup>
import { computed, ref, watch } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import { useLogStore } from '@/stores/index'
import { storeToRefs } from "pinia"
import message from '../utils/message';
const logStore = useLogStore()
const { content } = storeToRefs(logStore)

const loading = ref(false)
const reload = () => {
    loading.value = true
    electron.files.readFile(logStore.file, (err, data) => {
        if (!err) {
            logStore.content = data
            message.success('已重新加载')
        }
        loading.value = false
    })
}
</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar title="日志查看" :close-type="3" :only-close="true" mode="custom">
                <template #options>
                    <el-button class="win-option" type="text" link :loading="loading" @click="reload">
                        <template #loading>
                            <el-icon style="animation: loading-rotate 2s linear infinite;">
                                <Refresh />
                            </el-icon>
                        </template>
                        <el-space>
                            <el-icon v-if="!loading">
                                <Refresh />
                            </el-icon>
                            <span class=" black">重载</span>
                        </el-space>
                    </el-button>
                </template>
            </Toolbar>
        </div>
        <div class="content">
            <MonaCoEditor :content="content"></MonaCoEditor>
        </div>

    </div>
</template>

<style scoped>
:global(#app){
    border: 1px solid rgb(199, 199, 199);
}
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