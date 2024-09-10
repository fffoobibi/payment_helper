import { ref, onMounted, onUnmounted } from 'vue'

export function useClient(target = null) {
    const height = ref(0)
    const width = ref(0)

    function update(event) {
        if (target === null) {
            height.value = event.target.innerHeight
            width.value = event.target.innerWidth
        } else {
            height.value = target.clientHeight
            width.value = target.clientWidth
        }
    }
    onMounted(() => {
        if (target === null) {
            height.value = window.innerHeight
            width.value = window.innerWidth
            window.addEventListener('resize', update)
        } else {
            target.addEventListener('resize', update)
        }

    })
    onUnmounted(() => {
        if (target === null) {
            window.removeEventListener('resize', update)
        } else {
            target.removeEventListener('resize', update)
        }
    })

    return { height, width }
}