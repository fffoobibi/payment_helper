<script setup>
import { onBeforeMount, reactive } from 'vue'
import api from '@/api'
import { DocumentDelete, Edit, Picture } from '@element-plus/icons-vue'
import Message from '@/utils/message'
import { dateTimeFmt, numberFmt } from '@/utils/format'
import PaymentRecordEdit from './paymentRecordEdit.vue'

const form = reactive({
  condition: '1',
  content: '',
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
  } catch (error) {
    console.log(error)
  }
}

const onInputChange = val => {
  form.content = val.trim()
  onSubmit()
}

const onExport = async () => {
  // try {
  //   const data = await api.getPaymentRecordList(form)
  //   const workbook = XLSX.utils.book_new()
  //   const worksheet = XLSX.utils.json_to_sheet(data.list)
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  //   XLSX.writeFile(workbook, '打款记录.xlsx')
  // } catch (error) {
  //   console.log(error)
  // }
}

const onCopy = async text => {
  await navigator.clipboard.writeText(text)
  Message.success("复制成功")
}

const onExpandRow = async (row, _) => {
  row.isLoading = row.voucher_ext_list == undefined || row.voucher_ext_list.length == 0
  try {
    const data = await api.getPaymentRecordExtList({voucher_id: row.voucher_id})
    row.voucher_ext_list = data.list
  } catch (error) {
    console.log(error)
  } finally {
    row.isLoading = false
  }
}

const dialog = reactive({
  visible: false,
  ext: null
})
const onEditExt = (index, subIndex) => {
  const ext = table.data[index].voucher_ext_list[subIndex]
  dialog.ext = ext
  dialog.visible = true
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

  <el-table :data="table.data" class="table" row-key="voucher_id" @expand-change="onExpandRow">
    <el-table-column type="expand">
      <template #default="props">
        <div class="table-wrap" v-loading="props.row?.isLoading">
          <div class="table-ext-box" v-for="(ext, subIndex) in props.row.voucher_ext_list" :key="ext.voucher_ext_id">
            <!-- 信息显示 -->
            <div class="detail">
              <p class="item">
                <span class="item-label">付款账号：</span>
                <span class="item-value">{{ ext.account_name }}</span>
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
                <span class="item-label">支出金额：</span>
                <span class="item-value">
                  <span class="span-amount">{{ numberFmt(ext.origin_total_amount) }}</span>
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
                <el-image
                  class="img-preview"
                  :src="ext.attachment_list[0].path"
                  :zoom-rate="1.2"
                  :max-scale="7"
                  :min-scale="0.2"
                  :preview-src-list="ext.attachment_list.map(item => item.path)"
                  fit="cover"
                >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
                </el-image>
              </div>
            </div>

            <!-- 操作 -->
            <div class="options" v-show="ext.is_audit == 0">
              <el-button type="primary" :icon="Edit" class="wrap-edit" @click="onEditExt(props.$index, subIndex)" link></el-button>
            </div>
          </div>

          <!-- 费用明细 -->
          <el-table class="sub-table" :data="props.row.payment_items" row-key="item_id" border>
            <el-table-column type="index" label="#" width="30" />
            <el-table-column label="标题" width="150">
              <template #default="subscope">{{ subscope.row.account_title_parent }} - {{ subscope.row.account_title }}</template>
            </el-table-column>
            <el-table-column label="打款金额" width="120">
              <template #default="subscope">{{ numberFmt(subscope.row.origin_amount) }} {{ subscope.row.currency }}</template>
            </el-table-column>
            <el-table-column label="备注" prop="note" />
          </el-table>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="打款信息">
      <template #default="scope">
        <div class="item">
          <span class="item-label">流水编号：</span>
          <span class="item-value">{{ scope.row.sn }}</span>
          <el-button @click="onCopy(scope.row.sn)" link><i class="iconfont icon-copy"></i></el-button>
        </div>
        <div class="item">
          <span class="item-label">打款名称：</span>
          <span class="item-value">{{ scope.row.account_title }}</span>
        </div>
        <div class="item">
          <span class="item-label">打款类型：</span>
          <span class="item-value">{{ paymentTypes[scope.row.payment_type] }}</span>
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

  <el-pagination
    v-model:current-page="form.page"
    v-model:page-size="form.limit"
    :page-sizes="[10, 30, 50, 100]"
    layout="total, sizes, prev, pager, next"
    :total="table.total"
    @size-change="onLimitChange"
    @current-change="onPageChange"
  />

  <el-dialog v-model="dialog.visible" title="修改打款记录" width="540px" :close-on-click-modal="false" :close-on-press-escape="false">
    <PaymentRecordEdit :ext="dialog.ext" @close="dialog.visible = false" />
  </el-dialog>
</template>


<style scoped>
.el-form--inline {
  display: flex;
  justify-content: flex-start;
  gap: 0 8px;
  padding: 0 12px;
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
.img-preview{
  width: 30px;
  height: 30px;
  margin: 0 0 5px 5px;
  border-radius: 4px;
}
:deep(.el-table__cell.el-table__expanded-cell) {
  padding: 8px 12px !important;
  background: #f5f7fa;
  box-shadow: inset 2px 2px 10px 0 #abaeb4;
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
.table-ext-box + .table-ext-box {
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