<script setup>
import { ref, computed, watchEffect } from "vue"
import { useLocalConfig } from "../stores/config"

const cfg = useLocalConfig()
// EventBus.on('close', () => {
//     logger.info('close by envent')
// })

const props = defineProps({
    identify: String,
    showMaxCount: {
        default: 5,
        type: Number
    },
    data: {
        type: Array,
        default: () => []
    },
    maps: {
        type: Object,
        default: () => ({ label: 'label', value: 'value' })
    }
})

const _d = ref([])
watchEffect(() => {
    const profile = cfg.select?.[props.identify] ?? {}
    const arr = props.data.map(v => {
        const a = { ...v }
        const vKey = props.maps.value
        a.__order = profile[v[vKey]] ?? 0
        return a
    })
    _d.value.splice(0)
    _d.value.push(...arr)
})

const orders = computed(() => {
    return _d.value.sort((x, y) => y.__order - x.__order)
})

const change = v => {
    const index = _d.value.findIndex(it => it[props.maps.value] == v)
    if (index > -1) {
        _d.value[index].__order += 1
        const profile = cfg.select[props.identify]
        if (!profile) {
            cfg.select[props.identify] = {}
        }
        cfg.select[props.identify][_d.value[index][props.maps.value]] = _d.value[index].__order
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
            <el-option v-for="(item, index ) in orders" :key="index" :label="item[maps.label]"
                :value="item[maps.value]">
            </el-option>
        </template>

        <template #label="data">
            <slot name="label" v-bind="data"></slot>
        </template>
    </el-select>
</template>