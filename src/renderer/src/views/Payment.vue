<script setup>
import PaymentList from './PaymentList.vue'


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
            <component :is="Component" :detail-id="$route.params.id" @update=""></component>
          </keep-alive>
        </transition>
      </RouterView>
    </template>
  </Layout>
</template>


<style scoped>
</style>