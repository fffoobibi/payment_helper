<script setup>
import { reactive, ref, watch, onActivated } from 'vue'
import { useAccountStore, useUserStore } from "@/stores"
import { timestampToFormattedString, numberFmt, subNumbers, formatDate } from "@/utils/format"
import { useClient } from "@/utils/client"
import { setUpCapture, setUpExportToExcel } from "@/utils/tools"
import { computedAsync } from "@vueuse/core"
import api from "@/api"
import { computed } from 'vue'
import message from '@/utils/message'
import CreditCardWriteOff from './CreditCardWriteOff.vue'
const store = useUserStore()
const { height, width } = useClient()


const accountsLoading = ref(true)
const accounts = computedAsync(async () => {
    try {
        const resp = await api.creditCard.getAccounts({ user_id: store.user.id })
        const rs = resp.list
        if (rs.length) {
            queryForm.search.account_id = rs[0].account_id
        }
        return rs
    } catch (error) {
        return []
    }
}, [], accountsLoading)

const selectable = row => row.is_review == 0
const checkRows = ref([])
const dialog = reactive({
    visible: false,
})

watch(accountsLoading, () => {
    onSearch(1, null)
})
const exportLoading = ref(false)
const saveAsExcel = setUpExportToExcel(() => {
    exportLoading.value = false
})

const exportToExcel = async () => {
    try {
        exportLoading.value = true
        const post = { ...queryForm.search }
        post.year_month = formatDate(post.year_month, { trancate: 'm', sep: "" })
        const resp = await api.creditCard.exportList(post)
        const saveData = resp.list.map(v => {
            return {
                '创建时间': timestampToFormattedString(v.create_time),
                '创建人': v.creator,
                '所属公司': v.company_name,
                '所属部门': v.department_name,
                '钉钉编号': v.approval_number,
                '采购单号': v.purchase_number,
                '金额': v.origin_total_amount,
                '人民币总金额': v.cny_total_amount,
                '账号名称': v.account_name,
                '核销状态': v.is_review == 1 ? '已核销' : '未核销',
                '核销人': v.operator,
                '核销时间': timestampToFormattedString(v.update_time),
                '备注': v.note,
            }
        })
        saveAsExcel(saveData, '信用卡导出记录' + formatDate(new Date, { sep: '_', sepLast: "_" }) + '.xlsx',)
    } catch (err) {
        exportLoading.value = false
    }
}

const queryForm = reactive({
    page: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
    },
    search: {
        year_month: new Date,
        account_id: null,
        content: '',
        is_review: ''
    },
    searching: true,
    statistics_currency: null,
    statistics_pending: null,
    statistics_settled: null,
    hasSearch: false,
    tableData: [],
})

const onSearch = async (page = null, pageSize = null) => {
    if (page != null) {
        queryForm.search.page = page
        queryForm.page.currentPage = page
    } else {
        queryForm.search.page = queryForm.page.currentPage
    }
    if (pageSize != null) {
        queryForm.search.limit = pageSize
    } else {
        queryForm.search.limit = queryForm.page.pageSize
    }
    queryForm.searching = true
    const post = { ...queryForm.search }
    post.year_month = formatDate(post.year_month, { trancate: 'm', sep: "" })
    try {
        const resp = await api.creditCard.getList(post)
        queryForm.tableData = resp.list
        queryForm.statistics_currency = resp.statistics_currency
        queryForm.statistics_pending = numberFmt(resp.statistics_pending)
        queryForm.statistics_settled = numberFmt(resp.statistics_settled)
        queryForm.page.totalCount = resp.count
        queryForm.page.pageSize = resp.limit
    } catch (err) {

    } finally {
        queryForm.searching = false
    }

}


watch(() => queryForm.page.currentPage, async () => {
    await onSearch()
})

watch(() => queryForm.page.pageSize, async () => {
    queryForm.page.currentPage = 1
    await onSearch(1, null)
})

const queryFormRef = ref(null)
const tableHeight = computed(
    {
        get: () => {
            const h = queryFormRef.value?.$el?.clientHeight || 0
            width.value + 1
            let th
            if (h > 60) {
                th = 270
            } else {
                th = 220
            }
            if (queryForm.page.totalCount == 0) {
                return height.value - th
            }
            return height.value - th
        },
        set: val => {
            width.value = width.value - 1
        }
    })

onActivated(() => {
    tableHeight.value = 1
})

const onWriteOff = () => {
    if (checkRows.value.length == 0) {
        message.warning('请选择要核销的记录')
        return
    }
    dialog.visible = true
}

const onTableCheck = val => {
    checkRows.value = val
    console.log(val)
}

const onClose = () => {
    dialog.visible = false
    onSearch()
}
</script>

