<script setup>
import { reactive, ref, watch, computed, onMounted } from 'vue'
import { useUserStore, useAccountStore, useAirwallexStore, useScreenShortStore, useDingdingSubmitStore, useExcelStore } from '@/stores'
import { useLocalConfig } from "@/stores/config"
import { storeToRefs } from "pinia"
import { useCycleList } from '@vueuse/core'
import api from '@/api'
import { Check, Close } from '@element-plus/icons-vue'
import { amountFormatter, amountParser, numberFmt, timestampToFormattedString } from '@/utils/format'
import { viewImages } from "@/utils/tools"
import Message from '@/utils/message'
import Airwallex from './Airwallex.vue'
import { debounce } from 'lodash'

import PaymentRecord from './PaymentRecord.vue'
import { useClient } from '../utils/client'
const { height } = useClient()

const props = defineProps({
    batch: {
        type: Boolean,
        default: false
    },
    batchData: {
        type: Array,
        default: () => []
    }
})

const dd = useDingdingSubmitStore()
const shortStore = useScreenShortStore()
const store = useUserStore()
const accountStore = useAccountStore()
const accounts = computed(() => {
    return accountStore.accounts.map(item => ({ 'label': item.account_name, 'value': item.id }))
})
const ws = useExcelStore()

const airwallexStore = useAirwallexStore()
const airwallexTypes = [{ label: 'airwallex', value: 1 }, { label: 'paypal', value: 2 }]

const { state, next, prev, index } = useCycleList(props.batchData)
const showOrder = computed(() => {
    return "  " + (index.value + 1 + " / " + props.batchData.length)
})
const updateCurrent = () => {
    formReset()
    Object.keys(state.value).forEach(k => {
        form[k] = state.value[k]
    })
    form.account_id = accountStore.getAccountId(form.account_id)
    if (accountStore.currencyCodes.includes(form.currency?.toUpperCase())) {
        form.currency = form.currency.toUpperCase()
    } else {
        form.currency = ''
    }

}
const previewData = () => {
    prev()
    updateCurrent()
}
const nextData = () => {
    next()
    updateCurrent()
}

onMounted(() => {
    if (props.batch) {
        updateCurrent()
    }
})

const emit = defineEmits(['close', 'freshPending'])

const cfgStore = useLocalConfig()
const { autoClick, autoConfirm } = storeToRefs(cfgStore)

watch([() => dd.flag], () => {
    form.approval_number = dd.approve.approval_number || ''
    form.origin_total_amount = dd.approve.origin_total_amount || ''
    form.currency = dd.approve.currency || ''
    // form.transaction_number = dd.approve.purchase_number || ''
    form.receiving_account = dd.approve.bank_account || ''
    handleDingding()
})

const form = reactive({
    approval_number: dd.approve.approval_number || '',
    account_id: '',
    pay_type: 1,
    receiving_account: dd.approve.bank_account || '',
    origin_total_amount: dd.approve.origin_total_amount,
    currency: dd.approve.currency || '',
    commission: '',
    transaction_number: '',
    note: dd.approve.note || '',
    transaction_number_airwallex: '',
    airwallex_status: '',
    attachment_list: [],
    is_binding: false
})
const formReset = () => {
    form.approval_number = dd.approve.approval_number || ''
    form.account_id = ''
    form.pay_type = 1
    form.receiving_account = dd.approve.bank_account || ''
    form.origin_total_amount = dd.approve.origin_total_amount || ''
    form.currency = dd.approve.currency || ''
    form.commission = ''
    form.transaction_number = ''
    form.note = dd.approve.note || ''
    form.transaction_number_airwallex = ''
    form.airwallex_status = ''
    form.attachment_list = []
    form.is_binding = false
}

const formClear = () => {
    dd.reset()
    formReset()
}

