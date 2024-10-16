<script setup>
import { onBeforeMount, reactive,ref } from 'vue'
import api from '@/api'
import { Check, DocumentDelete, Edit, Picture, RefreshLeft } from '@element-plus/icons-vue'
import Message from '@/utils/message'
import { dateTimeFmt, numberFmt, timestampToFormattedString } from '@/utils/format'
import PaymentRecordEdit from './paymentRecordEdit.vue'
import * as XLSX from "xlsx"
import { getExcelColumnLetter } from '@/utils/tools'
import { useUserStore } from "@/stores/index"

const props = defineProps({
  condition: {
    type: String,
    default: '1'
  },
  content: {
    type: String,
    default: ''
  },
  expands: {
    type: Array,
    default: () => []
  }
})

const store = useUserStore()

const form = reactive({
  // condition: '1',
  // content: '',
  condition: props.condition,
  content: props.content,
  page: 1,
  limit: 10,
})

const table = reactive({
  data: [],
  total: 0
})

const paymentTypes = {
  1: '报销审批',
  2: '人民币款项支付',
  3: '外币银行支付',
  4: '外币PayPal支付',
  5: '财务盘账'
}

const feePlayerTypes = {
  0: '',
  1: '我方',
  2: '顾客',
  3: '双方平摊',
}

const onLimitChange = val => {
  form.limit = val
  onSubmit()
}
const onPageChange = val => {
  form.page = val
  onSubmit()
}

const onSubmit = async () => {
  try {
    const data = await api.getPaymentRecordList(form)
    table.data = data.list
    table.total = data.count
    if(props.expands.length){
      tableRef.value.toggleRowExpansion(table.data[0])
    }
  } catch (error) {
    console.log(error)
  }
}

const onInputChange = val => {
  form.content = val.trim()
  onSubmit()
}

const onExport = async () => {
  try {
    const data = await api.exportPaymentRecordList(form)
    // 筛选字段
    const fields = ['sn', 'payment_type', 'type_name', 'creator', 'department_name', 'create_time', 'origin_total_amount', 'currency', 'payment_creator', 'payment_department_name', 'fee_payer', 'account_name', 'receiving_account', 'transaction_number', 'note', 'system_code', 'purchase_number']
    const labels = ['打款流水号', '打款类型', '支付类型', '打款员', '打款员部门', '打款时间', '打款金额', '币种', '申请人', '申请人部门', '手续费承担方', '打款银行账号', '收款人账号', '交易流水号', '打款备注', '系统名称', '采购单/流水号']

    // 使用获取指定字段的数据
    data.list = data.list.map(v => {
      const obj = {}
      fields.forEach(field => {
        if (field == 'payment_type') {
          obj[field] = paymentTypes[v[field]]
        } else if (field == 'create_time' || field == 'update_time') {
          obj[field] = dateTimeFmt(v[field], 2)
        } else if (field == 'origin_total_amount') {
          obj[field] = numberFmt(v[field])
        } else if (field == 'fee_payer') {
          obj[field] = feePlayerTypes[v[field]]
        } else {
          // 多层级取值
          // const parts = field.split('.')
          // let value = v
          // for (let i = 0; i < parts.length; i++) {
          //   if (value && typeof value === 'object') {
          //     value = value[parts[i]]
          //   } else {
          //     value = undefined
          //     break
          //   }
          // }
          // obj[field] = value
          obj[field] = v[field]
        }
      })
      return obj
    })

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data.list)
    // 设置表头
    for (let i = 0; i < labels.length; i++) {
      XLSX.utils.sheet_add_aoa(worksheet, [[labels[i]]], { origin: getExcelColumnLetter(i + 1) + '1' })
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    XLSX.writeFile(workbook, `百舟打款助手打款记录_${dateTimeFmt(new Date(), 5)}.xlsx`)
  } catch (error) {
    console.log(error)
  }
}

const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  Message.success("复制成功")
}

