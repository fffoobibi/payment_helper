<script setup>
import EventBus from "../utils/eventbus"
import { ref, computed, watch, onMounted } from "vue"
import logger from "../utils/logger"
import {useLocalConfig} from "../stores/config"

const cfg = useLocalConfig()
EventBus.on('close', ()=>{
    logger.info('close by envent')
})
onMounted(()=>{
    console.log('user ==> ', cfg.select)
})
const props = defineProps({
    identify: String,
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
    const profile = cfg.select[props.identify] ?? {}
    const arr = props.data.map(v => {
        const a = { ...v }
        a.__order = profile[v.id] ?? 0
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
    if (index > -1) {
        _d.value[index].__order += 1
        console.log('find ==>', index,)
        const profile = cfg.select[props.identify]
        if(!profile){
            cfg.select[props.identify] = {}
        }
        cfg.select[props.identify][_d.value[index].id] = _d.value[index].__order
        cfg.updateSelect()
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