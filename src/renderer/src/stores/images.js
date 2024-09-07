import {ref } from 'vue'
import { defineStore } from 'pinia'

const useImageStore = defineStore('image-store', () => {
  const render = ref(0)
  const urls = ref([])
  const index = ref(0)

  const setUrls = (v) => {
    urls.value.splice(0, urls.value.length)
    urls.value.push(...v)
  }
  return {
    urls,
    index,
    render,
    setUrls
  }
})

export { useImageStore }
