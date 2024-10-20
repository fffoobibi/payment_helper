<script setup>
import zhCN from "x-data-spreadsheet/src/locale/zh-cn";
import Toolbar from "../components/Toolbar.vue";
import { ref, onMounted, computed, onUnmounted } from "vue"
import Spreadsheet from "x-data-spreadsheet";
import { useClient } from "@/utils/client"
import { useExcelStore } from "@/stores/index"
import { useLocalConfig } from "@/stores/config"
import { toRaw } from "vue"
import { getExcelColumnLetter } from "../utils/tools";
import message from "../utils/message";
const { height } = useClient()
const cfgStore = useLocalConfig()
Spreadsheet.locale("zh-cn", zhCN);

/**
 * @type {Spreadsheet}
*/
let xs
const ws = useExcelStore()
const toolBar = ref(null)
const sheetContainer = ref(null)
const currentOffSet = ref([0, 0])
const currentRange = ref(
    {
        eci: 0,
        eri: 0,
        sci: 0,
        sri: 0,
        w: 0,
        h: 0
    })

// const currentOffSet = ref(null)
// const currentRange = ref(null)

const menuRef = ref(null)
const isPaste = ref(false)

const styles = computed(() => {
    const rs = {}
    Object.keys(cfgStore.excelColors).forEach((field, index) => {
        const v = cfgStore.excelColors[field]
        rs[field] = { color: v.color, styleIndex: index, col: v.col }
    })
    return rs
})

const colToField = computed(() => {
    const cf = {}
    Object.keys(cfgStore.excelColors).forEach((k, index) => {
        const v = cfgStore.excelColors[k]
        if (v.col !== undefined) {
            cf[v.col] = { field: k, styleIndex: index, col: v.col }
        }
    })
    return cf
})

const isInt = v => {
    return !isNaN(parseInt(v))
}

const getFormatedData = () => {
    const s = currentRange.value.sri
    const e = currentRange.value.eri
    const range = []
    for (let i = s; i <= e; i++) {
        range.push(i)
    }

    const colToField = {}
    const excelColors = cfgStore.excelColors
    Object.keys(excelColors).forEach((k, index) => {
        const v = excelColors[k]
        if (v.col !== undefined) {
            colToField[v.col] = k
        }
    })
    const d = xs.getData()
    const rowKey = Object.keys(d[0].rows).filter(x => {
        return isInt(x) && range.includes(parseInt(x))
    })
    const rs = []
    rowKey.forEach(k => {
        const rowResult = {}
        Object.keys(colToField).forEach(key => {
            rowResult[colToField[key]] = d[0].rows[k].cells[key]?.text ?? ''
        })
        rs.push(rowResult)
    })
    if (rs.length) {
        electron.sendSelectData(rs)
        console.log('rs ===> ', rs);
        toolBar.value.onClose()
    }else{
        message.warning('请选中有效数据!')
    }

}

const getStyleIndex = c => {
    return colToField.value[c]?.styleIndex
}

const setCellStyle = (ri, ci, styleIndex) => {
    // const target_data = xs.datas.find(it => it.name === 'Sheet1');
    //设置行元素( ri  ci 为单元格坐标)
    const r = parseInt(ri)
    const c = parseInt(ci)
    xs.datas[0].rows.setCell(r, c, { style: styleIndex }, 'format');
}

const setColumnStyle = (col, styleIndex, render = true) => {
    const d = xs.getData()
    const rowKey = Object.keys(d[0].rows).filter(x => isInt(x))
    rowKey.forEach(k => {
        setCellStyle(k, col, styleIndex)
    })
    if (render) {
        xs?.reRender()
    }
}

const onPaste = (e) => {
    // console.log('paste ');
    isPaste.value = true
}

const onCellsSelected = (cell, params) => {
    // console.log('cell , ', params)
    currentRange.value = params
}

const onCellSelected = (cell, ...params) => {
    // console.log('cell selected, ', cell, params)
    currentOffSet.value = params
}

const onCellEdited = (v, r, c) => {
    const info = colToField.value[c]
    // console.log('ccc ', v, r, c, colToField.value);
    if (info) {
        setCellStyle(r, c, info.styleIndex)
    }
}

const fresh = (all = false) => {
    const ss = {}
    Object.keys(styles.value).forEach(k => {
        const r = styles.value[k]
        if (r.col !== undefined) {
            ss[r.col] = r.styleIndex
        }
    })
    for (let i = 0; i < 30; i++) {
        if (ss[i] !== undefined) {
            setColumnStyle(i, ss[i], false)
        } else {
            setColumnStyle(i, styles.value.normal.styleIndex, false)
        }
    }
    xs.reRender()
}