const airwallexVisible = ref(false)
const uploadRef = ref(null)
const formRef = ref(null)
const rules = reactive({
    approval_number: [{ required: true, message: '请输入钉钉编号', trigger: 'blur' }],
    account_id: [{ required: true, message: '请选择打款账号', trigger: 'blur' }],
    receiving_account: [{ required: true, message: '请输入收款账号', trigger: 'blur' }],
    origin_total_amount: [{ required: true, message: '请输入打款金额', trigger: 'blur' }],
    currency: [{ required: true, message: '请选择币种', trigger: 'change' }],
    transaction_number: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }],
    note: [{ required: false }],
    attachment_list: [
        {
            required: true,
            validator: (rule, value, call_back) => uploadRef.value.validate(rule, value, call_back),
            trigger: 'change'
        }
    ],
})

const confirmDialogVisible = ref(false)

watch(() => shortStore.image, (src) => {
    form.attachment_list.push({ url: src })
})

const onSubmit = async el => {
    if (!el) return
    await el.validate(async (valid, _) => {
        if (!valid) return false
        const data = {
            approval_number: form.approval_number,
            origin_total_amount: form.origin_total_amount,
            currency: form.currency,
            commission: form.commission,
            attachment_list: [],
            account_items: [
                {
                    account_id: form.account_id,
                    receiving_account: form.receiving_account,
                    transaction_number: form.transaction_number,
                    note: form.note
                }
            ],
        }
        data.attachment_list = JSON.stringify((await uploadRef.value.uploadImage()) ?? [])
        if (form.transaction_number_airwallex) {
            data.account_items[0].transaction_number_airwallex = form.transaction_number_airwallex
            data.account_items[0].airwallex_status = form.airwallex_status
        }
        data.account_items = JSON.stringify(data.account_items)
        try {
            const resp = await api.addPaymentRecord(data)
            Message.success("打款提交成功")
            emit('freshPending')
            listRef.value?.reload()

            const account_id = form.account_id
            const approval_number = form.approval_number

            if (form.transaction_number_airwallex) {
                if (form.is_binding) {  // 更新本地airwallex记录
                    electron.sql.update('dingtalk_submit_log', {
                        bind_approval_number: form.approval_number,
                        bind_type: '2',
                        update_time: Math.round(new Date().getTime() / 1000),
                    }, {
                        transaction_number_airwallex: form.transaction_number_airwallex
                    })
                } else {  // 插入airwallex新记录
                    electron.sql.insert('dingtalk_submit_log', {
                        bind_approval_number: form.approval_number,
                        bind_type: '1',
                        creator: store.user.username,
                        create_time: Math.round(new Date().getTime() / 1000),
                        update_time: Math.round(new Date().getTime() / 1000),
                        transaction_number_airwallex: form.transaction_number_airwallex,
                    })
                }
            }
            dd.reset()
            formReset()
            // 剩余金额为0, 自动点单
            if (resp.left_origin_amount === 0) {
                onConfirm(account_id, approval_number)
            }
            if (props.batch) {
                nextData()
            } else {
                emit('close')
            }

            // 是否自动点单
            // if (autoClick.value) {
            //     // 是否需要确认
            //     if (autoConfirm.value) {
            //         confirmDialogVisible.value = true
            //     } else {
            //         onConfirm()
            //     }
            // } else {
            //     if (props.batch) {
            //         nextData()
            //     } else {
            //         emit('close')
            //     }
            // }
        } catch (error) {
        }
    })
}
const errorMsg = ref('')
const centerDialogVisible = ref(false)

const onConfirm = async (account_id, approval_number) => {
    try {
        await api.autoComplete({
            account_id: account_id,
            approval_number_item: JSON.stringify([approval_number]),
        }, false)
        Message.success("自动点单成功")
        confirmDialogVisible.value = false
        emit('close')
    } catch (error) {
        errorMsg.value = error.msg
        centerDialogVisible.value = true
    }
}

const onRelateAirwallex = () => {
    // 打开新窗口
    // electron.newWindow('airwallex', { id: form.account_id })
    // 改为弹层形式
    airwallexVisible.value = true
}

const onSelectAirwallex = (row, isBinding) => {
    airwallexVisible.value = false
    form.transaction_number_airwallex = row.transaction_number_airwallex
    form.airwallex_status = row.airwallex_status
    form.is_binding = isBinding
}

