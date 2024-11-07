<script setup>
import EventBus from "../utils/eventbus"
import { ref, computed, watch } from "vue"

EventBus.on('close', ()=>{
    console.log('close by envent')
})
const props = defineProps({
    identify: [String, null],
    showMaxCount: {
        default: 5,
        type: Number
    },
    data: {
        type: Array,
        default: () => []
    }
})

const _d = ref([])
watch(() => props.data, () => {
    const arr = props.data.map(v => {
        const a = { ...v }
        a.__order = 0
        return a
    })
    _d.value.splice(0)
    _d.value.push(...arr)
})

const orders = computed(() => {
    return _d.value.sort((x, y) => y.__order - x.__order)
})

const change = v => {
    const index = _d.value.findIndex(it => it.value == v)
    console.log('value  ', index)
    if (index > -1) {
        _d.value[index].__order += 1
        console.log('find ==>', index,)
    }
}
</script>
<template>
    <el-select v-bind="$attrs" @change="change">

        <template v-if="$slots.default && !data.length">
            <slot></slot>
        </template>
        <template v-else>
            <el-option v-for="(item, index ) in orders" :key="index" :label="item.label" :value="item.value">
            </el-option>
        </template>
        <template #header>
            <span class='t-red'> fuck</span>
        </template>

        <template v-slot:label="data">
            <slot name="label" v-bind="data"></slot>
        </template>
    </el-select>
</template>