const onChange = data => {
    if (isPaste.value) {
        fresh()
    }
    isPaste.value = false
}

onMounted(() => {
    xs = new Spreadsheet("#x-spreadsheet-demo", {
        mode: "edit",
        showToolbar: false,
        showGrid: true,
        showContextmenu: false,
        showBottomBar: true,
        view: {
            height: () => height.value - 60,
        },
        style: {
            bgcolor: "#ffffff",
            align: "left",
            valign: "middle",
            textwrap: false,
            strike: false,
            underline: false,
            color: "#0a0a0a",
            font: {
                name: "Helvetica",
                size: 10,
                bold: false,
                italic: false,
            },
        },
        col: {
            len: 100
        }
    })
    xs.loadData(ws.excelData)
    xs.on('cells-selected', onCellsSelected)
    xs.on('cell-selected', onCellSelected)
    xs.on('cell-edited', onCellEdited)
    xs.change(onChange)
    window.addEventListener("paste", onPaste, true);
})

onUnmounted(() => {
    xs = null
    window.removeEventListener('paste', onPaste)
})

const convs = {
    'approval_number': '钉钉编号',
    'account_id': '银行账号',
    'receiving_account': '收款账号',
    'transaction_number': '交易流水号',
    'note': '备注',
    'currency': '币种',
    'origin_total_amount': '金额'
}
const menuItems = computed(() => {
    return Object.keys(cfgStore.excelColors).map(k => {
        const v = cfgStore.excelColors[k]
        if (k === 'normal') return null
        const ret = {
            label: "设置该列为" + convs[k],
            color: v.color,
            name: convs[k],
            id: k
        }
        if (v.col !== undefined) {
            ret.name += " " + getExcelColumnLetter(v.col + 1)
        }
        return ret
    }).filter(v => v)

})

const menuItemClick = (item) => {
    if (item.id) {
        const r = styles.value[item.id]
        if (r.col !== undefined) {
            Object.keys(cfgStore.excelColors).forEach(k => {
                if (k !== item.id) {
                    const a = cfgStore.excelColors[k]
                    if (a.col == currentOffSet.value[1]) {
                        cfgStore.excelColors[k] = { color: a.color }
                    }
                }
            })
            setColumnStyle(r.col, styles.value.normal.styleIndex)
        }
        cfgStore.excelColors[item.id] = { col: currentOffSet.value[1], color: item.color }
        cfgStore.updateExcelColors(cfgStore.excelColors)
        electron.sendExcelColorData(toRaw(cfgStore.excelColors))
        setColumnStyle(currentOffSet.value[1], getStyleIndex(currentOffSet.value[1]))
    }
}

const showPolicy = (x, y, dx, dy, trigger) => {
    trigger()
}

</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar title="批量打款" :close-type="5" :only-close="true" ref="toolBar" mode="custom">
                <!-- <template #options>
                    <el-space>
                        <el-button link @click="getData">导出</el-button>
                    </el-space>
                </template> -->
            </Toolbar>
        </div>
        <ContextMenu ref="menuRef" :menu-items="menuItems" :target-element="sheetContainer" @item-click="menuItemClick"
            @judge-show="showPolicy">
            <template #label="{ item }">
                <el-space>
                    <span class="dot" :style="{ backgroundColor: item.color }"></span>{{ item.label }}
                </el-space>
            </template>
        </ContextMenu>
        <div
            style="height: 30px; display: flex; justify-content: flex-start; width: 100%;align-items: center; gap: 5px">
            <template v-for="(item, index) in menuItems" style="font-size: 9pt;color:gray" :key="index">
                <el-button link><span class="dot" :style="{ backgroundColor: item.color, marginRight: '3px' }"></span>{{
                item.name }}</el-button>
            </template>
            <!-- <el-button type="danger" link @click="fresh">重置</el-button> -->
            <el-button size="default" link @click="getFormatedData" type="primary">
                导出选中行
            </el-button>
        </div>
        <div class="content" ref="sheetContainer" id="x-spreadsheet-demo"></div>
    </div>
</template>

<style scoped>
:global(#app) {
    border: 1px solid lightgray
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    text-align: center;
}

.bold {
    font-weight: 600;
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
    justify-content: center;
    align-items: center;
    /* flex: 1; */
    width: 100%;
    height: calc(100vh - 60px);
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