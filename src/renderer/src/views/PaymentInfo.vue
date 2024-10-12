<script setup>
import { onBeforeMount, reactive, ref, watch, computed } from 'vue'
import PaymentAdd from './PaymentAdd.vue'
import PaymentRecord from './PaymentRecord.vue'
import api from '@/api'
import { numberFmt } from '@/utils/format'
import Message from '@/utils/message'
import { Check, Warning, Remove, QuestionFilled, Eleme } from '@element-plus/icons-vue'
import BankTransferAdd from './BankTransferAdd.vue'
import { useExcelStore } from "@/stores/index"
import { useRoute } from 'vue-router'
const ws = useExcelStore()
const props = defineProps({
  detailId: String,
  mode: {
    type: String,
    default: 'operate'
  }
})
const emit = defineEmits(['update', 'openBatch'])
const route = useRoute()

const approve = ref({})
const reasons = {
  0: '',
  1: '付款方式选择错误',
  2: '顾客收款账号错误',
  3: '打款金额错误',
  4: '打款币种错误',
  5: '其它',
}
const bankAccountTitleIds = [181, 197]
const isBankTransfer = ref(false)

const tableData = ref([])
const firstItem = ref(null)

const showAddDrawer = ref(false)
const showRecordDrawer = ref(false)
const passSingleDialogVisible = ref(false)
const rejectSingleDialogVisible = ref(false)
const rejectSingleCommentVisible = ref(false)
const abnormalSingleDialogVisible = ref(false)
const abnormalCommentVisible = ref(false)
const dialogSingleForm = reactive({
  status: 0,
  reasonType: '',
  comment: ''
})
const dialogSingleFormReset = () => {
  dialogSingleForm.status = 0
  dialogSingleForm.reasonType = ''
  dialogSingleForm.comment = ''
  passSingleDialogVisible.value = false
  rejectSingleDialogVisible.value = false
  rejectSingleCommentVisible.value = false
  abnormalSingleDialogVisible.value = false
  abnormalCommentVisible.value = false
}

watch(() => props.detailId, () => {
  fetchData()
})

watch(() => dialogSingleForm.reasonType, () => {
  if (dialogSingleForm.status == 2) {
    rejectSingleCommentVisible.value = dialogSingleForm.reasonType == 5
  } else if (dialogSingleForm.status == 3) {
    abnormalCommentVisible.value = dialogSingleForm.reasonType == 5
  }
})

onBeforeMount(() => {
  fetchData()
})

const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  Message.success("复制成功")
}
const feePayers = { 0: '--', 1: '我方', 2: '顾客', 3: '双方平摊' }

const fetchData = async () => {
  const data = await api.getPaymentDetail({
    id: props.detailId
  })
  approve.value = data.payment_detail.detail
  approve.value.cashier = data.payment_cashier.cashier
  approve.value.payment_error_msg = data.payment_cashier.payment_error_msg
  approve.value.payment_status = data.payment_cashier.payment_status
  approve.value.fee_payer_str = feePayers[data.payment_detail.detail?.fee_payer]

  tableData.value = data.payment_detail.items
  if (data.payment_detail.items.length > 0) {
    firstItem.value = data.payment_detail.items[0]
    if (bankAccountTitleIds.includes(firstItem.value.account_title_id)) {
      isBankTransfer.value = true
    }
  }
}

const onShowDialog = (status) => {
  dialogSingleForm.status = status
  switch (status) {
    case 1: passSingleDialogVisible.value = true; break;
    case 2: rejectSingleDialogVisible.value = true; break;
    case 3: abnormalSingleDialogVisible.value = true; break;
    default: passSingleDialogVisible.value = true; break;
  }
}

// 审核通过/拒绝
const onReview = async () => {
  if (dialogSingleForm.status == 2) {
    dialogSingleForm.comment = dialogSingleForm.reasonType == 5 ? dialogSingleForm.comment : reasons[dialogSingleForm.reasonType]
    if (!dialogSingleForm.comment) {
      Message.error('请输入拒绝理由')
      return
    }
  }

  if (dialogSingleForm.status == 1) {
    passSingleDialogVisible.value = false
  } else {
    rejectSingleDialogVisible.value = false
  }

  try {
    await api.review({
      id: props.detailId,
      status: dialogSingleForm.status,
      comment: dialogSingleForm.comment.trim()
    })
    Message.success('审批完成')
    // emit('update')
    fetchData()
  } catch (error) {
    Message.success('审批失败')
  } finally {
    dialogSingleFormReset()
  }
}

// 打款异常
const onAbnoraml = async () => {
  dialogSingleForm.comment = dialogSingleForm.reasonType == 5 ? dialogSingleForm.comment : reasons[dialogSingleForm.reasonType]
  if (!dialogSingleForm.comment) {
    Message.error('请输入异常原因')
    return
  }

  abnormalSingleDialogVisible.value = true

  try {
    await api.abnormal({
      purchase_number: approve.value.purchase_number,
      payment_error_msg: dialogSingleForm.comment.trim()
    })
  } catch (error) {
  } finally {
    dialogSingleFormReset()
  }
}