<template>
    <Layout>
        <template #layout-main-inner>
            <Header>
                <template #title>
                    <h4>信用卡管理
                    </h4>
                </template>

                <template #option>
                    <el-space>
                        <span class="red" style="font-size: 10pt;padding-left: 10px;margin-right: 10px;"> *注:
                            每月5号之前核销上月消费金额</span>
                    </el-space>
                </template>
            </Header>

            <div class="pannel">
                <el-form :inline="true" :model="queryForm.search" class="query-form-inline" ref="queryFormRef">
                    <el-form-item label="账户" v-loading="accountsLoading">
                        <el-select v-model="queryForm.search.account_id" placeholder="请选择" default-first-option>
                            <el-option v-for="(item, index) in accounts" :key="index" :label="item.account_name" :value="item.account_id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-date-picker v-model="queryForm.search.year_month" type="month"
                            placeholder="选择月份" />
                    </el-form-item>
                    <el-form-item>
                        <el-input v-model="queryForm.search.content" placeholder="钉钉编号/采购单号" style="width: 180px" clearable></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-select v-model="queryForm.search.is_review" style="width: 120px">
                            <el-option label="全部" value=" "></el-option>
                            <el-option label="待核销" value="0"></el-option>
                            <el-option label="已核销" value="1"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
                        <el-button type="success" :loading="exportLoading" @click="exportToExcel">
                            <el-icon class="iconfont icon-Excel" :size="17"></el-icon>导出
                        </el-button>
                        <el-button type="warning" @click="onWriteOff">核销</el-button>
                    </el-form-item>
                    <el-form-item>
                        <div v-show="!queryForm.searching">
                            <span
                                style="background-color: #6DBEAD; color: white; padding: 4px 4px; margin-right: 10px; font-size: 10pt">待核销总额
                                {{ numberFmt(queryForm.statistics_pending) + " " + queryForm.statistics_currency
                                }}</span>
                            <span
                                style="background-color: #9BA9E6; color: white; padding: 4px 4px; font-size: 10pt">核销总额
                                {{ numberFmt(queryForm.statistics_settled) + " " + queryForm.statistics_currency
                                }}</span>
                        </div>

                    </el-form-item>
                </el-form>

                <el-table :data="queryForm.tableData" :height="tableHeight" highlight-current-row
                    :show-header="queryForm.page.totalCount > 0" @selection-change="onTableCheck" row-key="id">
                    <template #empty>
                        <el-empty :image-size="200" />
                    </template>
                    <el-table-column type="selection" :selectable="selectable" width="40" />
                    <el-table-column label="摘要信息" width="240">
                        <template #default="{ row }">
                            <div>
                                <div>钉钉编号： <span class="user-black">{{ row.approval_number }}</span></div>
                                <div>采购单号： <span class="user-black">{{ row.purchase_number }}</span></div>
                                <div>创建人：<span class="user-black">{{ row.creator + " - " + row.department_name }}</span>
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="金额">
                        <template #default="{ row }">
                            <div>金额：<span class="user-black bold">{{ numberFmt(row.origin_total_amount)
                                    }}</span><span>{{ " " +
                    row.currency }}</span></div>
                            <div>人民币：<span class="user-black bold">{{ numberFmt(row.cny_total_amount) }}</span><span>{{
                    " " + "CNY" }}</span></div>
                            <div>状态：<span :class="['user-black', row.is_review == 1 ? 'green' : 'red']">{{ row.is_review
                    == 1 ?
                    '已核销' : '未核销' }}</span></div>
                        </template>
                    </el-table-column>
                    <el-table-column label="时间">
                        <template #default="{ row }">
                            <div>创建时间：<span class="user-black">{{ timestampToFormattedString(row.create_time) }}</span>
                            </div>
                            <div v-if="row.is_review == 1">核销时间：<span class="user-black">{{
                    timestampToFormattedString(row.update_time) }}</span></div>
                        </template>
                    </el-table-column>
                    <el-table-column label="备注">
                        <template #default="{ row }">
                            <div class="user-black">{{ row.note }}</div>
                        </template>
                    </el-table-column>

                </el-table>

                <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px"
                    v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
                    v-model:page-size="queryForm.page.pageSize" background="true" :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper" :total="queryForm.page.totalCount" />
            </div>

        </template>
    </Layout>

    <el-dialog title="信用卡核销明细" v-model="dialog.visible" width="90%" destroy-on-close>
        <CreditCardWriteOff :rows="checkRows" @close="onClose" />
    </el-dialog>

</template>


<style scoped>
h4 {
    padding: 0 10px;
    color: #333;
    font-weight: bold;
}

.pannel {
    padding: 10px;
}
.el-form--inline .el-form-item {
    margin: 0 8px 8px 0;
}
:deep(.el-date-editor) {
    width: 120px;
}
.el-form--inline .el-select {
    width: 150px;
}

.option-add {
    padding-right: 10px;
}

.black {
    color: black
}

.transparent {
    color: transparent
}

.red {
    color: red !important
}

.green {
    color: green !important
}

.user-black {
    color: black;
    user-select: text
}

.bold {
    font-weight: bold
}

.audit {
    background-image: url('../assets/images/shenpi.svg');
    background-repeat: no-repeat;
    background-position: 80% 50%;
    background-size: 50px 50px;
}

:deep(.el-input-number .el-input__inner) {
    text-align: left;
}
</style>