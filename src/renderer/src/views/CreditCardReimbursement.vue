<script setup>
import { reactive, onMounted, ref, toRaw } from "vue"
import { useClient } from "../utils/client"
import api from "@/api"
import { formatDate, numberFmt, amountFormatter, amountParser, until, getMonthDaysFromDate, mulNumbers, sumArray } from "@/utils/format"
import message from "../utils/message";
import { computed } from "vue";
import { watch } from "vue";
import {useUserStore} from "../stores/index"
const { height } = useClient()
const store = useUserStore()

const props = defineProps({
    accounts: Array
})

const accountsInfo = computed(() => {
    const r = {}
    props.accounts.forEach(v => {
        r[v.account_name] = v
    })
    return r
})

const getAccountDetail = account_name => {
    return accountsInfo.value[account_name].detail
}

const getAccountTip = account_name => {
    const map = {
        '汇丰银行': '账单日18号, 还款日12号',
        '农业银行':'账单日17日, 还款日6日',
        '工商银行': '账单日19日, 还款日6日',
    }
    const c = accountsInfo.value[account_name].bank
    const keys = Object.keys(map)
    const index = keys.findIndex(v=>c.includes(v))
    if(index>-1){
        return map[keys[index]]
    }
    return ''
    // return (c === '工行') ? '账单日19日，还款日6日' : (c === '农行') ? '账单日17日，还款日6日' : ''
}

const emits = defineEmits(['toCard'])

const shortcuts = [
    {
        text: '1周前',
        value: () => {
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            return start
        },
    },
    {
        text: '1月前',
        value: () => {
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            return start
        },
    },
    {
        text: '3月前',
        value: () => {
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            return start
        },
    },
]
const days = getMonthDaysFromDate(shortcuts[1].value())

const st = formatDate(days.firstDay, { trancate: 'd' })
const ed = formatDate(getMonthDaysFromDate(new Date).lastDay, { trancate: 'd' })

const queryForm = reactive({
    search: {
        // start_time: "",
        // end_time: "",
        // start_time: formatDate(shortcuts[1].value(), { trancate: 'd' }),
        // end_time: formatDate(new Date, { trancate: 'd' }),
        start_time: st,
        end_time: ed,
        content: ''
    }
})

const data = ref([])
const onSearch = async () => {
    try {
        const d = { ...queryForm.search }
        if (!d.start_time && d.end_time) {
            d.start_time = formatDate(until(d.end_time, 90), { trancate: 'd' })
        }
        if (d.end_time == '') {
            d.end_time = formatDate(new Date, { trancate: 'd' })
        }
        const resp = await api.creditCard.getReimburseList(d)

        data.value = resp.map(item => {
            const rs = {}
            item.currency_list.forEach(value => {
                if (value.reimburse !== null) {
                    value.reimburse = JSON.parse(value.reimburse)
                }
                if (!rs[value.company_name]) {
                    rs[value.company_name] = [value]

                } else {
                    rs[value.company_name].push(value)
                }
            })
            item.currency_list_group = rs
            if (item.id === null) {
                return { ...item, disabled: false, checked: false }
            } else {
                return { ...item, disabled: true, checked: false }

            }
        })

    } catch (er) {

    }
}
onMounted(() => {
    onSearch()
})

const onReimburse = async () => {

    if (item.value == null) {
        message.warning('请选择报销的信用卡!')
        return
    }
    try {
        const d = await api.creditCard.getReimburseDatail({ account_id: item.value.account_id, review_date: item.value.review_date })
        formAdd.account_id = d.account_id
        formAdd.account_name = d.account_name
        formAdd.list = d.list
        formAdd.amount = d.total_amount_cny
        formAdd.review_date = item.value.review_date
        formAdd.note = ''
        show.value = true
    } catch (err) {

    }
}

const defaultSubmitDeptInfo = (cp)=>{
    const r = store.user.depart_list.filter(it=>it.dept_name.includes(cp))
    if(r.length){
        return r[0].dept_id
    }
    return store.user.depart_list[0].dept_id
}

