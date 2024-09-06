<script setup>
import { ref, watch, computed, reactive, onMounted } from "vue"
import api from "@/api"
import message from "@/utils/message"
import { useUserStore, useAccountStore } from "@/stores/index"
import { timestampToFormattedString, numberFmt, dateTimeFmt, subNumbers } from "@/utils/format"
import { useClient } from "@/utils/client"
import logger from "../utils/logger"
const { height } = useClient()
const store = useUserStore()
const bank = useAccountStore()

const props = defineProps({
    accountId: {
        type: [Number, String, null],
        required: true
    },
    currency: String,
    drawerRef: Object
})

const search = reactive({
    condition: 3,
    totalPage: null,
})

const loading = ref(false)
const listRef = ref(null)

const onSearch = async (page, limit) => {
    const resp = await api.payouts.getPayoutList({
        page: page,
        limit: limit,
        user_id: store.user.id,
        condition: search.condition,
        account_id: props.accountId
    })
    return resp
}

const onFetchDone = ({ total }) => {
    search.totalPage = total
    loading.value = false
}

const onFetchStart = () => {
    loading.value = true
}

const stopLoad = (resp, current) => {
    if (resp.pages === null) {
        return false
    }
    if (resp.pages === 0) {
        return true
    }
    return current >= resp.pages
}

watch([() => props.accountId, () => search.condition], () => {
    listRef.value.reload()
})

const formRef = ref(null)
const uploadRef = ref(null)
const editFormRef = ref(null)
const editUploadRef = ref(null)

const form = reactive({
    mode: 'add', // add, edit 

    post: {
        account_id: props.accountId,
        origin_amount: null,
        currency: props.currency,
        attachment_list: [],
        note: '',
        account_title_id: null,
    },

    noteShow: false,
    noteNumber: null,
    notePost: {
        voucher_ext_id: null,
        note: null,
    },

    editShow: false,
    editNumber: null,
    editPost: {
        voucher_ext_id: null,
        account_title_id: null,
        account_id: props.accountId,
        origin_amount: '',
        currency: '',
        note: '',
        application_reason: '',
        attachment_list: []
    },

    cancelShow: false,
    cancelNumber: null,
    cancelPost: {
        voucher_ext_id: null
    },

    auditShow: false,
    auditNumber: null,
    auditPost: {
        application_reason: '',
        application: '',
        application_time: null,
        user_id: store.user.id,
        voucher_ext_id: null
    }
})
const formState = reactive({
    in_account_id_loading: false,
    out_account_id_loading: false,
    in_account_id_color: 'transparent',
    out_account_id_color: 'transparent',
    in_account_id_balance: '',
    out_account_id_balance: '',
    in_account_id_currency: '',
    out_account_id_currency: '',
    available_balance: computed(() => {
        const rs = subNumbers(formState.out_account_id_balance, form.post.origin_amount)
        return numberFmt(rs)
    }),
    max_origin_amount: computed(() => {
        return formState.out_account_id_balance
    }),
    available_color: computed(() => {
        if (form.post.origin_amount) {
            return "black"
        } return "transparent"
    }),
    getDisabledState: name => {
        if (name == 'currency') {
            return true
        }
        return false
    },
    formTitle: computed(() => {
        if (form.mode == "add") {
            return "银行转账-添加"
        }
        else if (form.mode == "edit") {
            return "银行转账-编辑"
        }
        else if (form.mode == "view") {
            return "银行转账-查看"
        }
    })
})
const formRules = reactive({
    "post.attachment_list": [
        {
            required: true,
            validator: (rule, value, call_back) => {
                return uploadRef.value.validate(rule, value, call_back)
            }, trigger: 'change'
        }
    ],
})

