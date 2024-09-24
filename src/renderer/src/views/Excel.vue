<script setup>
import zhCN from "x-data-spreadsheet/src/locale/zh-cn";
import Toolbar from "../components/Toolbar.vue";
import { storeToRefs } from "pinia"
import { ref, onMounted, computed, onUnmounted } from "vue"
import Spreadsheet from "x-data-spreadsheet";
import { useClient } from "@/utils/client"
import { useWindowStore } from "@/stores/index"
import { useLocalConfig } from "@/stores/config"
const { height } = useClient()
const cfgStore = useLocalConfig()
Spreadsheet.locale("zh-cn", zhCN);

/**
 * @type {Spreadsheet}
*/
let xs
const ws = useWindowStore()
const sheetContainer = ref(null)

const getData = () => {
    const cells = xs.data.getSelectedCell()
    console.log('cells ', xs.getData())
}


const setCellStyle = (ri, ci, styleIndex) => {
    // const target_data = xs.datas.find(it => it.name === 'Sheet1');
    //设置行元素( ri  ci 为单元格坐标)
    xs.datas[0].rows.setCell(ri, ci, { style: styleIndex }, 'format');
    console.log(xs.datas);

}
const currentOffSet = ref(null)
const currentRange = ref(null)
const menuRef = ref(null)
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
    xs.on('cells-selected', (cell, params) => {
        console.log('cell , ', params)
        currentRange.value = params
    })
    xs.on('cell-selected', (cell, ...params) => {
        console.log('cell selected, ', cell, params)
        currentOffSet.value = params
    })
    xs.on('cell-edited', (v, r, c) => {
        const info = colToField.value[c]
        console.log('ccc ', v, r, c, colToField.value);
        // if(info){
        //     setCellStyle(r, c, info.styleIndex)
        // }
    })
    xs.change(data=>{
        // xs.sheet.loadData(data)
        console.log('change ', data)
    })

    window.addEventListener("paste", (e)=>{
        console.log('paste ');
    }, true);

})

onUnmounted(() => {
    xs = null
})

const colToField = computed(()=>{
    const cf = {}
    Object.keys(cfgStore.excelColors).forEach((k, index) => {
        const v = cfgStore.excelColors[k]
        if (v.col !== undefined) {
            cf[v.col] = {field: k, styleIndex: index, col: v.col}
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
    console.log('rs ===> ', rs);

}

const menuItems = computed(() => {
    return [
        {
            label: '添加选中行数据',
            color: 'transparent',
        },
        {
            label: '设置该列为钉钉编号',
            color: '#5B9BD5',
            name: "钉钉编号",
            id: 'approval_number'
        },
        {
            label: '设置该列为银行账号',
            color: '#FFC000',
            name: "银行账号",
            id: 'account_id'
        },
        {
            label: '设置该列为收款账号',
            color: '#92D050',
            name: "收款账号",
            id: 'receiving_account'

        },
        {
            label: '设置该列为交易流水号',
            color: '#8497B0',
            name: "交易流水号",
            id: 'transaction_number'
        },
        {
            label: '设置该列为备注',
            color: '#F4B084',
            name: "备注",
            id: 'note'

        },
        {
            label: '设置该列为币种',
            color: 'red',
            name: "币种",
            id: 'currency'
        },
        {
            label: '设置该列为金额',
            color: 'blue',
            name: "金额",
            id: 'origin_total_amount'
        },
    ]
})

const menuItemClick = (item) => {
    console.log('item ', item);
    if (item.id) {
        console.log(cfgStore.excelColors)
        console.log('cftt', { col: currentOffSet.value[1], color: item.color })
        cfgStore.excelColors[item.id] = { col: currentOffSet.value[1], color: item.color }
        cfgStore.updateExcelColors()
    }
    // xs.reRender(); // 重新渲染以应用样式
}

const showPolicy = (x, y, dx, dy, trigger) => {
    trigger()
}
</script>

<template>
    <div class="main">
        <div style="height: 30px; width: 100%;">
            <Toolbar title="批量打款" :close-type="5" :only-close="true">
                <template #options>
                    <el-space>
                        <el-button link @click="getData">导出</el-button>
                    </el-space>
                </template>
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
            <div v-for="(item, index) in menuItems" style="font-size: 9pt;color:gray" :key="index">
                <el-button link><span class="dot" :style="{ backgroundColor: item.color, marginRight: '3px' }"></span>{{
                item.name }}</el-button>
            </div>
            <el-button size="small" link @click="getFormatedData">
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