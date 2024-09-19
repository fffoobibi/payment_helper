<script setup>
import { onBeforeMount, reactive, ref, watch } from 'vue'
import PaymentAdd from './PaymentAdd.vue'
import PaymentRecord from './PaymentRecord.vue'
import api from '@/api'
import { numberFmt } from '@/utils/format'
import Message from '@/utils/message'
import { Check, Warning, Remove, QuestionFilled } from '@element-plus/icons-vue'

const props = defineProps({
  detailId: String,
})

const emit = defineEmits(['update'])

const approve = ref({})
const reasons = {
  0: '',
  1: '付款方式选择错误',
  2: '顾客收款账号错误',
  3: '打款金额错误',
  4: '打款币种错误',
  5: '其它',
}

const tableData = ref([])

const showAddDrawer = ref(false)
const showRecordDrawer = ref(false)
const passDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const rejectCommentVisible = ref(false)
const abnormalDialogVisible = ref(false)
const abnormalCommentVisible = ref(false)
const dialogForm = reactive({
  status: 0,
  reasonType: '',
  comment: ''
})
const dialogFormReset = () => {
  dialogForm.status = 0
  dialogForm.reasonType = ''
  dialogForm.comment = ''
  passDialogVisible.value = false
  rejectDialogVisible.value = false
  rejectCommentVisible.value = false
  abnormalDialogVisible.value = false
  abnormalCommentVisible.value = false
}

watch(() => props.detailId, () => {
  fetchData()
})

watch(() => dialogForm.reasonType, () => {
  if (dialogForm.status == 2) {
    rejectCommentVisible.value = dialogForm.reasonType == 5
  } else if (dialogForm.status == 3) {
    abnormalCommentVisible.value = dialogForm.reasonType == 5
  }
})

onBeforeMount(() => {
  fetchData()
})

const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  Message.success("复制成功")
}

const fetchData = async () => {
  const data = await api.getPaymentDetail({
    id: props.detailId
  })
  approve.value = data.payment_detail.detail
  approve.value.cashier = data.payment_cashier.cashier
  approve.value.payment_error_msg = data.payment_cashier.payment_error_msg
  approve.value.payment_status = data.payment_cashier.payment_status
  tableData.value = data.payment_detail.items
}

const onShowDialog = status => {
  dialogForm.status = status
  switch (status) {
    case 1: passDialogVisible.value = true; break;
    case 2: rejectDialogVisible.value = true; break;
    case 3: abnormalDialogVisible.value = true; break;
    default: passDialogVisible.value = true; break;
  }
}

// 审核通过/拒绝
const onReview = async () => {
  if (dialogForm.status == 2) {
    dialogForm.comment = dialogForm.reasonType == 5 ? dialogForm.comment : reasons[dialogForm.reasonType]
    if (!dialogForm.comment) {
      Message.error('请输入拒绝理由')
      return
    }
  }

  if (dialogForm.status == 1) {
    passDialogVisible.value = false
  } else {
    rejectDialogVisible.value = false
  }

  try {
    await api.review({
      id: props.detailId,
      status: dialogForm.status,
      comment: dialogForm.comment.trim()
    })
    Message.success('审批完成')
    // emit('update')
    fetchData()
  } catch (error) {
    Message.success('审批失败')
  } finally {
    dialogFormReset()
  }
}

// 打款异常
const onAbnoraml = async () => {
  dialogForm.comment = dialogForm.reasonType == 5 ? dialogForm.comment : reasons[dialogForm.reasonType]
  if (!dialogForm.comment) {
    Message.error('请输入异常原因')
    return
  }

  abnormalDialogVisible.value = true

  try {
    await api.abnormal({
      purchase_number: approve.value.purchase_number,
      payment_error_msg: dialogForm.comment.trim()
    })
  } catch (error) {
  } finally {
    dialogFormReset()
  }
}

</script>