const tableRef = ref(null)
const onExpandRow = async (row, _) => {
  row.isLoading = row.voucher_ext_list == undefined || row.voucher_ext_list.length == 0
  try {
    const data = await api.getPaymentRecordExtList({ voucher_id: row.voucher_id })
    row.voucher_ext_list = data.list
  } catch(err){
    console.log('err ==> ', err)
  }finally {
    row.isLoading = false
  }
}

const dialog = reactive({
  editVisible: false,
  cancelVisible: false,
  auditVisible: false,
  ext: null
})
const onEditExt = (index, subIndex) => {
  const ext = table.data[index].voucher_ext_list[subIndex]
  dialog.ext = ext
  dialog.editVisible = true
}
const onShowAudit = (index, subIndex) => {
  const ext = table.data[index].voucher_ext_list[subIndex]
  dialog.ext = ext
  dialog.auditVisible = true
}
const onShowCancel = (index, subIndex) => {
  const ext = table.data[index].voucher_ext_list[subIndex]
  dialog.ext = ext
  dialog.cancelVisible = true
}

const onCancel = async () => {
  try {
    await api.cancelModify({
      account_id: dialog.ext.account_id,
      voucher_ext_id: dialog.ext.voucher_ext_id
    })
    Message.success("撤销成功")
    onSubmit()
  } finally {
    dialog.cancelVisible = false
    onSubmit()
  }
}

const onAudit = async () => {
  try {
    await api.auditModify({
      account_id: dialog.ext.account_id,
      voucher_ext_id: dialog.ext.voucher_ext_id
    })
    Message.success("审核成功")
  } finally {
    dialog.auditVisible = false
    onSubmit()
  }
}

onBeforeMount(() => {
  onSubmit()
})
</script>


