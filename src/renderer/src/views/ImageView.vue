<script setup>
import { onMounted, computed, ref, watch } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import { useImageStore } from '@/stores/images'
import { storeToRefs } from "pinia"
const imgStore = useImageStore()
const { urls, index: currentIndex, render } = storeToRefs(imgStore)
const imgRef = ref(null)


watch(render, () => {
    imgRef.value.setActiveItem(currentIndex.value)
})


const onSwitch = index => {
    currentIndex.value = index
}

const title = computed(() => {
    return `图片查看 ${currentIndex.value + 1}/${urls.value.length}`
})


</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar :title="title" :close-type="2"></Toolbar>
        </div>
        <div class="content">
            <el-image-viewer ref="imgRef" :url-list="urls" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2"
                :initial-index="currentIndex" @switch="onSwitch">
            </el-image-viewer>
        </div>

    </div>
</template>

<style scoped>
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