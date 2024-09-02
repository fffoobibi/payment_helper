<script setup>
import { reactive, ref } from 'vue'
import PaymentAdd from './PaymentAdd.vue';

const props = defineProps({
  id: Number,
  item: Object
})

const tableData = reactive([
  {
    id: '1694673',
    subject: '办公费-职工人员工资及奖金',
    amount: '1200.00',
    currency: 'USD',
    cny: '8000.00',
    note: '员工离职补偿，该员工为运营部-内宣专员-刘嘉鸣，2012年3月入职经部门确认，于2024年8月6日办理离职手续，补偿80000元。补偿金和7月份工资8月15日一起发放。'
  },
  {
    id: '1694673',
    subject: '办公费-职工人员工资及奖金',
    amount: '1150.00',
    currency: 'EUR',
    cny: '8000.00',
    note: '员工离职补偿，该员工为运营部-内宣专员-刘嘉鸣，2012年3月入职经部门确认。'
  }
])

const showDrawer = ref(false)

const onSubmit = () => {
}

const imgSrc = ref('');
const onCapture = () => {
  electron.capture()
}

electron.onCapture(src => {
  imgSrc.value = src
})


</script>


<template>
  <Header>
    <template #title>
      <h4>季亚梅提交的外币银行转账款项支付</h4>
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
          <div class="item-value">202408191403000178649</div>
          <el-button link><i class="iconfont icon-copy"></i></el-button>
        </div>
      </div>

      <div class="info">
        <div class="info-item">
          <i class="item-icon iconfont icon-category"></i>
          <div class="item-label">类型：</div>
          <div class="item-value">人民币款项支付</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-approver"></i>
          <div class="item-label">打款员：</div>
          <div class="item-value">王盼盼</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-approve-author"></i>
          <div class="item-label">申请人：</div>
          <div class="item-value">季亚梅</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-department"></i>
          <div class="item-label">申请部门：</div>
          <div class="item-value">行政部</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-time"></i>
          <div class="item-label">创建时间：</div>
          <div class="item-value">2024-08-20 06:54</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-number"></i>
          <div class="item-label">采购单/流水号：</div>
          <div class="item-value">————</div>
        </div>
      </div>

      <div class="info">
        <div class="info-item">
          <i class="item-icon iconfont icon-amount"></i>
          <div class="item-label">打款金额：</div>
          <div class="item-value">8000.00 CNY</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-amount-cny"></i>
          <div class="item-label">打款人民币金额：</div>
          <div class="item-value">8000.00 CNY</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-currency-rate"></i>
          <div class="item-label">汇率：</div>
          <div class="item-value">1.000000</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-undertaker"></i>
          <div class="item-label">手续费承担方：</div>
          <div class="item-value">————</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-system-info"></i>
          <div class="item-label">系统名称：</div>
          <div class="item-value">————</div>
        </div>
        <div class="info-item">
          <i class="item-icon iconfont icon-country"></i>
          <div class="item-label">收款账号国家或地区：</div>
          <div class="item-value">————</div>
        </div>
      </div>

      <div class="info bottom">
        <div class="info-item">
          <i class="item-icon iconfont icon-note"></i>
          <div class="item-label">备注：</div>
          <div class="item-value">羌笛何须怨杨柳，春风不度玉门关</div>
        </div>
      </div>
    </section>

    <section class="table-box">
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column label="信息">
          <template #default="scope">
            <div>科目：{{ scope.row.subject }}</div>
            <div>金额：{{ scope.row.amount }} {{ scope.row.currency }}</div>
            <div>人民币金额：{{ scope.row.cny }} CNY</div>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
      </el-table>

      <el-pagination layout="prev, pager, next" :total="1000" />
    </section>

    <section class="table-box">
      <el-button @click="onCapture">截图</el-button>
      <el-image id="screenshotImage" :src="imgSrc" alt="Screenshot" />
    </section>
  </el-scrollbar>

  <el-drawer v-model="showDrawer" title="新增打款" direction="rtl" size="50%">
    <PaymentAdd></PaymentAdd>
  </el-drawer>

</template>


<style scoped>
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
  box-shadow: 0 2px 10px 0 #e8eeff;
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
  font-size: 1.2em;
  color: #99a;
}

.item-label {
  height: 25px;
  line-height: 25px;
  color: #99a;
  font-size: 0.8em;
}

.item-value {
  flex: 1;
  color: #556;
  font-size: 0.8em;
  line-height: 25px;
}

.top .item-value {
  flex: none;
  font-size: 0.9em;
  color: #353535;
}

.top .el-button i {
  font-size: 1.3em;
  color: #888;
}
</style>