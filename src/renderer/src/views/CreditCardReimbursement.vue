<script setup>
import { reactive, onMounted, ref } from "vue"
import { useClient } from "../utils/client"
import api from "@/api"
import { formatDate, numberFmt, amountFormatter, amountParser, until } from "@/utils/format"
import message from "../utils/message";
const { height } = useClient()

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
const queryForm = reactive({
    search: {
        // start_time: "",
        // end_time: "",
        start_time: formatDate(shortcuts[1].value(), { trancate: 'd' }),
        end_time: formatDate(new Date, { trancate: 'd' }),
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

const show = ref(false)
const item = ref(null)
const formRef = ref(null)
const formAdd = reactive({
    account_id: null,
    review_date: '',
    amount: '',
    note: '',

    account_name: '',
    list: [],
})
const submitReimburse = async () => {
    formRef.value.validate(async valid => {
        if (valid) {
            try {
                const d = { ...formAdd }
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
                <el-button type="danger" @click="onReimburse">报销</el-button>
                <el-text type="danger" style="margin-left: 10px;" size="default"> 共{{ data.length }}条记录</el-text>
            </el-form-item>
        </el-form>


        <el-empty v-if="data.length == 0" :image-size="260">

        </el-empty>

        <el-scrollbar v-else :height="height - 160">
            <el-radio-group style="width: 100%;" v-model="item">
                <div v-for="item in data" :key=item.id class="container">
                    <div class="container-info">
                        <div style="display: flex;">
                            <el-radio class="item-title" :value="item" :disabled="item.disabled">{{ item.account_name
                                }}</el-radio>
                            <el-button link @click="() => {
                                    emits('toCard', item.account_id)
                                }">
                                查看记录
                            </el-button>
                        </div>

                        <div style="display: flex; justify-content: flex-start; gap:4px;margin-bottom: 4px; margin-top: 10px"
                            v-for="info in item.currency_list" :key="info.currency">
                            <p class="sub-title">
                                {{ info.currency }}
                            </p>
                            <div class="sub-content">

                                <p class="sub-value-un">未复核: {{ info.un_reviewed_count }}笔; {{
                    numberFmt(info.un_reviewed_amount)
                }}<span>{{ " " + info.currency }}</span> (<span>{{ " " +
                    numberFmt(info.un_reviewed_amount_cny)
                                        }}</span>
                                    <span>{{ " CNY" }}</span>)
                                </p>
                                <p class="sub-value">已复核: {{ info.reviewed_count }}笔; {{ numberFmt(info.reviewed_amount)
                                    }}<span>{{ " " + info.currency }}</span> (<span>{{ " " +
                    numberFmt(info.reviewed_amount_cny)
                                        }}</span>
                                    <span>{{ " CNY" }}</span>)
                                </p>
                            </div>
                        </div>
                        <div class="line"></div>
                        <div class="total">
                            <div style="color:red;font-size:12px">合计：</div>
                            <div style="display: flex; align-items: center; justify-content: space-between;flex: 1;">
                                <p class="total-header">未复核: {{ item.un_reviewed_count }}笔;
                                    <span>{{ numberFmt(item.un_reviewed_amount_cny) }}</span><span
                                        style="font-weight: 500;">{{ " CNY" }}</span>
                                </p>
                                <p class="total-footer" style="color:darkgreen">已复核: {{ item.reviewed_count }}笔;
                                    <span>{{ numberFmt(item.reviewed_amount_cny) }}</span>
                                    <span style="font-weight: 500;">{{ " CNY" }}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="operator">
                        <div class="operator-title">报销金额: <span style="padding-left: 5px; font-weight: 500;">
                                {{ numberFmt(item.amount)
                    || "一一" }} {{ " CNY" }}</span> </div>
                        <div class="operator-title">报销日期: <span style="padding-left: 5px;"> {{ item.day_date
                    ||
                    "一一" }}</span></div>
                        <div class="operator-title">钉钉编号: <span style="padding-left: 5px;">{{ item.approval_number ||
                    "一一" }}</span></div>
                        <div class="operator-title">报销状态: <span style="padding-left: 5px; "
                                :class="[item.id === null ? 'red' : 'green']"> {{ item.id === null ? "未报销" : "已报销"
                                }}</span>
                        </div>

                    </div>
                </div>
            </el-radio-group>


        </el-scrollbar>

        <!-- 报销操作 -->
        <el-dialog title="报销" width="500" v-model="show" destroy-on-close :close-on-click-modal="false">
            <el-form :model="formAdd" label-width="auto" ref="formRef"
                :rules="{ amount: [{ required: true, message: '请填写金额', trigger: 'blur' }] }">
                <el-form-item label="账户" prop="account_id">
                    <el-input v-model="formAdd.account_name" type="text" disabled></el-input>
                </el-form-item>
                <el-form-item label="复核金额">
                    <el-table :data="formAdd.list">
                        <el-table-column label="币种" prop="currency"></el-table-column>
                        <el-table-column label="金额" prop="amount"></el-table-column>
                        <el-table-column label="汇率" prop="rate"></el-table-column>
                        <el-table-column label="人命币金额" prop="amount_cny"></el-table-column>
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
                    <el-input v-model="formAdd.note" type="textarea" spellcheck="false" maxlength="100"
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
    width: calc(100% - 10px);
    background-color: white;
    margin-bottom: 8px;
    display: flex;
    gap: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}

.container-info {
    flex: 1
}

.red {
    color: red;
}

.green {
    color: green
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