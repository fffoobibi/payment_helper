<script setup>
import PaymentList from './PaymentList.vue'
import PaymentAdd from './PaymentAdd.vue'
import { useExcelBatchPayment } from "@/utils/tools"
const { title, show, openBatch, close, batch, batchData } = useExcelBatchPayment()

</script>


<template>
  <Layout hasList>
    <template #layout-list-inner>
      <PaymentList />
    </template>

    <template #layout-main-inner>
      <RouterView v-slot="{ Component }">
        <transition name="fade">
          <keep-alive>
            <component :is="Component" :detail-id="$route.params.id" @open-batch="openBatch"></component>
          </keep-alive>
        </transition>
      </RouterView>
    </template>
  </Layout>

  <!-- 新增批量打款抽屉 -->
  <el-drawer v-model="show" :title="title" direction="rtl" size="600" destroy-on-close @closed="close">
    <PaymentAdd @close="close" :batch="batch" :batch-data="batchData" />
  </el-drawer>

</template>


<style scoped></style>