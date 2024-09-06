<script setup>
import { onBeforeMount, ref, watch } from 'vue'
import PaymentAdd from './PaymentAdd.vue'
import api from '@/api'

const props = defineProps({
  detailId: String
})

const detailData = ref({})

const tableData = ref([])

const showDrawer = ref(false)

watch(() => props.detailId, () => {
  fetchData()
})

onBeforeMount(() => {
  fetchData()
})

const fetchData = async () => {
  const data = await api.getPaymentDetail({
    id: props.detailId
  })
  detailData.value = data.payment_detail.detail
  detailData.value.cashier = data.payment_cashier.cashier
  detailData.value.payment_status = data.payment_cashier.payment_status
  tableData.value = data.payment_detail.items
}

</script>


<template>
  <div class="wrapper">
    <Header>
      <template #title>
        <h4>{{ detailData.process_name }}</h4>
      </template>

      <template #option>
        <el-button size="small" class="option-btn" @click="showDrawer = true" link>
          <i class="iconfont icon-edit"></i>
        </el-button>
      </template>
    </Header>

    <el-scrollbar class="info-box">
      <section class="infos">
        <div class="info top">
          <div class="info-item">
            <i class="item-icon iconfont icon-approve"></i>
            <div class="item-label">钉钉编号：</div>
            <div class="item-value">{{ detailData.approval_number }}</div>
            <el-button link><i class="iconfont icon-copy"></i></el-button>
          </div>
        </div>

        <div class="info">
          <div class="info-item">
            <i class="item-icon iconfont icon-category"></i>
            <div class="item-label">类型：</div>
            <div class="item-value">{{ detailData.payment_type_name }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-approver"></i>
            <div class="item-label">打款员：</div>
            <div class="item-value">{{ detailData.cashier }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-approve-author"></i>
            <div class="item-label">申请人：</div>
            <div class="item-value">{{ detailData.creator }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-department"></i>
            <div class="item-label">申请部门：</div>
            <div class="item-value">{{ detailData.department_name }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-time"></i>
            <div class="item-label">创建时间：</div>
            <div class="item-value">{{ detailData.create_time }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-number"></i>
            <div class="item-label">采购单/流水号：</div>
            <div class="item-value">{{ detailData.purchase_number }}</div>
          </div>
        </div>

        <div class="info">
          <div class="info-item">
            <i class="item-icon iconfont icon-amount"></i>
            <div class="item-label">打款金额：</div>
            <div class="item-value">{{ detailData.origin_total_amount }} {{ detailData.currency }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-amount-cny"></i>
            <div class="item-label">打款人民币金额：</div>
            <div class="item-value">{{ detailData.cny_total_amount }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-currency-rate"></i>
            <div class="item-label">汇率：</div>
            <div class="item-value">{{ detailData.currency_rate }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-undertaker"></i>
            <div class="item-label">手续费承担方：</div>
            <div class="item-value">{{ detailData.fee_payer }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-system-info"></i>
            <div class="item-label">系统名称：</div>
            <div class="item-value">{{ detailData.system_code }}</div>
          </div>
          <div class="info-item">
            <i class="item-icon iconfont icon-country"></i>
            <div class="item-label">收款账号国家或地区：</div>
            <div class="item-value">{{ detailData.country }}</div>
          </div>
        </div>

        <div class="info bottom">
          <div class="info-item">
            <i class="item-icon iconfont icon-note"></i>
            <div class="item-label">备注：</div>
            <div class="item-value">{{ detailData.note }}</div>
          </div>
        </div>
      </section>

      <section class="table-box">
        <el-table :data="tableData" style="width: 100%">
          <el-table-column prop="item_id" label="编号" width="80" />
          <el-table-column label="信息">
            <template #default="scope">
              <div>科目：{{ scope.row.account_title_parent }} - {{ scope.row.account_title }}</div>
              <div>金额：{{ scope.row.origin_amount }} {{ scope.row.currency }}</div>
              <div>人民币金额：{{ scope.row.cny_amount }} CNY</div>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="备注" />
        </el-table>
      </section>
    </el-scrollbar>

    <el-drawer v-model="showDrawer" title="新增打款" direction="rtl" size="50%">
      <PaymentAdd></PaymentAdd>
    </el-drawer>
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
.table-box {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 10px 0 #dfe2eb;
  color: #353535;
  overflow: hidden;
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
</style>