<script setup>
import Toolbar from './Toolbar.vue';

const props = defineProps({
  hasList: {
    type: Boolean,
    default: false
  }
})
const onSubmit = () => {
}
</script>


<template>
  <div class="layout-container">
    <div class="layout-list" v-if="hasList">
      <div class="drag"></div>
      <slot name="layout-list-inner"></slot>
    </div>

    <div class="layout-main">
      <Toolbar />
      <slot name="layout-main-inner"></slot>
    </div>
  </div>
</template>


<style>
.layout-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.layout-list {
  width: 320px;
  height: 100%;
  background-color: #f5f6f7;
  border-right: 1px solid #eee;
}

.drag {
  height: 30px;
}

.layout-main {
  flex: 1;
  height: 100%;
  background-image: url('../assets/images/wavy-lines.svg');
  background-size: cover;
  border-radius: 0 8px 8px 0;
  overflow: hidden;
}
</style>