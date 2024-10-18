<script setup>
import PaymentList from './PaymentList.vue'
import PaymentAdd from './PaymentAdd.vue'
import { useExcelBatchPayment } from "@/utils/tools"
import {ref} from "vue"
const { title, show, openBatch, close, batch, batchData } = useExcelBatchPayment()
const listRef = ref(null)

</script>


<template>
  <Layout hasList>
    <template #layout-list-inner>
      <PaymentList ref="listRef"/>
    </template>

    <template #layout-main-inner>
      <RouterView v-slot="{ Component }">
        <transition name="fade">
          <keep-alive>
            <component :is="Component" :detail-id="$route.params.id" @open-batch="openBatch" @freshPending="()=>{
                listRef?.onSearch()
            }"></component> 
          </keep-alive>
        </transition>
      </RouterView>
    </template> 
  </Layout>

  <!-- 新增批量打款抽屉 -->
  <el-drawer v-model="show" :title="title" direction="rtl" size="600" destroy-on-close @closed="close" :close-on-click-modal="false">
    <PaymentAdd @close="close" :batch="batch" :batch-data="batchData" />
  </el-drawer>

</template>


<style scoped></style>