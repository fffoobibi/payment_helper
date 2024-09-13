<script setup>
import Blank from '@/components/Blank.vue';
</script>


<template>
  <Blank class="empty-page" />
</template>


<style scoped>
header {
  display: flex;
  width: 100%;
  height: 36px;
  padding: 0 0 0 10px;
  background-color: #fffc;
  border-bottom: 1px solid #eee;
}

.header-title {
  flex: 1;
}

.header-title h4 {
  line-height: 30px;
  color: #353535;
  font-size: 15px;
}

.empty-page {
  height: calc(100% - 30px);
}
</style>