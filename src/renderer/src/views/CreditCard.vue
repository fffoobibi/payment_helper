<script setup>
import { reactive, ref, watch, onActivated, computed } from 'vue'
import { useUserStore, useAccountStore } from "@/stores"
import { timestampToFormattedString, numberFmt, formatDate, until } from "@/utils/format"
import { useClient } from "@/utils/client"
import { setUpExportToExcel, useFutureControl } from "@/utils/tools"
import { computedAsync } from "@vueuse/core"
import api from "@/api"
import message from '@/utils/message'
import CreditCardWriteOff from './CreditCardWriteOff.vue'
import CreditCardReimbursement from './CreditCardReimbursement.vue'
const store = useUserStore()
const { height, width } = useClient()

const features = useFutureControl()
const bank = useAccountStore()
const accountsLoading = ref(true)
const accounts = computedAsync(async () => {
    try {
        const resp = await api.creditCard.getAccounts({ user_id: store.user.id })
        queryForm.search.account_id = resp.accounts.list[0].account_id
        return {
            accounts: resp.accounts.list,
            companies: resp.companies.list
        }
    } catch (error) {
        return []
    }
}, { accounts: [], companies: [] }, accountsLoading)


// 0 核销 1 复核
const mode = computed(() => {
    if (store.canCreditCardReview) {
        return 0
    }
    if (store.canCreditCardCheckReview) {
        return 1
    }

})

const modeTitle = computed(() => {
    if (mode.value === 0) {
        return "信用卡核销明细"
    } else if (mode.value === 1) {
        return "信用卡复核明细"
    }
    return ""
})

