<script setup>
import { reactive, ref } from 'vue'
import PaymentList from './PaymentList.vue';

const onSubmit = () => {
}
</script>


<template>
  <Layout hasList>
    <template #layout-list-inner>
      <PaymentList></PaymentList>
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