const loading = ref(false)
const histories = reactive({
    count: null,
    list: [],
    show: false,
    title: ''
})
const handleDingding = () => {
    fetchAccountVoucherInfo()
}
const fetchAccountVoucherInfo = debounce(
    async () => {
        try {
            if (form.approval_number.length) {
                loading.value = true
                const resp = await api.getAccountVoucherInfo({ approval_number: form.approval_number })
                histories.count = resp.count
                histories.list = resp.list
                histories.title = `打款记录 - ${form.approval_number}`
            }
        } catch (err) {

        } finally {
            loading.value = false
        }
    }, 500
)

const showRecordDrawer = ref(false)
const showRecordCondition = ref('1')
const showRecordContent = ref('')
const showRecordExpands = ref([])

const recordQuery = reactive({
    condition: '1',
    content: '',
    page: 1,
    limit: 10,
})
const record = reactive({
    totalPage: null,
    loading: false,
    showSearch: false,
})
const listRef = ref(null)
const onSearchRecord = async (page, limit) => {
    try {
        const data = await api.getPaymentRecordList({ ...recordQuery, page, limit, showLoading: false })
        return data
    } catch (error) {
        console.log(error)
    }
}

const onFetchDone = ({ total }) => {
    record.totalPage = total
    record.loading = false
}

const onFetchStart = () => {
    record.loading = true
}
const listHeight = computed(() => {
    const formHeight = formRef.value?.$el?.clientHeight ?? 474
    return height.value - 20 - 66 - formHeight - 40 - 20
})
const onCopy = async text => {
    await navigator.clipboard.writeText(text)
    Message.success("复制成功")
}
const vieDetail = (voucher_id, sn) => {
    showRecordCondition.value = recordQuery.condition
    showRecordContent.value = sn
    showRecordExpands.value = [voucher_id]
    showRecordDrawer.value = true
}

watch(() => recordQuery.condition, () => {
    listRef.value.reload()
})

const dSearch = debounce(() => {
    listRef.value.reload()
}, 300)

watch(() => recordQuery.content, () => {
    dSearch()
})
</script>