const selectable = row => {
    if (mode.value == 0) {
        return row.is_review == 0
    }
    else if (mode.value == 1) {
        return row.is_review == 1
    }
    return false
}

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
        if (!post.start_time && post.end_time) {
            post.start_time = formatDate(until(post.end_time, 90), { trancate: 'd' })
        }
        if (!post.end_time) {
            post.end_time = formatDate(new Date, { trancate: 'd' })
        }
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
                '核销状态': reviewMsg(v.is_review),
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
const shortcuts = [
    {
        text: '1周前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return start
        },
    },
    {
        text: '1月前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return start
        },
    },
    {
        text: '3月前',
        value: () => {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return start
        },
    },
]
const queryForm = reactive({
    page: {
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
    },
    search: {
        start_time: formatDate(shortcuts[1].value(), { trancate: 'd' }),
        end_time: formatDate(new Date, { trancate: 'd' }),
        account_id: null,
        company_id: [],
        content: '',
        is_review: ['0'],
    },
    searching: true,
    statistics_currency: null,
    statistics_pending: null,
    statistics_settled: null,
    hasSearch: false,
    tableData: [],

    editShow: false,
    edit: {
        note: '',
        payment_id: null
    }
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
    if (!post.start_time && post.end_time) {
        post.start_time = formatDate(until(post.end_time, 90), { trancate: 'd' })
    }
    if (!post.end_time) {
        post.end_time = formatDate(new Date, { trancate: 'd' })
    }
    post.company_id = post.company_id.join(',')
    post.is_review = post.is_review.join(',')
    try {
        const resp = await api.creditCard.getList(post)
        queryForm.tableData = resp.list
        queryForm.statistics_currency = resp.statistics_currency
        queryForm.statistics_pending = numberFmt(resp.statistics_pending)
        queryForm.statistics_settled = numberFmt(resp.statistics_settled)
        queryForm.page.totalCount = resp.count
        queryForm.page.pageSize = resp.limit
    } catch (err) {
        console.log('err ==> ', err);
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

watch(() => queryForm.search.account_id, async () => {
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
                th = 220
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

const selectedMsg = computed(() => {
    if (checkRows.value.length === 0) {
        return ''
    }
    return '已选择: ' + checkRows.value.length + "条记录"
})

const reviewMsg = (is_review) => {
    if (is_review == 0) {
        return "未核销"
    }
    else if (is_review === 1) {
        return "已核销"
    }
    else if (is_review === 2) {
        return "已复核"
    }
    return ""
}

const reviewClass = (is_review) => {
    if (is_review == 0) {
        return "red"
    }
    else if (is_review === 1) {
        return "green"
    }
    else if (is_review === 2) {
        return "blue"
    }
    return ""
}


const onWriteOff = () => {
    if (checkRows.value.length == 0) {
        const msg = mode.value == 0 ? '请选择要核销的记录' : '请选择要复核的记录'
        message.warning(msg)
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
const tabs = reactive({
    currentTab: '信用卡管理'
})

// 新增
const amountFormatter = value => `${value}`.replace(/[^\-?\d.]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
const amountParser = value => value.replace(/[^\-?\d.]/g, '')
const formAddShow = ref(false)
const formAddRef = ref(null)
const formAdd = reactive({
    currency: '',
    account_id: null,
    amount: '',
    note: ''
})
const addDetail = () => {
    formAdd.currency = ''
    formAdd.account_id = null
    formAdd.amount = ''
    formAdd.note = ''
    formAddShow.value = true
}

const onAddDetail = async () => {
    formAddRef.value.validate(async valid => {
        try {
            if (valid) {
                const post = { ...formAdd }
                api.creditCard.addDetail(post)
                formAddShow.value = false
                message.success("账单已添加")
                onSearch()
            }
        } catch (err) {

        }

    })

}

const rules = {
    account_id: [{ required: true, message: '请选择账号', trigger: 'blur' }],
    currency: [{ required: true, message: '请选择币种', trigger: 'blur' }],
    amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
    note: [{ required: true, message: '请填写备注', trigger: 'blur' }],
}

// 备注修改
const editNote = (row) => {
    queryForm.editShow = true
    queryForm.edit.note = row.note
    queryForm.edit.payment_id = row.payment_id
}

const onEditNote = async () => {
    try {
        await api.creditCard.modifyNote({ note: queryForm.edit.note, payment_id: queryForm.edit.payment_id })
        queryForm.editShow = false
        onSearch()
        message.success("备注已修改！")
    } catch (e) {

    }
}


const goto = (account_id, review_args, company_id) => {
    tabs.currentTab = '信用卡管理'
    queryForm.search.account_id = account_id
    queryForm.search.is_review = review_args ?? ['1', '2']
    queryForm.search.company_id = company_id
    onSearch()
}

</script>

<template>
    <Layout>
        <template #layout-main-inner>
            <el-tabs v-model="tabs.currentTab" type="border-card" class="bank-tabs">
                <el-tab-pane label="信用卡管理" name="信用卡管理">
                    <div class="pannel">
                        <el-form :inline="true" :model="queryForm.search" class="query-form-inline" ref="queryFormRef">
                            <el-form-item label="" v-loading="accountsLoading">
                                <el-select v-model="queryForm.search.account_id" placeholder="请选择" default-first-option style="width: 210px">
                                    <el-option v-for="(item, index) in accounts.accounts" :key="index"
                                        :label="item.account_name" :value="item.account_id"></el-option>
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <!-- <el-date-picker v-model="queryForm.search.year_month" type="month" placeholder="选择月份" /> -->
                                <el-date-picker style="width: 110px;margin-right:5px"
                                    v-model="queryForm.search.start_time" type="date" value-format="YYYY-MM-DD"
                                    format="YY/MM/DD" placeholder="开始" :shortcuts="shortcuts" />
                                <el-date-picker style="width: 110px" v-model="queryForm.search.end_time" type="date"
                                    value-format="YYYY-MM-DD" format="YY/MM/DD" placeholder="结束"
                                    :shortcuts="shortcuts" />

                            </el-form-item>
                            <el-form-item>
                                <el-select style="width: 170px" v-model="queryForm.search.company_id" multiple>
                                    <el-option v-for="item in accounts.companies" :label="item.company_name"
                                        :value="item.id"></el-option>
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-input v-model="queryForm.search.content" placeholder="钉钉编号/采购单号"
                                    style="width: 180px" clearable></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-select multiple max-collapse-tags="2" collapse-tags collapse-tags-tooltip
                                    v-model="queryForm.search.is_review" style="width: 230px">
                                    <!-- <el-option label="全部" value="0,1,2"></el-option> -->
                                    <el-option label="待核销" value="0"></el-option>
                                    <el-option label="已核销" value="1"></el-option>
                                    <el-option label="已复核" value="2"></el-option>
                                </el-select>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="onSearch(1, null)">查询</el-button>
                                <el-button type="primary" @click="addDetail">添加</el-button>
                                <el-button type="warning" @click="onWriteOff"
                                    v-if="store.canCreditCardReview">核销</el-button>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="danger" @click="onWriteOff"
                                    v-if="store.canCreditCardCheckReview">复核</el-button>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="success" :loading="exportLoading" @click="exportToExcel">
                                    导出
                                </el-button>
                            </el-form-item>
                            <el-form-item>
                                <div v-loading="queryForm.searching">
                                    <span
                                        style="background-color: #6DBEAD; color: white; padding: 4px 4px; margin-right: 10px; font-size: 10pt">待核销总额
                                        {{ numberFmt(queryForm.statistics_pending) + " " + queryForm.statistics_currency
                                        }}</span>
                                    <span
                                        style="background-color: #9BA9E6; color: white; padding: 4px 4px; font-size: 10pt">核销总额
                                        {{ numberFmt(queryForm.statistics_settled) + " " + queryForm.statistics_currency
                                        }}</span>
                                </div>
                                <div class="flex" style="position: fixed; top: 30px; right: 10px;z-index: 1000">
                                    <span class="t-red f-12 m-l-4 ">农行账单日17日，还款日6日, 工行账单日19日，还款日6日</span>
                                </div>
                                <span class="t-red m-l-4">{{ selectedMsg }}</span>

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
                                        <div>钉钉编号： <span class="user-black">{{ row.approval_number || "一一" }}</span>
                                        </div>
                                        <div>采购单号： <span class="user-black">{{ row.purchase_number || "一一" }}</span>
                                        </div>
                                        <div v-if="row.is_review == 0">
                                            创建人：<span class="user-black">{{ row.creator + " - " + (row.department_name
                ||
                "一一") }}</span>
                                        </div>
                                        <div v-else-if="row.is_review == 1">
                                            核销人：<span class="user-black">{{ row.operator }}</span>
                                        </div>
                                        <div v-else>
                                            复核人：<span class="user-black">{{ row.reviewer }}</span>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="金额">
                                <template #default="{ row }">
                                    <div>金额：<span class="user-black bold">{{ numberFmt(row.origin_total_amount)
                                            }}</span><span>{{ " " +
                row.currency }}</span></div>
                                    <div>人民币：<span class="user-black bold">{{ numberFmt(row.cny_total_amount)
                                            }}</span><span>{{
                " " + "CNY" }}</span></div>
                                    <div>状态：<span :class="['user-black', reviewClass(row.is_review)]">{{
                reviewMsg(row.is_review)
            }}</span></div>
                                </template>
                            </el-table-column>
                            <el-table-column label="公司/时间">
                                <template #default="{ row }">
                                    <div>公司: {{ row.company_name }}</div>
                                    <div v-if="row.is_review == 0">
                                        创建：<span class="user-black">{{ timestampToFormattedString(row.create_time)
                                            }}</span>
                                    </div>
                                    <div v-else-if="row.is_review == 1">
                                        核销：<span class="user-black">{{ timestampToFormattedString(row.update_time)
                                            }}</span>
                                    </div>
                                    <div v-else>
                                        复核：<span class="user-black">{{ timestampToFormattedString(row.review_time)
                                            }}</span>
                                    </div>
                                    <!-- <div v-if="row.is_review == 1">核销时间：<span class="user-black">{{
                timestampToFormattedString(row.update_time) }}</span></div> -->
                                </template>
                            </el-table-column>
                            <el-table-column label="备注">
                                <template #default="{ row }">
                                    <div class="user-black">{{ row.note }}</div>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="100">
                                <template #default="{ row }">
                                    <el-button link type="primary" @click="editNote(row)">备注</el-button>
                                </template>
                            </el-table-column>

                        </el-table>

                        <el-pagination size="default" style="padding-top: 5px; position: fixed;bottom: 20px"
                            v-show="queryForm.page.totalCount > 0" v-model:current-page="queryForm.page.currentPage"
                            v-model:page-size="queryForm.page.pageSize" background="true"
                            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
                            :total="queryForm.page.totalCount" />
                    </div>
                </el-tab-pane>

                <el-tab-pane label="信用卡报销管理" name="信用卡报销管理" v-if="store.canCreditCardReimburse">
                    <CreditCardReimbursement @toCard="goto" :accounts="accounts.accounts"></CreditCardReimbursement>
                </el-tab-pane>
            </el-tabs>
        </template>
    </Layout>

    <!-- 备注修改 -->
    <el-dialog width="400px" title="备注修改" v-model="queryForm.editShow" destroy-on-close :close-on-click-modal="false">
        <el-form label-width="auto">
            <el-form-item label="备注">
                <el-input type="textarea" v-model="queryForm.edit.note" :rows="3"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="queryForm.editShow = false">关闭</el-button>
                <el-button type="primary" @click="onEditNote">
                    确认
                </el-button>
            </div>
        </template>

    </el-dialog>

    <!-- 添加 -->
    <el-dialog width="400px" v-model="formAddShow" destroy-on-close title="新增报销" :close-on-click-modal="false">
        <el-form label-width="auto" :model="formAdd" :rules="rules" ref="formAddRef">
            <el-form-item label="账户" prop="account_id">
                <el-select v-model="formAdd.account_id" placeholder="请选择" default-first-option>
                    <el-option v-for="(item, index) in accounts" :key="index" :label="item.account_name"
                        :value="item.account_id"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="币种" prop="currency">
                <el-select v-model="formAdd.currency" placeholder="币种" filterable :validate-event="false">
                    <el-option label="全部" value="" />
                    <el-option v-for="item in bank.currencies" :value="item.code" />
                </el-select>
            </el-form-item>
            <el-form-item label="金额" prop="amount">
                <el-input v-model="formAdd.amount" placeholder="打款金额" :formatter="amountFormatter"
                    :parser="amountParser" clearable />
            </el-form-item>
            <el-form-item label="备注" prop="note">
                <el-input v-model="formAdd.note" type="textarea" spellcheck="false" maxlength="100" show-word-limit />

            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="formAddShow = false">关闭</el-button>
                <el-button type="primary" @click="onAddDetail">
                    确认
                </el-button>
            </div>
        </template>
    </el-dialog>

    <!-- 核销/复核 -->
    <el-dialog :title="modeTitle" v-model="dialog.visible" width="90%" destroy-on-close :close-on-click-modal="false">
        <CreditCardWriteOff :rows="checkRows" @close="onClose" :mode="mode" />
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

.blue {
    color: blue !important;
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

/* tab 设置 */
:deep(.el-input-number .el-input__inner) {
    text-align: left;
}

:deep(.el-tabs__nav-scroll) {
    height: 36px;
    background-color: white !important;
    border: none !important;
    border-bottom: 1px solid #eee !important;
    -webkit-app-region: drag;
}

:deep(.el-tabs__nav-scroll div) {
    -webkit-app-region: no-drag;
}

:deep(.el-tabs__header),
:deep(.el-tabs__nav),
:deep(.el-tabs__item) {
    height: 36px;
    border: none !important
}

:deep(.el-tabs__nav .el-tabs__item) {
    height: 36px !important;
    transition: none !important;
}

:deep(.el-tabs__nav .el-tabs__item:hover) {
    color: black !important;
}

:deep(.el-tabs__nav .el-tabs__item:first-child .el-icon.is-icon-close) {
    display: none;
}

/* :deep(.el-tabs__nav .el-tabs__item:not(:first-child) .el-icon.is-icon-close ) {
  color: transparent;
}
:deep(.el-tabs__nav .el-tabs__item:not(:first-child) .el-icon.is-icon-close:hover ) {
  background-color: transparent!important;
  color: transparent;
} */

:deep(.el-tabs__nav .el-tabs__item:first-child) {
    padding: 0px;
    margin-left: 10px;
    margin-top: -3px;
    margin-right: 0px !important;
    font-size: 15px;
}

:deep(.el-tabs__nav .el-tabs__item:not(:first-child)) {
    padding: 0px !important;
    margin: 0px;
    padding-right: 10px;
    margin-left: 20px;
    margin-top: -3px;
    font-size: 15px;
}



:deep(.el-tabs__nav .el-tabs__item.is-active:not(:first-child)) {
    padding: 0px !important;
    margin: 0px;
    padding-right: 10px;
    margin-left: 20px;
    margin-top: -3px;
    font-size: 15px;
}

:deep(.el-tabs__nav) {
    border: none !important;
}

:deep(.el-tabs__content),
:deep(.el-tabs) {
    border: none !important;
    padding: 0px !important;
    margin: 0px !important;
    background-color: transparent !important;
}
</style>