// 撤回
const cancelPayout = row => {
    form.cancelNumber = row.NUMBER
    form.cancelPost.voucher_ext_id = row.voucher_ext_last.voucher_ext_id
    form.cancelShow = true
    console.log(form.cancelPost, row);
}
const submitCancelPayout = async () => {
    try {
        const resp = await api.payouts.cancelPayout({ voucher_ext_id: form.cancelPost.voucher_ext_id })
        form.cancelShow = false
        message.success("修改已撤销!")
        listRef.value.update(form.cancelNumber, (d) => {
            d.voucher_ext_last.is_audit = 0
        })
    } catch (error) {
        logger.error('支出历史撤回失败,', error)
    }
}


// 审核
const auditPayout = row => {
    form.auditPost.applicant = row.voucher_ext_last.applicant
    form.auditPost.application_reason = row.voucher_ext_last.application_reason
    form.auditPost.application_time = row.voucher_ext_last.application_time
    form.auditPost.voucher_ext_id = row.voucher_ext_last.voucher_ext_id
    form.auditNumber = row.NUMBER
    form.auditShow = true

}
const submitAuditPayout = async () => {
    try {
        await api.payouts.auditPayout({ voucher_ext_id: form.auditPost.voucher_ext_id })
        form.auditShow = false
        message.success("修改审核已通过!")
        listRef.value.reload()
    } catch (error) {
        logger.error('审核失败,', error)
    }
}

//备注
const modifyNote = (row) => {
    form.noteNumber = row.NUMBER
    form.noteShow = true
    form.notePost.voucher_ext_id = row.voucher_ext_last.voucher_ext_id
    form.notePost.note = row.voucher_ext_last.note
}

const submitModifyNote = async () => {
    try {
        const data = { ...form.notePost }
        await api.payouts.modifyNote(data)
        listRef.value.update(form.noteNumber, (d) => {
            d.voucher_ext_last.note = data.note
        })
        form.noteShow = false
        message.success('备注已修改!')
    } catch (error) {
        logger.error("收入备注修改失败", error)
    }
}

// 编辑
const editNote = info => {
    console.log(store.user);
    form.editNumber = info.NUMBER
    form.editPost.currency = info.currency
    form.editPost.application_reason = ''
    form.editPost.attachment_list = info.attachment_list.map(v => { return { url: v.path } })
    form.editPost.note = info.voucher_ext_last.note
    form.editPost.voucher_ext_id = info.voucher_ext_last.voucher_ext_id
    form.editPost.origin_amount = info.origin_total_amount
    form.editPost.account_title_id = info.payment_info.account_title_id
    form.editShow = true
}

const submitEditPayout = async () => {
    editFormRef.value.validate().then(async valid => {
        try {
            if (valid) {
                const rs = await editUploadRef.value.uploadImage()
                const data = { ...form.editPost }
                console.log('upload rs ', rs);
                if (rs) {
                    data.attachment_list = JSON.stringify(rs)
                } else {
                    data.attachment_list = JSON.stringify([])
                }
                await api.payouts.editPayout(data)
                form.editShow = false
                listRef.value.update(form.editNumber, (d) => {
                    d.voucher_ext_last.is_audit = 1
                    d.voucher_ext_last.applicant = store.user.username
                    d.voucher_ext_last.application_reason = form.editPost.application_reason
                    d.voucher_ext_last.application_time = Date.now() / 1000
                    // d.voucher_ext_last.application_reason = ''
                })
                message.success('收入记录修改成功')
            }
        } catch (error) {
            logger.error("收入修改失败, ", error)
        }
    })
}

//新增
const onSubmit = () => {
    formRef.value.validate().then(async (valid, fields) => {
        if (valid) {
            const uploads = await uploadRef.value.uploadImage()
            const data = { ...form.post }
            data.attachment_list = JSON.stringify(uploads)
            try {
                const resp = await api.payouts.savePayout(data)
                message.success("支出已添加!")
                formRef.value.resetFields()
                listRef.value.reload()
            } catch (error) {
                message.error("支出添加失败!")
            }
        }
    })
}

