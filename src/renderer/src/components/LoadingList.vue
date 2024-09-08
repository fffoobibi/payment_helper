<template>
    <div class="infinite-scroll-container" ref="scrollContainer" v-loading="firstLoading && loading"
        @wheel="handleWheel" element-loading-text="加载中" element-loading-background="transparent">
        <div v-if="empty" style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <slot name="empty">
                <el-empty :image-size="200" />
            </slot>
        </div>
        <div v-else>
            <ul>
                <li v-for="item in items" :key="item.id">
                    <slot :info="item">
                        {{ item }}
                    </slot>
                </li>
            </ul>
            <slot name="noMoreData">
                <div v-if="noMoreData" class="no-more-data-indicator">无更多数据</div>
            </slot>
            <div v-if="loading && !firstLoading" style="display:flex;justify-content: center; align-items:center">
                <el-button :loading="loading" link type="info" size="large">加载中...</el-button>
            </div>
            <div v-if="error && !firstLoading" style="display:flex;justify-content: center; align-items:center">
                <span style="font-size: 9pt !important; color:red">加载失败</span>
            </div>
            <div v-if="error && firstLoading" class="first-loading-error">
                <el-result icon="error" title="加载失败">

                </el-result>
            </div>
            <el-backtop :right="100" :bottom="100" target="div" />
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import _ from 'lodash'

const props = defineProps({
    height: [Number, null],
    limit: {
        type: Number,
        default: 10
    },
    fetch: {
        type: Function,
        required: true
    },
    stopLoad: {
        type: Function,
        required: true
    },
    maps: {
        type: Object,
        default: () => {
            return { data: 'list', total: 'count' }
        }
    }
})
const limit = ref(props.limit)
const firstLoading = ref(true)
const loadingCount = ref(0)
const emit = defineEmits(["on-fetch-done", "on-fetch-start"])
const items = ref([])
const loading = ref(false)
const page = ref(1)
const error = ref(false)
const errorMessage = ref('')
const noMoreData = ref(false)
const scrollContainer = ref(null)
const totalCount = ref(null)

const fetchData = async () => {
    if (loading.value || noMoreData.value) {
        return
    }
    loading.value = true
    error.value = false
    loadingCount.value++
    try {
        emit('on-fetch-start', { limit: limit.value, page: page.value, error: null })
        const response = await props.fetch(page.value, limit.value)
        if (props.stopLoad(response, page.value)) {
            const rs = response[props.maps.data]
            const total = response[props.maps.total]
            emit('on-fetch-done', { total, page: page.value })
            totalCount.value = total
            items.value.push(...rs.map((v, index) => {
                v.NUMBER = (page.value - 1) * limit.value + index + 1
                return v
            }))
            page.value += 1;
            noMoreData.value = true
        } else {
            const rs = response[props.maps.data]
            const total = response[props.maps.total]
            emit('on-fetch-done', { total, page: page.value, error: null })
            totalCount.value = total
            items.value.push(...rs.map((v, index) => {
                v.NUMBER = (page.value - 1) * limit.value + index + 1
                return v
            }))
            page.value += 1
        }
        firstLoading.value = false
    } catch (err) {
        if (loadingCount.value > 1) {
            firstLoading.value = false
        }
        emit('on-fetch-done', { total: null, page: page.value, error: err })
        console.error('Error fetching data', err)
        error.value = true
        errorMessage.value = '加载失败'
    } finally {
        loading.value = false
    }
};

const empty = computed(() => {
    if (loading.value === false && items.value.length === 0 && !error.value) {
        return true
    } else {
        return false
    }
})


const handleWheel = _.debounce(async (event) => {
    // const container = scrollContainer.value
    const { clientHeight, scrollHeight, scrollTop } = event.target
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    if (event.deltaY > 0 && isAtBottom && !loading.value) {
        await fetchData()
    }
}, 200)


const reload = () => {
    const itemLength = items.value.length
    firstLoading.value = true
    loadingCount.value = 0
    items.value.splice(0, itemLength)
    loading.value = false
    page.value = 1
    error.value = false
    errorMessage.value = ''
    noMoreData.value = false
    fetchData()
}

onMounted(() => {
    fetchData()
})

const update = (number, callback) => {
    if (items.value.length && items.value[number - 1]) {
        const d = items.value[number - 1]
        callback(d)
    }
}

defineExpose({
    reload,
    update
})

</script>

<style scoped>

:deep(.el-result) {
    /* height: calc(100vh - 130px)!important; */
    overflow-y: auto;
    height: v-bind("props.height + 'px'") !important;
}

.infinite-scroll-container {
    overflow-y: auto;
    height: v-bind("props.height + 'px'");
}

ul {
    padding: 0;
    margin: 0;
    list-style: none;
}

/* 设置滚动条的宽度 */
::-webkit-scrollbar {
    width: 6px;
}

/* 设置滚动条的滑块的颜色和圆角 */
::-webkit-scrollbar-thumb {
    background: #d8d8d8;
    border-radius: 10px;
}

/* 设置滚动条的轨道的颜色 */
::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
    background-color: #c6c6c6;
}


.loading-indicator {
    text-align: center;
}

.error-indicator {
    color: red;
    text-align: center;
}

.no-more-data-indicator {
    text-align: center;
    color: gray;
    background-color: white;
    padding: 5px;
    border-radius: 5px;
    font-size: 9pt;
}
</style>