const onReimburseItem = async (v, company_id, details, cp) => {
    try {
        const s = new Set(details.map(it=>it.currency))
        item.value = v
        const d = await api.creditCard.getReimburseDatail({ account_id: item.value.account_id, review_date: item.value.review_date, company_id })
        formAdd.account_id = d.account_id
        formAdd.account_name = d.account_name
        formAdd.list = d.list.filter(it=>s.has(it.currency))
        formAdd.amount = d.total_amount_cny
        formAdd.review_date = item.value.review_date
        formAdd.company_id = company_id
        formAdd.note = ''
        formAdd.dept_id = defaultSubmitDeptInfo(cp)
        formAdd.ids = details.map(it=>it.ids).join(',')
        show.value = true
        console.log('item ', formAdd)
    } catch (err) {
        console.log('err ==> ', err)
    }
}

const show = ref(false)
const item = ref(null)
const formRef = ref(null)
const formAdd = reactive({
    dept_id: null,
    account_id: null,
    review_date: '',
    amount: '',
    note: '',
    company_id: '',
    account_name: '',
    ids: '',
    list: [],
})

const updateTotalCnyAmount = ()=>{
    formAdd.amount = sumArray(formAdd.list, x=>{
        return mulNumbers(x.rate, x.amount, 2)}, 2)
}

watch(()=>formAdd.list, ()=>{
    updateTotalCnyAmount()
}, {deep: true})

const submitReimburse = async () => {
    formRef.value.validate(async valid => {
        if (valid) {
            try {
                const details = formAdd.list.map(v=>{
                    const cny = mulNumbers(v.rate, v.amount)
                    const l = v.ids.split(',').length
                    return l + `笔账单, 合计 ${v.amount} ${v.currency}, 人民币金额: ${cny} CNY `
                }).join('\n')
                const d = { ...formAdd }
                d.note = `${details} \n ${d.note}`
                d.detail_list = JSON.stringify([ ...d.list.map(it=> {
                    const item = toRaw(it)
                    item.amount_cny = mulNumbers(item.amount, item.rate, 2)
                    return item
                })])
                delete d.account_name
                delete d.list
                await api.creditCard.reimburse(d)
                show.value = false
                message.success('报销已提交!')
                onSearch()
                item.value = null
            } catch (err) {

            }
        }
    })
}


</script>

