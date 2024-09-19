<script setup>
import { onMounted } from "vue"
import { useRoute } from "vue-router"
import Toolbar from '@/components/Toolbar.vue';
import { useUpdateStore } from '@/stores/index'
const update = useUpdateStore()
import updater from "@/utils/update"
import { computed } from "vue";
const route = useRoute()
const download = () => {
    if (update.update_success) {
        console.log('send install ...');
        updater.install()
    } else {
        update.downloading = true
        updater.download()
    }
}

onMounted(() => {
    console.log('query', route.query);
    // updater.checkUpdates()
})

const showBar = computed(() => {
    return update.downloading || update.update_success
})
</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar :close-type="4" :only-close="true">
                <span style="margin-left: -20px; font-weight: bold">版本更新</span>
            </Toolbar>
        </div>
        <div class="content">
            <div v-if="update.canUpdate" style="width: 100%;">
                <p class="bold black" style="font-size: 14px;">发现新版本!</p>
                <p class='label'>版本：{{ "v" + update.version.version }}</p>
                <el-scrollbar v-if="(!update.downloading) && (!update.update_success)"
                    :height="update.downloading ? '50px' : '140px'">
                    <div style="font-size: 10pt; color:black" v-html="update.version.content">
                    </div>
                </el-scrollbar>

                <div v-if="showBar" style="display: flex; width: 100%;flex-direction: row;justify-content: flex-start">
                    <p class="label">进度：</p>
                    <el-progress :stroke-width="10" :percentage="update.percent" style="width:90%"
                        :status="update.update_success ? 'success' : ''" />
                </div>
                <p class="label" v-if="update.downloading">速度：<span class="label">{{ update.download_info }}</span>
                </p>
            </div>
            <div v-else style="text-align: center;">
                <p class="bold black">无可用更新</p>
            </div>
            <div style="flex:1; width: 100%; align-items: flex-end;">
                <div style="width: 100%;height:100%;display: flex; justify-content: flex-end; align-items: flex-end; ">
                    <el-button :type="update.update_success ? 'danger' : 'primary'" :loading="update.downloading"
                        @click="download">
                        {{ update.update_success ? "退出重启" : '更新' }}
                    </el-button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
:deep(.el-progress__text){
  font-size:10pt !important
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
}

:deep(.drag) {
    padding: 2px 0 0 40px;
    font-size: 10pt !important;
    color: black;
    text-align: left;
    font-weight: bold
}
</style>