const showOperate = computed(() => {
  if (props.mode === 'view') {
    return false
  }
  if (approve.payment_status === 0) {
    return true
  }
  return false
})
</script>


<template>
  <div class="wrapper">
    <Header>
      <template #title>
        <h4>{{ approve.process_name }}</h4>
      </template>

      <template #option v-if="mode == 'operate'">
        <!-- <el-tooltip content="批量打款" placement="bottom" hide-after="0" transition="none" :disabled="ws.excelLoading">
          <el-button link @click="emit('openBatch')" :loading="ws.excelLoading">
            <template #loading>
              <el-icon class="is-loading" :size="20" color="black">
                <Eleme />
              </el-icon>
            </template>
<el-icon v-if="!ws.excelLoading" :size="20" class="iconfont icon-Excelxieru-xuanzhong">
</el-icon>
</el-button>
</el-tooltip> -->
        <el-tooltip content="新增打款/转账" placement="bottom" hide-after="0" transition="none"
          v-if="route.query.type === 'pending'">
          <el-button size="small" class="option-btn" @click="showAddDrawer = true" link>
            <i class="iconfont icon-edit"></i>
          </el-button>
        </el-tooltip>
        <el-tooltip content="打款记录" placement="bottom-end" hide-after="0" transition="none">
          <el-button size="small" class="option-btn" @click="showRecordDrawer = true" link>
            <i class="iconfont icon-history-record"></i>
          </el-button>
        </el-tooltip>
      </template>

    </Header>

    <el-scrollbar class="info-box">
      <section class="infos">
        <div class="info top">
          <div class="info-item">
            <i class="item-icon iconfont icon-approve"></i>
            <div class="item-label">钉钉编号：</div>
            <div class="item-value">{{ approve.approval_number }}</div>
            <el-tooltip content="复制" placement="right">
              <el-button @click="onCopy(approve.approval_number)" link><i class="iconfont icon-copy"></i></el-button>
            </el-tooltip>
          </div>
        </div>

        <div class="info">
          <div class="info-item">
            <i class="item-icon iconfont icon-category"></i>
            <div class="item-label">类型：</div>
            <div class="item-value">{{ approve.payment_type_name }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-approver"></i>
            <div class="item-label">打款员：</div>
            <div class="item-value">{{ approve.cashier }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-approve-author"></i>
            <div class="item-label">申请人：</div>
            <div class="item-value">{{ approve.creator }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-department"></i>
            <div class="item-label">申请部门：</div>
            <div class="item-value">{{ approve.department_name }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-time"></i>
            <div class="item-label">创建时间：</div>
            <div class="item-value">{{ approve.create_time }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-number"></i>
            <div class="item-label">采购单/流水号：</div>
            <div class="item-value">{{ approve.purchase_number }}</div>
          </div>
        </div>

        <div class="info">
          <div class="info-item">
            <i class="item-icon iconfont icon-amount"></i>
            <div class="item-label">打款金额：</div>
            <div class="item-value">{{ numberFmt(approve.origin_total_amount) }} {{ approve.currency }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-amount-cny"></i>
            <div class="item-label">打款人民币金额：</div>
            <div class="item-value">{{ numberFmt(approve.cny_total_amount) }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-currency-rate"></i>
            <div class="item-label">汇率：</div>
            <div class="item-value">{{ approve.currency_rate }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-undertaker"></i>
            <div class="item-label">手续费承担方：</div>
            <div class="item-value">{{ approve.fee_payer_str }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-system-info"></i>
            <div class="item-label">系统名称：</div>
            <div class="item-value">{{ approve.system_code }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-country"></i>
            <div class="item-label">收款账号国家或地区：</div>
            <div class="item-value">{{ approve.country }}</div>
          </div>
        </div>

        <div class="info bottom">
          <div class="info-item">
            <i class="item-icon iconfont icon-note"></i>
            <div class="item-label">备注：</div>
            <div class="item-value">{{ approve.note }}</div>
          </div>

          <div class="info-item" v-if="approve.payment_error_msg">
            <i class="item-icon iconfont icon-system-info"></i>
            <div class="item-label">异常原因：</div>
            <div class="item-value abnormal">{{ approve.payment_error_msg }}</div>
          </div>
        </div>
      </section>

      <section class="operate-box" v-if="showOperate">
        <i class="item-icon iconfont icon-operate"></i>
        <div class="item-label">操作：</div>
        <div class="operates">
          <el-button type="success" :icon="Check" @click="onShowDialog(1)" plain round>通过</el-button>
          <el-button type="danger" :icon="Remove" @click="onShowDialog(2)" plain round>拒绝</el-button>
          <el-button type="info" :icon="Warning" @click="onShowDialog(3)" plain round>异常</el-button>
        </div>
      </section>

      <section class="table-box">
        <el-table :data="tableData" style="width: 100%">
          <!-- <el-table-column prop="item_id" label="编号" width="80" /> -->
          <el-table-column label="信息" width="160">
            <template #default="scope">
              <div class="select-text">编号：{{ scope.row.item_id }}</div>
              <div class="select-text">科目：{{ scope.row.account_title_parent }} - {{ scope.row.account_title }}</div>
              <div class="select-text">金额：{{ numberFmt(scope.row.origin_amount) }} {{ scope.row.currency }}</div>
              <div class="select-text">人民币金额：{{ numberFmt(scope.row.cny_amount) }} CNY</div>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注">
            <template #default="{ row }">
              <div style="white-space: pre-wrap;user-select: text">
                {{ row.note }}
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </el-scrollbar>

    <!-- 新增打款抽屉 -->
    <el-drawer v-model="showAddDrawer" :title="isBankTransfer ? '新增银行转账' : '新增打款'" direction="rtl" size="600"
    :close-on-click-modal="false"
      destroy-on-close>
      <BankTransferAdd :item="firstItem" @close="showAddDrawer = false" v-if="isBankTransfer" />
      <PaymentAdd :approve="approve" @close="showAddDrawer = false" v-else />
    </el-drawer>

    <!-- 打款记录抽屉 -->
    <el-drawer v-model="showRecordDrawer" title="打款记录" direction="rtl" size="70%" class="records" destroy-on-close :close-on-click-modal="false">
      <PaymentRecord />
    </el-drawer>

    <!-- 打款通过确认弹窗 -->
    <el-dialog v-model="passSingleDialogVisible" width="320" align-center :close-on-click-modal="false">
      <div class="dialog-content"><el-icon size="20" color="#409eff">
          <QuestionFilled />
        </el-icon> 确认已完成打款了吗？</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogSingleFormReset">取消</el-button>
          <el-button type="primary" @click="onReview">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打款拒绝确认弹窗 -->
    <el-dialog v-model="rejectSingleDialogVisible" title="拒绝原因" width="320" align-center :close-on-click-modal="false">
      <el-form :model="dialogSingleForm">
        <el-form-item>
          <el-select v-model="dialogSingleForm.reasonType">
            <el-option label="请选择" value="" />
            <el-option label="付款方式选择错误" value="1" />
            <el-option label="顾客收款账号错误" value="2" />
            <el-option label="打款金额错误" value="3" />
            <el-option label="打款币种错误" value="4" />
            <el-option label="其它原因" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="rejectSingleCommentVisible">
          <el-input v-model="dialogSingleForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因"
            spellcheck="false" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogSingleFormReset">取消</el-button>
          <el-button type="primary" @click="onReview">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打款异常弹窗 -->
    <el-dialog v-model="abnormalSingleDialogVisible" title="异常原因" width="320" align-center :close-on-click-modal="false">
      <el-form :model="dialogSingleForm">
        <el-form-item>
          <el-select v-model="dialogSingleForm.reasonType">
            <el-option label="请选择" value="" />
            <el-option label="付款方式选择错误" value="1" />
            <el-option label="顾客收款账号错误" value="2" />
            <el-option label="打款金额错误" value="3" />
            <el-option label="打款币种错误" value="4" />
            <el-option label="其它原因" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="abnormalCommentVisible">
          <el-input v-model="dialogSingleForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因"
            spellcheck="false" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogSingleFormReset">取消</el-button>
          <el-button type="primary" @click="onAbnoraml">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>


<style scoped>
.wrapper {
  height: 100%;
}

.select-text {
  user-select: text
}

.info-box {
  width: 100%;
  height: calc(100% - 66px);
  overflow-y: auto;
}

.infos,
.table-box {
  width: calc(100% - 24px);
}

.infos {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin: 12px 12px 0;
}

.info {
  flex: 1;
  min-width: 240px;
  padding: 5px 8px;
}

.info.top,
.info.bottom {
  min-width: 100%;
}

.info,
.operate-box,
.table-box {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 1px 1px 0 0 #dcdee5;
  color: #353535;
  overflow: hidden;
}

.operate-box {
  display: flex;
  align-items: center;
  margin: 12px 12px 0;
  padding: 8px;
}

.operates {
  display: flex;
  flex: 1;
}

.operates :deep(.el-icon) {
  font-size: 1.2em;
}

.table-box {
  margin: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 3px 0;
}

.item-icon {
  height: 25px;
  line-height: 25px;
  padding-right: 5px;
  font-size: 1em;
  color: #99a;
}

.item-label {
  height: 25px;
  line-height: 25px;
  color: #99a;
  font-size: 0.75em;
}

.item-value {
  flex: 1;
  color: #353549;
  font-size: 0.8em;
  line-height: 25px;
}

.top .item-value {
  flex: none;
  font-size: 0.9em;
}

.top .el-button i {
  font-size: 1.3em;
  color: #888;
}

.dialog-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.abnormal {
  color: #ef8787;
}
</style>