<template>
    <div class="pannel">
        <el-form inline>
            <el-form-item>
                <el-date-picker style="width: 130px;margin-right:5px" v-model="queryForm.search.start_time" type="date"
                    value-format="YYYY-MM-DD" format="YY/MM/DD" placeholder="开始" :shortcuts="shortcuts" />
                <el-date-picker style="width: 130px" v-model="queryForm.search.end_time" type="date"
                    value-format="YYYY-MM-DD" format="YY/MM/DD" placeholder="结束" :shortcuts="shortcuts" />
            </el-form-item>
            <el-form-item>
                <el-input type="text" v-model="queryForm.search.content" style="width: 200px" placeholder="钉钉编号"
                    clearable></el-input>
            </el-form-item>

            <el-form-item>
                <el-button type="primary" @click="onSearch">查询</el-button>
                <el-text type="danger" style="margin-left: 10px;" size="default"> 共{{ data.length }}条记录</el-text>
            </el-form-item>
        </el-form>


        <el-empty v-if="data.length == 0" :image-size="260">

        </el-empty>

        <el-scrollbar v-else :height="height - 160">
            <div v-for="item in data" :key=item.id class="flex flex-col p-r-10 container"
                style="background-color: white; margin-bottom: 24px;padding: 10px;">
                <div class="container-info">
                    <div class="flex flex-between p-r-10">
                        <span class="t-black t-n f-14 b-600">{{ item.account_name }}</span>
                        <div>
                            <span class="t-gray f-12 t-n m-r-10">{{ getAccountTip(item.account_name)}}</span>
                            <span class="t-black t-n f-12 b-600">{{ item.review_date }}</span>
                        </div>
                    </div>

                    <div class="line"></div>
                    <div v-for="(company_name, index) in Object.keys(item.currency_list_group)" :key="company_name"
                        :class="item.id == null ? '' : 'has-reimburse'">
                        <div class="flex p-r-10 flex-c-center">
                            <img v-if="company_name.includes('策美')" src="../assets/images/md-logo.png" height="20"
                                width="20" class="m-r-10"></img>
                            <img v-else src="../assets/images/bz-logo.png" height="18" width="18" class="m-r-10"></img>
                            <span class="t-black f-13 b-600 m-r-20">{{ company_name }}</span>
                            <el-button type="primary" link @click="() => {
                                    const args = []
                                    if (item.un_reviewed_count) {
                                        args.push('1')
                                    }
                                    if (item.reviewed_count) {
                                        args.push('2')
                                    }
                                    
                                    const r = item.currency_list_group[company_name]
                                    const company_id = r[0].company_id
                                    const ids = r.map(v=> v.ids).join(',')
                                    console.log('ids ', ids)
                                    emits('toCard', item.account_id, args, [company_id], queryForm.search.start_time, queryForm.search.end_time, ids)
                                }">
                                查看记录
                            </el-button>
                        </div>

                        <div :class="['flex','flex-row', 'm-t-10', 'flex-c-center', 'row', ]">
                            <div :class="['flex-col', 'w-full', item.currency_list_group[company_name][0].reimburse == null ? '': 'has-reimburse']">
                                <div :class="['flex', 'flex-row']">
                                <!-- 左侧 -->
                                <div>
                                    <div v-for="value in item.currency_list_group[company_name]" :key="value.currency" class="flex flex-col flex-c-center" style="width: 360px">
                                        
                                        <!-- 已报销 -->
                                        <template v-if="value.reimburse">
                                            <div class="flex flex-row w-full flex-between m-b-4">
                                                <el-progress style="width: 280px" class="m-r-10" :text-inside="true" :stroke-width="20"
                                                    :percentage="100" status="success">
                                                <div class="flex flex-start w-full">
                                                    <span class="p-l-10 f-11">已复核 {{ value.reviewed_count }}笔 {{ value.currency }}</span>
                                                </div>
                                                </el-progress>
                                                <span class="t-black m-r-4 f-12 b-600">{{ value.reviewed_count }}笔</span>
                                                <span class="t-gray m-r-4 f-12 b-600">/</span>
                                                <span class="t-black m-r-4 f-12 b-600">{{ value.reviewed_count + value.un_reviewed_count}}笔</span>
                                            </div>
                        
                                        </template>

                                        <!-- 未报销 -->
                                        <template v-else>
                                            
                                            <!-- 全部未复核 -->
                                            <template v-if="value.un_reviewed_amount == 0">
                                                <span class="t-red b-500 w-full">{{ value.reviewed_count }}笔&nbsp; {{value.currency }}
                                                    {{ value.reviewed_amount }}
                                                    <span class="t-green t-n f-12">
                                                        &nbsp;&nbsp;全部复核结束 <el-icon>
                                                            <SuccessFilled />
                                                        </el-icon>
                                                    </span>
                                                </span>
                                            </template>

                                            <template v-else>
                                                <span class="t-red b-500 w-full">{{ value.un_reviewed_count }}笔&nbsp;
                                                    {{ value.currency }} {{ value.un_reviewed_amount }}
                                                    <span class="t-red t-n f-12">
                                                        &nbsp;未复核
                                                    </span>
                                                    <span v-if="value.reviewed_count" class="t-red b-500">{{value.reviewed_count }}笔 &nbsp;&nbsp; {{ value.currency }}
                                                        {{ value.reviewed_amount }}
                                                        <el-text class="t-green t-n f-12" size="small">
                                                            &nbsp;已复核 <el-icon>
                                                                <SuccessFilled />
                                                            </el-icon>
                                                        </el-text>
                                                    </span>
                                                </span>
                                            </template>

                                        </template>

                                    </div>
                                </div>

                                <!-- 右侧 -->
                                <div style="flex:1;margin-left: 30px;" :class="['w-full', 'flex', 'flex-between', ]">

                                    <div class="flex">
                                        <div class="flex flex-col flex-between" style="width: 160px;">
                                            <div>
                                                <span class="t-gray f-12 m-r-10">报销人: </span>
                                                <span class="t-black f-12 b-600">{{ item.currency_list_group[company_name][0]?.reimburse?.creator || "--" }}</span>
                                            </div>
                                            <div>
                                                <span class="t-gray f-12 m-r-10">报销金额:</span>
                                                <span class="t-black f-12 b-600">{{ numberFmt(item.currency_list_group[company_name][0]?.reimburse?.amount, true, "--") + " CNY"}}</span>
                                            </div>
                                        </div>
                                        <div class="flex flex-col" style="width: 200px;">
                                            <div>
                                                <span class="t-gray f-12 m-r-10">报销日期:</span>
                                                <span class="t-black f-12 b-600">{{ item.currency_list_group[company_name][0]?.reimburse?.day_date || "--" }}</span>
                                            </div>
                                            <div>
                                                <span class="t-gray f-12 m-r-10">钉钉编号:</span>
                                                <span class="t-black f-12 b-600">{{ item.currency_list_group[company_name][0]?.reimburse?.approval_number || '--' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <template v-if="item.currency_list_group[company_name][0].reimburse == null">
                                        <el-button type="danger m-r-20" @click="() => {
                                            const r = item.currency_list_group[company_name]
                                            const company_id = r[0].company_id
                                            onReimburseItem(item, company_id, r, company_name)
                                            }">
                                            报销
                                        </el-button>
                                    </template>
                                </div>
                            </div>
                            
                            <div class="flex flex-col flex-c-start gap-4 m-t-10 m-r-4 details" style="justify-content: flex-start; align-items: flex-start" >
                                <div class="m-t-4 m-r-4" v-for="value in item.currency_list_group[company_name]"
                                    :key="value.id">
                                    
                                    <template v-if="value.reimburse != null">
                                        <el-tag type="primary" size="small">{{ value.currency }}</el-tag>
                                        <el-text class="t-green m-l-4 t-n" size="small">已复核 {{ value.reviewed_count }}笔
                                            <el-text class="p-l-10 t-n">
                                                {{ value.currency }} {{ value.reviewed_amount }} <el-icon class="t-green">
                                                    <SuccessFilled />
                                                </el-icon>
                                            </el-text>
                                        </el-text>
                                    </template>

                                    <template v-else>
                                        <el-tag type="primary" size="small">{{ value.currency }}</el-tag>
                                        <el-text class="t-green m-l-4" size="small">已复核 {{ value.reviewed_count }}笔
                                            <el-text class="p-l-10">
                                                {{ value.currency }} {{ value.reviewed_amount }}
                                            </el-text>
                                            <el-text class="p-l-10 t-red" size="small">
                                                未复核 {{ value.un_reviewed_count }}笔
                                            </el-text>
                                            <el-text class="p-l-10">
                                                {{ value.currency }} {{ value.un_reviewed_amount }}
                                            </el-text>
                                        </el-text>
                                    </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-if="Object.keys(item.currency_list_group).length > 1 && (index < item.currency_list_group[company_name].length)"
                            class="dot-line"></div>
                    </div>

                </div>
            </div>

        </el-scrollbar>

        <!-- 报销操作 -->
        <el-dialog title="报销" width="800" v-model="show" destroy-on-close :close-on-click-modal="false">
            <el-form :model="formAdd" label-width="auto" ref="formRef"
                :rules="{ amount: [{ required: true, message: '请填写金额', trigger: 'blur' }], dept_id: [{ required: true, message: '请选择部门', trigger: 'blur' }] }">
                <el-form-item label="部门" prop="dept_id">
                    <el-select v-model="formAdd.dept_id">
                        <el-option v-for="item in store.user.depart_list" :label="item.dept_name" :value="item.dept_id">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="账户">
                    <div class="flex flex-col w-full gap-4">
                        <!-- <el-input v-model="formAdd.account_name" type="text" disabled></el-input> -->
                        <span>{{ formAdd.account_name }}</span>
                        <div class="flex flex-col w-full" style="background-color: #E5F6E4;">
                            <span style="text-indent: 10px " class="t-black f-13">{{
                    getAccountDetail(formAdd.account_name)
                }}</span>
                            <span class="t-red f-12" style="text-indent: 10px ">{{ getAccountTip(formAdd.account_name)
                                }}</span>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label="复核金额">
                    <el-table :data="formAdd.list">
                        <el-table-column label="币种" prop="currency" ></el-table-column>
                        <el-table-column label="金额" prop="amount"></el-table-column>
                        <el-table-column label="汇率" prop="rate" #default="{row}">
                            <el-input-number v-model="row.rate" :controls="false"></el-input-number>
                        </el-table-column>
                        <el-table-column label="人民币金额" prop="amount_cny" #default="{row}">
                            <span>{{ numberFmt(mulNumbers(row.rate, row.amount)) }}</span>
                        </el-table-column>
                    </el-table>
                </el-form-item>
                <el-form-item label="金额" prop="amount">
                    <el-input v-model="formAdd.amount" placeholder="打款金额" :formatter="amountFormatter"
                        :parser="amountParser" clearable>
                        <template #suffix>
                            CNY
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item label="备注" prop="note">
                    <el-input v-model="formAdd.note" type="textarea" spellcheck="false" maxlength="500" :rows="4"
                        show-word-limit />

                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="show=false">关闭</el-button>
                    <el-button type="primary" @click="submitReimburse">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>


</template>

<style scoped>
.pannel {
    padding: 10px
}

.container {
    padding: 6px;
    padding-left: 10px;
    padding-right: 10px;
    width: calc(100% - 20px);
    background-color: white;
    margin-bottom: 8px;
    display: flex;
    gap: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.container-info {
    flex: 1;
    padding-left: 10px;
    padding-right: 10px;
}
.has-submit{
    background-image: url('../assets/images/has-submit.svg');
    background-repeat: no-repeat;
    background-position: 98% -20%;
    background-size: 66px 66px;

}
.has-reimburse {
    /* background-image: url('../assets/images/re-complete.png'); */
    background-image: url('../assets/images/has-submit.svg');
    background-repeat: no-repeat;
    background-position: 98% -20%;
    background-size: 66px 66px;
}

.red {
    color: red;
}

.green {
    color: green
}

:deep(.el-progress-bar__inner) {
    /* background-image: linear-gradient(to right, #ff7e5f 0%, #feb47b 50%, #ff7e5f 100%); */
    background-image: linear-gradient(to right, #b5d25e 0%, #1dca4e 100%);
}

:deep(.el-progress-bar__innerText) {
    width: 100% !important;
}

:deep(.el-radio__label) {
    color: black;
    font-weight: 600;
    font-size: 10pt;
}

.sub-title {
    color: black;
    font-size: 11px;
    font-weight: 500;
    margin-top: 2px;
    width: 26px;
}

.sub-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
}

.sub-value,
.sub-value-un {
    color: black;
    font-size: 11px;
    font-weight: 500;
    padding-left: 4px;
}

.sub-value-un {
    background-color: #F59A24;
    color: white;
}

.sub-value {
    background-color: rgb(163, 163, 163);
    color: white;
}

.sub-content p {
    font-size: 10pt;
}

.line {
    width: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid rgb(198, 198, 198);
    padding-left: 20px;
    padding-right: 20px;
}

.dot-line {
    width: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
    border-bottom: 1px dashed rgb(198, 198, 198);
    padding-left: 20px;
    padding-right: 20px;
}

.total {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    /* justify-content: space-between; */
}

.total-header {
    color: black;
    font-size: 10pt;
}

.total-footer {
    color: black;
    font-size: 10pt;

}

.operator {
    margin-top: 38px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.operator-title {
    width: 240px;
    color: black;
    font-size: 13px
}
</style>