// 截图
electron.onCapture(async (src) => {
    if (form.mode == 'add') {
        form.post.attachment_list.push({
            url: src
        })
    } else {
        form.editPost.attachment_list.push({
            url: src
        })
    }

})

const crop = () => {
    electron.capture().catch(err => {
        logger.error('capture fail', err)
    })
}

watch(() => form.post.account_id, async () => {
    if (form.post.account_id) {
        formState.out_account_id_loading = true
        const resp = await api.getAccountDetail({ user_id: store.user.id, account_id: form.post.account_id })
        formState.out_account_id_color = 'black'
        formState.out_account_id_loading = false
        formState.out_account_id_balance = numberFmt(resp.available_balance)
        formState.out_account_id_currency = resp.currency
        // formState.available_balance= subNumbers(numberFmt(resp.available_balance), form.post.origin_amount)
        form.post.currency = resp.currency
    } else {
        formState.out_account_id_color = 'transparent'
        formState.out_account_id_balance = ''
        formState.out_account_id_currency = ''
    }
}, { immediate: true })


</script>

<template>
    <div style="display:flex; width:100%;height: 100%; padding: 10px;">
        <div class="left">
            <div class="left-main-pannel">
                <div>支出历史 <span class="display-result">({{ search.totalPage }}条记录)</span>
                    <el-button link :loading="loading" @click="() => {
                    listRef.reload()
                }">
                        <template #loading>
                            <el-icon style="animation: loading-rotate 2s linear infinite;" size="large">
                                <Refresh />
                            </el-icon>
                        </template>
                        <el-icon v-if="!loading" size="large">
                            <Refresh />
                        </el-icon>
                    </el-button>
                </div>

                <el-select style="width: 120px" v-model="search.condition">
                    <el-option label="今天" :value="1"></el-option>
                    <el-option label="昨天" :value="2"></el-option>
                    <el-option label="近7天" :value="3"></el-option>
                    <el-option label="本月" :value="4"></el-option>
                    <el-option label="上月" :value="5"></el-option>
                </el-select>
            </div>
            <LoadingList :fetch="onSearch" :stop-load="stopLoad" ref="listRef" class='loading-list'
                @on-fetch-start="onFetchStart" @on-fetch-done="onFetchDone">
                <template #default="{ info }">
                    <div :class="['record-item', info.voucher_ext_last.is_audit == 1 ? 'audit' : '']">
                        <div> 银行账号： <span class="bold">{{ info.voucher_ext_last?.account_name }}</span> </div>
                        <div> 支出编号： <span>{{ info.sn }} </span></div>
                        <div>支出科目：<span>{{ info?.payment_info?.account_title_parent + ' - ' +
                    info?.payment_info?.account_title }}</span></div>
                        <div>创建时间：<span>{{ dateTimeFmt(info.create_time, true)
                                }}</span></div>
                        <div> 创建： <span>{{ info.creator }}({{ info.department_name }})</span> </div>
                        <div>金额：<el-text>{{ numberFmt(info.origin_total_amount) }}</el-text> <span class="red">{{
                    info.currency }}</span></div>
                        <div>备注：<span>{{ info.voucher_ext_last?.note }}</span></div>
                        <div class="flex-row">附件：
                            <el-button link>查看图片[{{ info.attachment_list?.length }}]</el-button>
                            <el-button link type="primary" v-if="store.canModifyNote"
                                @click="modifyNote(info)">修改备注</el-button>
                            <el-button v-if="store.canModify && info.voucher_ext_last.is_audit !== 1" link type="danger"
                                @click="editNote(info)"> <i class="iconfont icon-edit" style="font-size:10pt"></i>编辑
                            </el-button>
                            <el-button v-if="store.canCancel && info.voucher_ext_last.is_audit == 1" link type="info"
                                @click="cancelPayout(info)"> <i class="iconfont icon-chehui"
                                    style="font-size:10pt"></i>撤销
                            </el-button>
                            <el-button v-if="store.canAudit && info.voucher_ext_last.is_audit == 1" link type="success"
                                @click="auditPayout(info)"> <i class="iconfont icon-pass" style="font-size:10pt"></i>审核
                            </el-button>
                        </div>
                    </div>
                </template>
            </LoadingList>

        </div>
        <div class="right">
            <div class="right-main-pannel">
                <div>支出管理</div>
                <el-form :model="form" label-width="auto" ref="formRef" :rules="formRules">
                    <el-form-item label="支出账号" prop="post.account_id" required>
                        <div style=" display: flex;flex-direction: column;width: 100%;"
                            v-loading="formState.out_account_id_loading">
                            <el-select v-model="form.post.account_id" filterable
                                :disabled="formState.getDisabledState('account_id')">
                                <el-option v-for="item in bank.accounts" :key="item.id" :label="item.account_name"
                                    :value="item.id" />
                            </el-select>

                            <div style="display: flex;justify-content: space-between;align-items: center">
                                <p><span :class="formState.out_account_id_color">实时余额 </span>
                                    <span style="color:black">{{ formState.out_account_id_balance }}</span>
                                    <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
                                </p>

                                <p><span :class="formState.out_account_id_color">可用余额 </span>
                                    <span style="color:black">{{ formState.available_balance }}</span>
                                    <span style="color:red">{{ " " + formState.out_account_id_currency }}</span>
                                </p>
                            </div>
                        </div>
                    </el-form-item>

                    <el-form-item label="支出科目" prop="post.account_title_id"
                        :rules="[{ message: '请选择收入科目', trigger: 'change', required: true }]">
                        <el-select v-model="form.post.account_title_id" filterable>
                            <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name"
                                :value="item.id" />
                        </el-select>
                    </el-form-item>

                    <el-form-item label="金额" prop="post.origin_amount" required
                        :rules="[{ message: '请输入金额', trigger: 'change', required: true }]">
                        <div style=" display: flex; width: 100%; justify-content: space-between">
                            <el-input-number v-model="form.post.origin_amount" :precision="2" :controls="false"
                                :max="formState.max_origin_amount" style="width: 70%">
                            </el-input-number>
                            <el-select :validate-event="false" style="width: 30%; padding-left: 5px"
                                v-model="form.post.currency">
                                <el-option v-for="item in bank.currencies" :key="item.code" :label="item.code"
                                    :value="item.code" />
                            </el-select>
                        </div>
                    </el-form-item>

                    <el-form-item label="备注" prop="post.note">
                        <el-input v-model.trim="form.post.note" :disabled="formState.getDisabledState('note')"
                            type="textarea" :rows="4">
                        </el-input>
                    </el-form-item>

                    <el-form-item label="图片上传" prop="post.attachment_list" required>
                        <Upload action="upload" ref="uploadRef" v-model="form.post.attachment_list" :limit="10"
                            dir="incomes" :size="66" :disabled="formState.getDisabledState('attachment_list')"></Upload>

                    </el-form-item>

                    <div style="display: flex;justify-content: flex-end;position: fixed;bottom: 20px;right: 20px;">
                        <el-button link type="danger" @click="crop">
                            <el-icon>
                                <PictureFilled />
                            </el-icon>截图
                        </el-button>
                        <el-button type="primary" @click="onSubmit">提交</el-button>
                    </div>

                </el-form>
            </div>

        </div>

        <el-drawer v-model="form.editShow" size="50%" destroy-on-close title="支出编辑" :rules="form.editRules"
            @opened="form.mode = 'edit'" @closed="form.mode = 'add'">
            <el-form :model="form.editPost" label-width="auto" ref="editFormRef">
                <el-form-item label="支出科目" prop="account_title_id" required>
                    <el-select v-model="form.editPost.account_title_id" filterable>
                        <el-option v-for="item in bank.payouts" :key="item.id" :label="item.name" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="金额" prop="origin_amount">
                    <el-input-number v-model="form.editPost.origin_amount" :controls="false" :precision="2"
                        style="width: 80%;">
                    </el-input-number>
                    <span class="bold" style="padding-left: 10px;">
                        {{ form.editPost.currency }}
                    </span>
                </el-form-item>
                <el-form-item label="备注" prop="note" :rules="[{ required: true, message: '请填写备注' }]">
                    <el-input type="textarea" :rows="3" v-model="form.editPost.note" clearable></el-input>
                </el-form-item>
                <el-form-item label="修改原因" prop="application_reason" :rules="[{ required: true, message: '请填写修改原因!' }]">
                    <el-input type="textarea" :rows="3" v-model="form.editPost.application_reason"></el-input>
                </el-form-item>
                <el-form-item label="图片" prop="attachment_list">
                    <Upload action="upload" ref="editUploadRef" v-model="form.editPost.attachment_list" :limit="10"
                        dir="incomes" :size="66" />
                </el-form-item>

            </el-form>
            <template #footer>
                <el-button link type="danger" @click="crop">
                    <el-icon>
                        <PictureFilled />
                    </el-icon>截图
                </el-button>
                <el-button type="primary" @click="submitEditPayout">
                    确认
                </el-button>
            </template>
        </el-drawer>


        <el-dialog v-model="form.noteShow" title="备注修改" destroy-on-close>
            <el-form-item label="备注">
                <el-input type='textarea' :rows="3" v-model="form.notePost.note"></el-input>
            </el-form-item>
            <template #footer>
                <el-button type="primary" @click="submitModifyNote">
                    确认
                </el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="form.cancelShow" title="撤销" width="500" destroy-on-close>
            <span>撤销修申请么</span>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="form.cancelShow = false">关闭</el-button>
                    <el-button type="primary" @click="submitCancelPayout">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="form.auditShow" title="审核" width="500" :before-close="handleClose" destroy-on-close>
            <p>修改人: {{ form.auditPost.applicant }}</p>
            <p>提交时间: {{ timestampToFormattedString(form.auditPost.application_time) }}</p>
            <el-form-item label="修改原因: ">
                <el-input type="textarea" readonly v-model="form.auditPost.application_reason" :rows="3"></el-input>
            </el-form-item>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="form.auditShow = false">关闭</el-button>
                    <el-button type="primary" @click="submitAuditPayout">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<style scoped>
