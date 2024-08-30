import { ref, onMounted, onUnmounted } from 'vue'

export function useClient() {
    const height = ref(0)
    const width = ref(0)

    function update(event) {
        height.value = event.target.innerHeight
        width.value = event.target.innerWidth
    }

    onMounted(() => {
        height.value = window.innerHeight
        width.value = window.innerWidth
        window.addEventListener('resize', update)
    })
    onUnmounted(() => {
        window.removeEventListener('resize', update)
    })

    return { height, width }
}