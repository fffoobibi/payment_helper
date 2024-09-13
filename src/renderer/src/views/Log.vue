<script setup>
import { computed, ref, watch } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import { useLogStore } from '@/stores/index'
import { storeToRefs } from "pinia"
import message from '../utils/message';
const logStore = useLogStore()
const { content } = storeToRefs(logStore)

// const title = computed(() => {
//     return `图片查看 ${currentIndex.value + 1}/${urls.value.length}`
// })

// const content = ref(`[2024-09-12 17:13:06.780] [info]  [get] /accountTitle/getClientSubject, headers: [object Object]
// [2024-09-12 17:13:06.781] [info]  [get] /accountTitle/getClientSubject?type=1, headers: [object Object]
// [2024-09-12 17:13:06.781] [info]  [get] /incomeRecord/getCurrencies, headers: [object Object]
// [2024-09-12 17:13:06.915] [info]  [post] /paymentCashier/getPaymentList, headers: {
//   'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//   'X-Requested-With': 'XMLHttpRequest',
//   'target-url': 'http://bdapi.baizhoucn.com:2501',
//   token: '139.1726132386.1726218786.e2d31d6937736248761ba31f998a4a45'
// } form-data:  {}
// [2024-09-12 17:13:08.272] [info]  [post] /creditCard/getAccounts, headers: {
//   'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//   'X-Requested-With': 'XMLHttpRequest',
//   'target-url': 'http://bdapi.baizhoucn.com:2501',
//   token: '139.1726132386.1726218786.e2d31d6937736248761ba31f998a4a45'
// } form-data:  {}
// [2024-09-12 17:13:08.443] [info]  [post] /creditCard/getList, headers: {
//   'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
//   'X-Requested-With': 'XMLHttpRequest',
//   'target-url': 'http://bdapi.baizhoucn.com:2501',
//   token: '139.1726132386.1726218786.e2d31d6937736248761ba31f998a4a45'
// } form-data:  {}`)

const loading = ref(false)
const reload = () => {
    loading.value = true
    message.success('已重新加载')
    electron.files.readFile(logStore.file, (err, data) => {
        if (!err) {
            logStore.content = data
        }
        message.success('已重新加载')
        loading.value = false
    })
}

</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar title="日志查看" :close-type="3" :only-close="true">
                <el-button text="text" link :loading="loading" @click="reload">
                    <template #loading>
                        <el-icon style="animation: loading-rotate 2s linear infinite;" size="large">
                            <Refresh />
                        </el-icon>
                    </template>
                    <span class="bold black">日志查看</span>
                    <el-icon v-if="!loading" size="large">
                        <Refresh />
                    </el-icon>
                </el-button>
            </Toolbar>
        </div>
        <div class="content">
            <MonaCoEditor :content="content"></MonaCoEditor>
        </div>

    </div>
</template>

<style scoped>
.bold {
    font-weight: 600;
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