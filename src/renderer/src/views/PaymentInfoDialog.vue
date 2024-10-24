<script setup>
import { onMounted, ref, computed, nextTick } from "vue"
import Toolbar from '@/components/Toolbar.vue'
import PaymentInfo from "./PaymentInfo.vue"
import { useDialogStore } from "@/stores/index"
import { useClient } from "../utils/client"
import logger from "../utils/logger"
import { toRaw } from "vue"
import { isDev } from "../utils/tools"

const { height } = useClient()
const dialogStore = useDialogStore()

const paymentRef = ref(null)
const immediate = computed(() => {
    if (isDev) {
        return true
    }
    return false
})

onMounted(() => {
    if (!isDev) {
        setTimeout(() => {
            paymentRef.value.fetchData()
        }, 200)
    }
})

</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar :close-type="6" :only-close="false" mode="custom" :show-records="false" force-pin >
                <span style="margin-left: -20px; font-weight: bold">信息查看</span>
           
            </Toolbar>
        </div>
        <el-scrollbar :height="height - 32">
            <div class="content">
                <PaymentInfo :immediate="immediate" ref="paymentRef" :detail-id="dialogStore.dynamic.detailId"
                    mode="view" class="w-full">
                </PaymentInfo>
            </div>
        </el-scrollbar>


    </div>
</template>

<style scoped>
:global(#app) {
    border: 1px solid rgb(207, 207, 207);
}

:deep(.el-progress__text) {
    font-size: 10pt !important
}

.bold {
    font-weight: 600;
}

.label {
    font-size: 10pt;
    color: gray
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
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    flex: 1;
    gap: 20px;
    width: 100%;
    padding: 10px;
    padding-left: 15px;
    padding-right: 15px;
    border: none !important;
    height: 100%;
}

:deep(.drag) {
    padding: 2px 0 0 40px;
    font-size: 10pt !important;
    color: black;
    text-align: left;
    font-weight: bold
}
</style>