<template>
  <el-form class="filter" :inline="true" :model="form" @submit.prevent>
    <el-form-item>
      <el-select v-model="form.condition" placeholder="请选择时间" @change="onSubmit">
        <el-option label="今天" value="1" />
        <el-option label="昨天" value="2" />
        <el-option label="近7天" value="3" />
        <el-option label="本月" value="4" />
        <el-option label="上个月" value="5" />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-input v-model="form.content" placeholder="请输入流水编号" @change="onInputChange" clearable />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :icon="DocumentDelete" @click="onExport" plain>导出</el-button>
    </el-form-item>
  </el-form>

  <el-table :data="table.data" class="table" row-key="voucher_id" @expand-change="onExpandRow"
    :expand-row-keys="props.expands" ref="tableRef">
    <el-table-column type="expand">
      <template #default="props">
        <div class="table-wrap" v-loading="props.row?.isLoading">
          <div class="table-ext-box" v-for="(ext, subIndex) in props.row.voucher_ext_list" :key="ext.voucher_ext_id">
            <!-- 信息显示 -->
            <div class="detail">
              <p class="item">
              <div style="display: flex;align-items: center;gap: 30px">
                <div>
                  <span class="item-label">付款账号：</span>
                  <span class="item-value">{{ ext.account_name }}</span>
                </div>
                <span>{{ timestampToFormattedString(ext.create_time) }}</span>
              </div>
              </p>
              <p class="item">
                <span class="item-label">收款账号：</span>
                <span class="item-value">{{ ext.receiving_account }}</span>

              </p>
              <p class="item">
                <span class="item-label">交易流水：</span>
                <span class="item-value">{{ ext.transaction_number }}</span>
              </p>
              <p class="item">
                <span class="item-label">打款金额：</span>
                <span class="item-value">
                  <span class="span-amount">{{ numberFmt(ext.origin_amount) }}</span>
                  <span class="span-bold">{{ ext.currency }}</span>
                </span>
              </p>
              <p class="item">
                <span class="item-label">备注：</span>
                <span class="item-value">{{ ext.note }}</span>
              </p>
              <div class="attachments">
                <span class="item-label">附件：</span>
                <span class="item-value">共{{ ext.attachment_list.length }}件</span>
                <el-image class="img-preview" :src="ext.attachment_list[0].path" :zoom-rate="1.2" :max-scale="7"
                  :min-scale="0.2" :preview-src-list="ext.attachment_list.map(item => item.path)" fit="cover"
                  v-if="ext.attachment_list.length > 0">
                  <template #error>
                    <div class="image-slot">
                      <el-icon>
                        <Picture />
                      </el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>

            <!-- 操作 -->
            <div class="options" v-show="ext.is_audit == 0">
              <el-tooltip content="编辑" placement="left">
                <el-button type="primary" :icon="Edit" class="wrap-edit" @click="onEditExt(props.$index, subIndex)"
                  link></el-button>
              </el-tooltip>
            </div>
            <div class="options" v-show="ext.is_audit == 1">
              <el-tooltip content="撤销" placement="left">
                <el-button type="danger" :icon="RefreshLeft" class="wrap-edit" v-if="store.canCancel"
                  @click="onShowCancel(props.$index, subIndex)" link></el-button>
              </el-tooltip>
              <el-tooltip content="审核" placement="left">
                <el-button type="success" :icon="Check" class="wrap-edit" v-if="store.canAudit"
                  @click="onShowAudit(props.$index, subIndex)" link></el-button>
              </el-tooltip>
            </div>
          </div>

          <!-- 费用明细 -->
          <el-table class="sub-table" :data="props.row.payment_items" row-key="item_id" border>
            <el-table-column type="index" label="#" width="30" />
            <!-- <el-table-column label="标题" width="150">
              <template #default="subscope">{{ subscope.row.account_title_parent }} - {{ subscope.row.account_title
                }}</template>
            </el-table-column> -->
            <el-table-column label="信息" width="160">
              <template #default="subscope" style="user-select: text;">
                <div class="select-text">标题: {{ subscope.row.account_title_parent }} - {{ subscope.row.account_title }}
                </div>
                <div class="select-text">金额: {{ numberFmt(subscope.row.origin_amount) }} {{ subscope.row.currency }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="note">
              <template #default="{ row }">
                <div style="white-space: pre-wrap;user-select: text;">
                  {{ row.note }}
                </div>
              </template>

            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="打款信息">
      <template #default="scope">
        <div class="item">
          <span class="item-label">钉钉编号：</span>
          <span class="item-value">{{ scope.row.sn }}</span>
          <el-button @click="onCopy(scope.row.sn)" link><i class="iconfont icon-copy"></i></el-button>
        </div>
        <div class="item">
          <span class="item-label">打款名称：</span>
          <span class="item-value">{{ scope.row.account_title }}</span>
        </div>
        <div class="item">
          <div style="display: flex;gap: 26px;">
            <div>
              <span class="item-label">打款类型：</span>
              <span class="item-value">{{ paymentTypes[scope.row.payment_type] }}</span>
            </div>
            <div>
              <span class="item-label">明细</span>
              <span class="item-value">（{{ scope.row.voucher_ext_count }}）</span>
            </div>
          </div>
        </div>
      </template>
    </el-table-column>

    <el-table-column width="240">
      <template #default="scope">
        <div class="item">
          <span class="item-label">打款时间：</span>
          <span class="item-value">{{ dateTimeFmt(scope.row.create_time, 2) }}</span>
        </div>
        <div class="item">
          <span class="item-label">支出金额：</span>
          <span class="item-value">
            <span class="span-amount">{{ numberFmt(scope.row.origin_total_amount) }}</span>
            <span class="span-bold">{{ scope.row.currency }}</span>
          </span>
        </div>
        <div class="item">
          <span class="item-label">申请人：</span>
          <span class="item-value">{{ scope.row.payment_creator }}（{{ scope.row.payment_department_name }}）</span>
        </div>
        <div class="status-img" v-if="scope.row.voucher_ext_last.is_audit === 1">
          <img src="../assets/images/audit.png" alt=""></img>
        </div>
      </template>
    </el-table-column>

    <template #empty><el-empty class="empty" description="~ 空空如也 ~" /></template>
  </el-table>

  <el-pagination v-model:current-page="form.page" v-model:page-size="form.limit" :page-sizes="[10, 30, 50, 100]"
    layout="total, sizes, prev, pager, next" :total="table.total" @size-change="onLimitChange"
    @current-change="onPageChange" />

  <el-dialog v-model="dialog.editVisible" title="修改打款记录" width="540" :close-on-click-modal="false"
    :close-on-press-escape="false" align-center>
    <PaymentRecordEdit :ext="dialog.ext" @close="dialog.editVisible = false" />
  </el-dialog>

  <el-dialog v-model="dialog.cancelVisible" title="撤销提示" width="400" :close-on-click-modal="false"
    :close-on-press-escape="false">
    <span>确定要撤销修改审核吗？</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialog.cancelVisible = false">关闭</el-button>
        <el-button type="primary" @click="onCancel">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="dialog.auditVisible" title="审核提示" width="400" :close-on-click-modal="false"
    :close-on-press-escape="false">
    <div class="dialog-content">
      <div class="item">
        <div class="item-label">修改人：</div>
        <div class="item-value">{{ dialog.ext.applicant }}</div>
      </div>
      <div class="item">
        <div class="item-label">修改时间：</div>
        <div class="item-value">{{ timestampToFormattedString(dialog.ext.application_time) }}</div>
      </div>
      <div class="item">
        <div class="item-label">修改原因：</div>
        <div class="item-value">{{ dialog.ext.application_reason }}</div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialog.auditVisible = false">关闭</el-button>
        <el-button type="primary" @click="onAudit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>


<style scoped>
.el-form--inline {
  display: flex;
  justify-content: flex-start;
  gap: 0 8px;
  padding: 0 12px;
}

.select-text {
  user-select: text
}

.filter .el-form-item {
  margin: 0;
}

.filter .el-input {
  width: 210px;
}

.filter .el-select {
  width: 90px;
}

.table {
  height: calc(100% - 80px);
  margin: 8px 0;
}

.el-table :deep(.cell) {
  padding: 0 5px;
}

:deep(.el-table__cell) {
  position: static !important;
}

.status-img {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 64px;
  height: 50px;
}

.status-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item {
  display: flex;
  align-items: center;
}

.detail .item {
  margin-bottom: 5px;
}

.item-label,
:deep(.el-form-item__label) {
  color: #99a;
  font-size: 12px;
}

.item-value {
  color: #353549;
  font-size: 13px;
}

.span-amount {
  font-weight: 600;
  color: #f56c6c;
}

.span-bold {
  padding-left: 5px;
  font-weight: 600;
}

.item .el-button {
  margin-left: 4px;
}

.attachments {
  display: flex;
  align-items: flex-start;
}

.img-preview {
  width: 30px;
  height: 30px;
  margin: 0 0 5px 5px;
  border-radius: 4px;
}

:deep(.el-table__cell.el-table__expanded-cell) {
  padding: 8px 12px !important;
  background: #f5f7fa;
  box-shadow: inset 1px 1px 4px 0 #b0bbd1;
}

:deep(.el-table__expanded-cell:hover) {
  background-color: #f5f7fa !important;
}

.sub-table :deep(tr:hover>td.el-table__cell) {
  background-color: #fff;
}

:deep(.el-table__row) {
  position: relative;
}

.table-ext-box {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}

.table-ext-box+.table-ext-box {
  border-top: 2px dashed #ebeef5;
}

.table-ext-box .detail {
  flex: 1;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 5px 0;
}

.wrap-edit {
  width: 36px;
  height: 36px;
  margin: 0;
  font-size: 20px;
}

.el-pagination {
  padding: 0 12px;
}
</style>