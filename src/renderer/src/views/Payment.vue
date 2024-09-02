<script setup>
import { reactive } from 'vue'
import PaymentList from './PaymentList.vue';


const approves = reactive([
  {id: 7, title: '沈子文提交的报销 - 百舟', create_time: '2024-08-23 11:34:00', number: '202408191403000178650', amount: '1027.00', currency: 'CNY', status: 0, isChecked: true},
  {id: 6, title: '季亚梅提交的外币银行转账款项支付', create_time: '2024-08-23 10:27:00', number: '202408191403000178649', amount: '25027.00', currency: 'KRW', status: 0, isChecked: true},
  {id: 5, title: '沈子文提交的报销 - 百舟', create_time: '2024-08-20 10:22:00', number: '202408191403000178648', amount: '1027.00', currency: 'CNY', status: 0, isChecked: false},
  {id: 4, title: '季亚梅提交的外币银行转账款项支付', create_time: '2024-08-15 18:56:00', number: '202408121503000283241', amount: '35684.48', currency: 'CNY', status: 0, isChecked: false},
  {id: 3, title: '季亚梅提交的外币银行转账款项支付', create_time: '2024-08-15 18:56:00', number: '202408121503000283241', amount: '35684.48', currency: 'CNY', status: 0, isChecked: true},
  {id: 2, title: '季亚梅提交的外币银行转账款项支付', create_time: '2024-08-15 18:56:00', number: '202408121503000283241', amount: '35684.48', currency: 'CNY', status: 0, isChecked: false},
  {id: 1, title: '季亚梅提交的外币银行转账款项支付', create_time: '2024-08-15 18:56:00', number: '202408121503000283241', amount: '35684.48', currency: 'CNY', status: 0, isChecked: true},
])

const onSubmit = () => {
}
</script>


<template>
  <Layout hasList>
    <template #layout-list-inner>
      <PaymentList :approves="approves"></PaymentList>
    </template>

    <template #layout-main-inner>
      <RouterView v-slot="{ Component }">
        <transition name="fade">
          <keep-alive>
            <component :is="Component" :id="$route.params.id"></component>
          </keep-alive>
        </transition>
      </RouterView>
    </template>
  </Layout>
</template>


<style scoped>
</style>