<template>
    <Header>
        <template #title>
            <h4>钉钉打款</h4>
        </template>

        <template #option>
            <!--
            <el-button link class="option-btn" size="small">
                <el-icon>
                    <Hide />
                </el-icon>
            </el-button> -->
            <el-tooltip content="批量打款" placement="bottom" hide-after="0" transition="none" :disabled="ws.excelLoading">
                <el-button link @click="emit('openBatch')" :loading="ws.excelLoading">
                    <template #loading>
                        <el-icon class="is-loading" :size="20" color="black">
                            <Eleme />
                        </el-icon>
                    </template>
                    <el-icon v-if="!ws.excelLoading" :size="20" class="iconfont icon-Excelxieru-xuanzhong">
                    </el-icon>
                </el-button>
            </el-tooltip>
            <el-tooltip content="打款记录" placement="bottom-end" hide-after="0" transition="none">
                <el-button size="small" class="option-btn" @click="showRecordDrawer = true" link>
                    <i class="iconfont icon-history-record"></i>
                </el-button>
            </el-tooltip>
        </template>
    </Header>
    <div class="wrapper flex flex-col w-full">
        <!-- :height="height - 86" -->
        <el-scrollbar>

            <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" @submit.prevent v-if="true">
                <el-form-item label="钉钉编号" prop="approval_number" required>
                    <div style="width: 100%;display: flex;gap: 10px;justify-content: space-between">
                        <el-input v-model.trim="form.approval_number" @input="handleDingding" :validate-event="false"
                            clearable />
                        <el-tooltip content="钉钉编号打款记录" transition="none" show-after="0">
                            <el-button type="info" :loading="loading" @click="histories.show = true">
                                <el-icon>
                                    <Tickets />
                                </el-icon>
                                <span v-if="!loading">
                                    {{ histories.count === null ? "" : `(${histories.count})` }}
                                </span>
                            </el-button>
                        </el-tooltip>
                    </div>
                </el-form-item>
                <el-form-item label="付款账号" prop="account_id" required>
                    <el-select v-model="form.account_id" filterable :empty-values="[null, undefined]"
                        :value-on-clear="null">
                        <el-option v-for="item in accounts" :label="item.label" :value="item.value"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="支付方式" v-if="airwallexStore.airwallex_binding.includes(form.account_id)" required>
                    <el-col :span="17">
                        <el-select v-model="form.pay_type" :validate-event="false">
                            <el-option v-for="item in airwallexTypes" :label="item.label"
                                :value="item.value"></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="6" :offset="1" v-show="form.pay_type == 2">
                        <el-form-item>
                            <el-button type="primary" @click="onRelateAirwallex">关联Airwallex</el-button>
                        </el-form-item>
                    </el-col>
                </el-form-item>
                <el-form-item label=" " v-if="form.transaction_number_airwallex" size="small">
                    <el-text type="primary">已关联：{{ form.transaction_number_airwallex }}</el-text>
                </el-form-item>
                <el-form-item label="顾客收款账号" prop="receiving_account" required>
                    <el-input v-model="form.receiving_account" clearable :validate-event="false" />
                </el-form-item>
                <el-form-item label="打款金额" required>
                    <el-col :span="10">
                        <el-form-item prop="origin_total_amount">
                            <el-input v-model="form.origin_total_amount" placeholder="打款金额" :formatter="amountFormatter"
                                :parser="amountParser" clearable :validate-event="false" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :offset="1">
                        <el-form-item prop="currency">
                            <el-select v-model="form.currency" placeholder="币种" filterable :validate-event="false">
                                <el-option label="全部" value="" />
                                <el-option v-for="item in accountStore.currencies" :value="item.code" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="6" :offset="1">
                        <el-form-item>
                            <el-input v-model="form.commission" placeholder="手续费" :formatter="amountFormatter"
                                :parser="amountParser" clearable :validate-event="false" />
                        </el-form-item>
                    </el-col>
                </el-form-item>
                <el-form-item label="交易流水号" prop="transaction_number" required>
                    <el-input v-model="form.transaction_number" spellcheck="false" :validate-event="false" clearable />
                </el-form-item>
                <el-form-item label="备注" prop="note">
                    <el-input v-model="form.note" rows="3" type="textarea" spellcheck="false" maxlength="100"
                        show-word-limit />
                </el-form-item>
                <el-form-item label="图片" prop="attachment_list" required>
                    <Upload action="upload" ref="uploadRef" v-model="form.attachment_list" :limit="10" dir="payment"
                        :size="66">
                    </Upload>
                </el-form-item>

                <el-form-item label=" ">
                    <div style="display: flex;gap: 10px; justify-content: space-between;width: 100%;">
                        <el-text type="primary">提示：Ctrl + Q 快速截图</el-text>
                        <div>
                            <el-button :icon="Close" @click="() => {
                formClear()
                formRef.clearValidate()
            }">
                                重置
                            </el-button>
                            <el-button type="primary" :icon="Check" @click="onSubmit(formRef)">提交</el-button>
                        </div>
                        <el-button v-if="props.batch" @click="previewData" link><el-icon>
                                <ArrowLeftBold />
                            </el-icon></el-button>
                        <el-button v-if="props.batch" @click="nextData" link><el-icon>
                                <ArrowRightBold />
                            </el-icon></el-button>
                        <el-text v-if="batch" style="margin-left: 10px">
                            {{ showOrder }}
                        </el-text>
                    </div>

                </el-form-item>
            </el-form>

            <div class="flex flex-between w-full gap-8 m-r-10 m-b-10" style="height:30px;" v-if="true">
                <div class="flex flex-c-center gap-4">
                    <h3 class="t-primary">打款记录</h3>
                    <span class="t-gray f-13 b-500 t-n">(共{{ record.totalPage }}条记录)</span>
                    <el-button link @click="() => {
                recordQuery.showSearch = !recordQuery.showSearch
                if (recordQuery.showSearch === false) {
                    recordQuery.content = ''
                }
            }"><el-icon>
                            <Search />
                        </el-icon></el-button>
                    <el-input v-if="recordQuery.showSearch" style="flex: 1" clearable placeholder="输入编号"
                        v-model="recordQuery.content" @keyup.esc="() => {
                recordQuery.showSearch = !recordQuery.showSearch
                if (recordQuery.showSearch === false) {
                    recordQuery.content = ''
                }
            }" />
                </div>
                <div>
                    <el-button link @click="listRef.reload()">
                        <el-icon :class="record.loading ? 'is-loading' : ''" size="large">
                            <Refresh />
                        </el-icon>
                    </el-button>
                    <el-select style="width: 120px" v-model="recordQuery.condition">
                        <el-option label="今天" value="1" />
                        <el-option label="昨天" value="2" />
                        <el-option label="近7天" value="3" />
                        <el-option label="本月" value="4" />
                        <el-option label="上个月" value="5" />
                    </el-select>
                </div>
            </div>
            <!-- <div v-for="item in recordData" :key="item.voucher_id" class="flex-col gap-4 record-container">
                <div class="flex flex-between">
                    <span class="t-black f-14 b-500">编号 {{ item.sn }} </span>
                    <span class="t-gray f-14">{{ timestampToFormattedString(item.create_time) }} </span>
                </div>
                <div class="flex flex-between">
                    <div class="flex flex-col">
                        <span class="t-black f-14">{{ item.creator }} ({{ item.department_name }})</span>
                        <div>
                            <span class="t-black f-14">支出金额 </span>
                            <span class="t-red f-14">{{ numberFmt(item.origin_total_amount) + " " }}</span>
                            <span class="t-gray f-14">{{ item.currency }}</span>
                        </div>
                    </div>
                    <div class="flex flex-col flex-c-end">
                        <span class="t-black f-14">{{ item.voucher_ext_last.account_name }}</span>
                        <span class="t-black f-14">收款账号 {{ " " + item.voucher_ext_last.receiving_account }}</span>
                    </div>

                </div>
            </div> -->

            <LoadingList :fetch="onSearchRecord" ref="listRef" :height="listHeight"
                :maps="{ data: 'list', total: 'count', key: 'voucher_id' }" @on-fetch-start="onFetchStart"
                @on-fetch-done="onFetchDone">
                <template #empty>
                    <el-empty :image-size="120" />
                </template>
                <template #default="{ info: item }">
                    <div
                        :class="['flex-col', 'gap-4', 'record-container', item.voucher_ext_last.is_audit ? 'record-audit' : '']">
                        <div class="flex flex-between">
                            <div>
                                <span class="t-black f-14 b-500">编号 {{ item.sn }} </span>
                                <el-button @click="onCopy(item.sn)" link><i class="iconfont icon-copy"></i></el-button>
                            </div>
                            <span class="t-gray f-14">{{ timestampToFormattedString(item.create_time) }} </span>
                        </div>
                        <div class="flex flex-between">
                            <div class="flex flex-col">
                                <span class="t-black f-14">{{ item.payment_creator }} ({{ item.payment_department_name
                                    }})</span>
                                <div>
                                    <span class="t-black f-14">支出金额 </span>
                                    <span class="t-red f-14">{{ numberFmt(item.origin_total_amount) + " " }}</span>
                                    <span class="t-gray f-14">{{ item.currency }}</span>
                                </div>
                                <div>
                                    <span class="t-black f-14">交易流水</span>
                                    <span class="t-gray f-14">{{ " " + item.voucher_ext_last.transaction_number
                                        }}</span>
                                </div>

                            </div>
                            <div class="flex flex-col flex-c-end">
                                <span class="t-black f-14">{{ item.voucher_ext_last.account_name }}</span>
                                <span class="t-black f-14">收款账号 {{ " " + item.voucher_ext_last.receiving_account
                                    }}</span>
                                <span class="t-primary f-14 t-n c-pointer" @click="vieDetail(item.voucher_id, item.sn)">
                                    明细 {{ item.voucher_ext_count }}</span>
                            </div>

                        </div>
                    </div>

                </template>
            </LoadingList>


        </el-scrollbar>


        <el-dialog title="关联Airwallex" v-model="airwallexVisible" width="88%" :close-on-click-modal="false"
            destroy-on-close>
            <Airwallex :account-id="form.account_id" :accounts="accounts" @submit="onSelectAirwallex"
                @cancel="airwallexVisible = false" />
        </el-dialog>

        <!-- 自动点单确认 -->
        <el-dialog title="自动点单确认" v-model="confirmDialogVisible" width="400" :close-on-click-modal="false"
            destroy-on-close align-center>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="confirmDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="onConfirm">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 打款历史 -->
        <el-dialog :title="histories.title" v-model="histories.show" width="80%" destroy-on-close
            :close-on-click-modal="false">
            <el-table :data="histories.list">
                <el-table-column label="#" width="20">
                    <template #default="scope">
                        <span>{{ scope.$index + 1 }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="信息">
                    <template #default="{ row }">
                        <div class="name">
                            <p style="text-wrap: nowrap;">打款:</p>
                            <span class="value"> {{ row.account_name }}
                            </span>
                        </div>
                        <div class="name">
                            <p>收款:</p>
                            <span class="value"> {{ row.receiving_account }}</span>
                        </div>
                        <div class="name">
                            <p>流水号:</p>
                            <span class="value"> {{ row.purchase_number }}</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="其他">
                    <template #default="{ row }">
                        <div class="name">
                            <p>金额:</p>
                            <span class="money"> {{ numberFmt(row.origin_amount) }}</span>{{ " " + row.origin_currency
                            }}
                        </div>
                        <div class="name">
                            <p>时间:</p>
                            <span class="value"> {{ timestampToFormattedString(row.create_time) }}</span>
                        </div>
                        <div class="name">
                            <p style="margin-right: 6px;">图片:</p>
                            <el-button link @click="viewImages(row.attachment_list.map(v => v.path), 0)">
                                <el-icon>
                                    <span style="color: black; font-style: normal;">
                                        <Picture />
                                        {{ `(${row.attachment_list.length})` }}
                                    </span>
                                </el-icon>
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="备注">
                    <template #default="{ row }">
                        <p class="name">备注： <span class="value"> {{ row.note }}</span></p>
                    </template>
                </el-table-column>

            </el-table>

        </el-dialog>

        <!-- 自动点单失败 -->
        <el-dialog title="自动点单失败" v-model="centerDialogVisible" width="500" align-center destroy-on-close
            :close-on-click-modal="false" append-to-body>
            <div v-html="errorMsg"></div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="() => {
                centerDialogVisible = false
                emit('close')
            }">
                        关闭
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 打款记录抽屉 -->
        <el-drawer v-model="showRecordDrawer" title="打款记录" direction="rtl" size="70%" class="records" destroy-on-close
            @closed="() => {
                showRecordCondition = '1'
                showRecordContent = ''
                showRecordExpands = []
            }" :close-on-click-modal="false">
            <PaymentRecord :condition="showRecordCondition" :content="showRecordContent" :expands="showRecordExpands"
                @fresh-history="() => {
                listRef?.reload()
            }" />
        </el-drawer>
    </div>


</template>


<style scoped>
.wrapper {
    padding: 10px;
    margin-bottom: 10px;
    /* height: 100%; */
}

:deep(.custom-loading-list) {
    /* height: none !important; */
    flex: 1;
    /* margin-bottom: 20px; */
    /* overflow-y: scroll; */
}

.record-container {
    background-color: #fff;
    padding: 10px;
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.record-audit {
    background-image: url('../assets/images/shenpi.svg');
    background-repeat: no-repeat;
    background-position: 44% 10%;
    background-size: 50px 50px;
}

.value {
    color: black;
    user-select: text
}

.name {
    display: flex;
    align-items: center;
    gap: 5px;
}

.money {
    color: rgb(200, 94, 94) !important;
    user-select: text
}

.el-form-item {
    margin-bottom: 20px;
}

.el-col .el-form-item {
    margin-bottom: 0;
}
</style>