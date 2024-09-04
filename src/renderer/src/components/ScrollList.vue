<template>
    <div class="infinite-scroll-container" @scroll="handleScroll">
        <ul>
            <li v-for="item in items" :key="item.id">{{ item.name }} </li>
        </ul>
        <div v-if="loading" class="loading-indicator">Loading...</div>
        <div v-if="error" class="error-ind">{{ errorMessage }}</div>
        <div v-if="noMoreData" class="no-more-data-indicator">No More Data</div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import _ from 'lodash';

// Define reactive variables
const items = ref([]);
const loading = ref(false);
const page = ref(1);
const error = ref(false);
const errorMessage = ref('');
const noMoreData = ref(false);

// Function to fetch data
const fetchData = async () => {
    if (loading.value || noMoreData.value) return;
    loading.value = true;
    error.value = false;
    try {
        const response = await axios.get(`https://api.example.com/data?page=${page.value}`);
        if (response.data.length === 0) {
            noMoreData.value = true;
        } else {
            items.value.push(...response.data);
            page.value += 1;
        }
    } catch (error) {
        console.error('Error fetching data', error);
        error.value = true;
        errorMessage.value = 'Failed to load data! Please try again later.';
    } finally {
        loading.value = false;
    }
};

// Function to handle scroll event
const handleScroll = _.debounce(async (event) => {
    const bottomReached = event.target.scrollHeight - event.target.scrollTop === event.targetHeight;
    if (bottomReached) {
        await fetchData();
    }
}, 200);

// Fetch initial data when component is mounted
onMounted(() => {
    fetchData()
})

</script>

<style scoped>
.infinite-scroll-container {
    height: 500px;
    overflow-y: auto;
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
}
</style>