<template>
  <div class="wrapper">
    <Header>
      <template #title>
        <h4>{{ approve.process_name }}</h4>
      </template>

      <template #option>
        <el-button size="small" class="option-btn" @click="showAddDrawer = true" title="新增打款" link>
          <i class="iconfont icon-edit"></i>
        </el-button>
        <el-button size="small" class="option-btn" @click="showRecordDrawer = true" title="打款记录" link>
          <i class="iconfont icon-history-record"></i>
        </el-button>
      </template>
    </Header>

    <el-scrollbar class="info-box">
      <section class="infos">
        <div class="info top">
          <div class="info-item">
            <i class="item-icon iconfont icon-approve"></i>
            <div class="item-label">钉钉编号：</div>
            <div class="item-value">{{ approve.approval_number }}</div>
            <el-button @click="onCopy(approve.approval_number)" link><i class="iconfont icon-copy"></i></el-button>
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
            <div class="item-value">{{ approve.fee_payer }}</div>
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

      <section class="operate-box" v-if="approve.payment_status === 0">
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
          <el-table-column prop="item_id" label="编号" width="80" />
          <el-table-column label="信息">
            <template #default="scope">
              <div>科目：{{ scope.row.account_title_parent }} - {{ scope.row.account_title }}</div>
              <div>金额：{{ numberFmt(scope.row.origin_amount) }} {{ scope.row.currency }}</div>
              <div>人民币金额：{{ numberFmt(scope.row.cny_amount) }} CNY</div>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注" />
        </el-table>
      </section>
    </el-scrollbar>

    <!-- 新增打款抽屉 -->
    <el-drawer v-model="showAddDrawer" title="新增打款" direction="rtl" size="600" destroy-on-close>
      <PaymentAdd :approve="approve" @close="showAddDrawer = false" />
    </el-drawer>

    <!-- 打款记录抽屉 -->
    <el-drawer v-model="showRecordDrawer" title="打款记录" direction="rtl" size="600" class="records" destroy-on-close>
      <PaymentRecord />
    </el-drawer>

    <!-- 打款通过确认弹窗 -->
    <el-dialog v-model="passDialogVisible" width="320" align-center>
      <div class="dialog-content"><el-icon size="20" color="#409eff"><QuestionFilled /></el-icon> 确认已完成打款了吗？</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormReset">取消</el-button>
          <el-button type="primary" @click="onReview">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打款拒绝确认弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝原因" width="320" align-center>
      <el-form :model="dialogForm">
        <el-form-item>
          <el-select v-model="dialogForm.reasonType">
            <el-option label="请选择" value="" />
            <el-option label="付款方式选择错误" value="1" />
            <el-option label="顾客收款账号错误" value="2" />
            <el-option label="打款金额错误" value="3" />
            <el-option label="打款币种错误" value="4" />
            <el-option label="其它原因" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="rejectCommentVisible">
          <el-input v-model="dialogForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因" spellcheck="false" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormReset">取消</el-button>
          <el-button type="primary" @click="onReview">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 打款异常弹窗 -->
    <el-dialog v-model="abnormalDialogVisible" title="异常原因" width="320" align-center>
      <el-form :model="dialogForm">
        <el-form-item>
          <el-select v-model="dialogForm.reasonType">
            <el-option label="请选择" value="" />
            <el-option label="付款方式选择错误" value="1" />
            <el-option label="顾客收款账号错误" value="2" />
            <el-option label="打款金额错误" value="3" />
            <el-option label="打款币种错误" value="4" />
            <el-option label="其它原因" value="5" />
          </el-select>
        </el-form-item>
        <el-form-item v-show="abnormalCommentVisible">
          <el-input v-model="dialogForm.comment" autocomplete="off" type="textarea" placeholder="请输入其它原因" spellcheck="false" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormReset">取消</el-button>
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
  box-shadow: 0 2px 10px 0 #d9dbe1;
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