.left {
    width: 320px;
    height: 100%;
}

.flex-row {
    display: flex;
    justify-content: flex-start;
    align-items: center
}

.left-main-pannel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 0px;
    margin-bottom: 10px;
    margin-right: 10px;
}

.right {
    height: v-bind("height - 90 + 'px'");
    flex: 1;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 10px 0 #dfe2eb;
    color: #353535;
    padding-left: 10px;
    padding-right: 10px;
}

.right-main-pannel {
    padding: 10px;
    padding-top: 5px;
    border-radius: 10px;
    background-color: white;
}

.display-result {
    font-size: 10pt;
    color: gray;
}

.loading-list {
    height: calc(100vh - 130px);
    width: 310px;
}

:deep(.no-more-data-indicator) {
    margin-right: 5px;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 10px 0 #dfe2eb;
    color: #353535;
}

.record-item {
    margin-right: 5px;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 6px;
    background-color: #fff;
    box-shadow: 0 2px 10px 0 #dfe2eb;
    color: #353535;
}

.record-item * {
    font-size: 9pt;
}

span {
    color: black;
    font-size: 10pt;
    user-select: text
}

.bold {
    font-weight: bold;
}

div,
.black {
    color: black
}

.transparent {
    color: transparent
}

.red {
    color: red
}

.gray {
    color: gray
}

.audit {
    background-image: url('../assets/images/shenpi.svg');
    background-repeat: no-repeat;
    background-position: 90% 10%;
    background-size: 50px 50px;
}
</style>