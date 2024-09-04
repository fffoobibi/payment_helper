<template>
  <div v-if="showMenu" :style="{ left: x + 'px', top: y + 'px' }" class="right-click-menu">
    <ul>
      <li v-for="(item, index) in menuItems" :key="index" @click="handleMenuItemClick(item)">
        <div style="display: flex; justify-content: space-between;">
          <v-slot name="label" :item="item">
            <span>{{ item.label }} </span>
          </v-slot>
          <span v-if="item.children">
            <v-slot name="tag">
              <el-icon color="gray" size="small">
                <ArrowRight />
              </el-icon>
            </v-slot>
          </span>
        </div>
        <template v-if="item.children && item.children.length > 0">
          <ul class="sub-menu" :style="{ top: `${30 * index}px` }">
            <li v-for="(subItem, subIndex) in item.children" :key="'sub-' + subIndex"
              @click.stop="handleMenuItemClick(subItem)">
              {{ subItem.label }}
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, toRefs } from 'vue';
const props = defineProps({
  targetElement: {
    type: Object,
    required: true
  },
  judgeShow: Function,
  show: {
    type: Boolean,
    default: false
  },
  menuItems: Array
})
const emit = defineEmits(["item-click", "judge-show"])
const showMenu = ref(props.show);
const x = ref(0);
const y = ref(0);
const { menuItems } = toRefs(props)


const trigger = () => {
  showMenu.value = true
}

const data = ref([])

const handleContextMenu = (event) => {
  if (isTargetElementOrChild(event.target, props.targetElement.$el)) {
    event.preventDefault();
    x.value = event.clientX;
    y.value = event.clientY;
    const targetRect = props.targetElement.$el.getBoundingClientRect();
    const relativeX = x.value - targetRect.left;
    const relativeY = y.value - targetRect.top;
    emit('judge-show', x.value, y.value, relativeX, relativeY, trigger)
  }
}

const pop = (...args) => {
  data.value = args
  showMenu.value = true
}

const isTargetElementOrChild = (target, element) => {
  if (target === element) {
    return true;
  }
  let parent = target.parentNode;
  while (parent) {
    if (parent === element) {
      return true;
    }
    parent = parent.parentNode;
  }
  return false;
}

// 隐藏菜单
const hideMenu = () => {
  showMenu.value = false;
}

// 处理菜单项点击
const handleMenuItemClick = (item, event) => {
  console.log('event ', event);
  emit("item-click", item, ...data.value)
  hideMenu()
  data.value = []
}

// 添加和移除事件监听器
onMounted(() => {
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('click', hideMenu);
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('click', hideMenu);
})

defineExpose({
  pop
})


</script>

<style scoped>
.right-click-menu {
  min-width: 120px;
  padding: 0px;
  margin: 0px;
  position: fixed;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  list-style: none;
  padding: 0px;
  z-index: 1000;
  color: black;
  font-size: 10pt;
}

li {
  height: 30px;
}

.right-click-menu ul {
  margin: 0;
  padding: 0;
}

.right-click-menu li {
  padding: 5px 10px;
  cursor: pointer;
}

.right-click-menu li:hover {
  background-color: #f0f0f0;
}

.sub-menu {
  display: none;
  position: absolute;
  top: 0;
  left: 100%;
  margin-top: -10px;
  background-color: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  list-style: none;
  padding: 10px;
  z-index: 1000;
  width: 120px;
}

.right-click-menu li:hover .sub-menu {
  display: block;
}

.right-click-menu li:active .sub-menu {
  display: block;
}
</style>