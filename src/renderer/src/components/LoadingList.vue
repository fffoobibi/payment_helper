<template>
    <div class="infinite-scroll-container" @scroll="handleScroll" ref="scrollContainer" v-loading="loading">
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
            <div v-if="error" class="error-ind">{{ errorMessage }}</div>
            <slot name="noMoreData">
                <div v-if="noMoreData" class="no-more-data-indicator">无更多数据</div>
            </slot>

        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import _ from 'lodash'

const props = defineProps({
    height: [Number, null],
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

console.log('props ', props);
const emit = defineEmits(["on-fetch-done"])
const items = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(10)
const error = ref(false)
const errorMessage = ref('')
const noMoreData = ref(false)
const scrollContainer = ref(null)
const totalCount = ref(null)

const fetchData = async () => {
    if (loading.value || noMoreData.value) return;
    loading.value = true;
    error.value = false;
    try {
        const response = await props.fetch(page.value, limit.value)
        if (props.stopLoad(response, page.value)) {
            const rs = response[props.maps.data]
            const total = response[props.maps.total]
            emit('on-fetch-done', { total, page: page.value })
            totalCount.value = total
            items.value.push(...rs)
            page.value += 1;
            noMoreData.value = true
        } else {
            const rs = response[props.maps.data]
            const total = response[props.maps.total]
            emit('on-fetch-done', { total, page: page.value })
            totalCount.value = total
            items.value.push(...rs)
            page.value += 1
        }
    } catch (error) {
        console.error('Error fetching data', error);
        error.value = true;
        errorMessage.value = 'Failed to load data! Please try again later.';
    } finally {
        loading.value = false;
    }
};

const empty = computed(() => {
    if (loading.value === false && items.value.length === 0) {
        return true
    } else {
        return false
    }
})

const handleScroll = _.debounce(async (event) => {
    const { clientHeight, scrollHeight, scrollTop } = event.target
    console.log(clientHeight, scrollHeight)
    if (scrollTop + clientHeight >= scrollHeight - 4) {
        await fetchData()
    } else {
        console.log(scrollTop, clientHeight, scrollHeight, scrollTop + clientHeight)
    }

}, 200)

function loadMoreItems() {
    if (loading.value) {
        return; // 如果已经在加载中，则不再触发加载
    }
    loading.value = true;
    setTimeout(() => {
        const currentLength = items.value.length;
        const newItems = Array.from({ length: 2 }, (_, index) => ({
            id: currentLength + index,
            text: `Item ${currentLength + index + 1}`
        }));
        items.value = [...items.value, ...newItems];
        loading.value = false;

        // 检查是否需要继续加载
        const container = scrollContainer.value;
        if (container) {
            const { clientHeight, scrollHeight } = container;
            if (clientHeight >= scrollHeight) {
                loadMoreItems(); // 如果容器未被填满，继续加载
            }
        }
    }, 1000);
}
const flag = ref(false)

watch(flag, () => {
    fetchData()
})
const reload = () => {
    console.log('reload ....');
    const itemLength = items.value.length
    items.value.splice(0, itemLength)
    loading.value = false
    page.value = 1
    limit.value = 10
    error.value = false
    errorMessage.value = ''
    noMoreData.value = false
    flag.value = !flag.value
}

// Fetch initial data when component is mounted
onMounted(() => {
    console.log('fetch ===> ');
    fetchData()
})

defineExpose({
    reload
})

</script>

<style scoped>
.infinite-scroll-container {
    /* height: 500px; */
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