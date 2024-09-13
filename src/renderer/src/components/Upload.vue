<script setup>
import axios from 'axios'
import { computed, ref, toRaw } from 'vue'
import { viewImages } from "@/utils/tools"
import { useLocalConfig } from "@/stores/config"
const cfg = useLocalConfig()
const fileList = defineModel()

const env = import.meta.env
const emit = defineEmits(['done'])
const props = defineProps({
    validateMinCount: {
        type: Number,
        default: 1
    },
    size: {
        type: [Number],
        default: 66
    },
    action: {
        type: String,
        required: true
    },
    handlePreview: Function,
    dir: {
        type: String,
        required: true
    },
    limit: {
        type: Number,
        default: 10
    },
    disabled: {
        type: Boolean,
        default: false
    }
})
const _fileList = computed(() => {
    return fileList.value.map(v => v.url)
})
const index = (url) => {
    return _fileList.value.indexOf(url)
}

const handlePreview = (uploadFile) => {
    const fileIndex = index(uploadFile.url)
    viewImages(toRaw(previewList.value), fileIndex)
    // currentPreviewImageIndex.value = fileIndex
    // currentPreviewSrc.value = uploadFile.url
    // previewImageShow.value = true
}

const previewImageShow = ref(false)

const previewList = computed(() => {
    return fileList.value.map(v => v.url)
})

const currentPreviewImageIndex = ref(0)

const currentPreviewSrc = ref('')

const upload = async (file, r) => {
    const f = new FormData()
    f.append('file', file)
    f.append('dir', props.dir)
    f.append('file_name', file.name)
    f.append('token', 'b7M89zeAFj8ts493d1Ujz2HrjC')
    let targetUrl
    if (cfg.mode) {
        targetUrl = cfg.uploadFormalUrl
    } else {
        targetUrl = cfg.uploadTestUrl
    }
    const headers = {
        "Content-Type": "multipart/form-data",
        "target-url": targetUrl
    }
    try {
        let url
        if (env.PROD){
            url = cfg.uploadUrl
        }else{
            url = props.action
        }
        const response = await axios.post(url, f, {
            headers
        })
        if (response.status === 200) {
            r.response = response.data
            return response.data
        }
    } catch (err) {
        
    }
}

const getFileName = () => {
    const date = new Date()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const formattedDate = `${year}_${month}_${day}`
    return formattedDate + "_" + Math.random().toString().split('.')[1]
}

const uploadImage = async () => {
    const tasks = []
    fileList.value.forEach((v, index) => {
        if (v.raw) {
            tasks.push(upload(v.raw, v))
        } else if (v.url?.startsWith('data:image')) {
            tasks.push(upload(base64toFile(v.url, `${index}_` + getFileName()), v))
        }
    })
    if (tasks.length) {
        const rs = await Promise.all(tasks)
        emit("done", rs)
        return rs
    }
}


const base64toFile = (dataUrl = '', filename = 'file') => {
    let arr = dataUrl.split(',')
    let mime = arr[0].match(/:(.*?);/)[1]
    let suffix = mime.replaceAll("image/", "")
    let bstr = atob(arr[1])
    let n = bstr.length
    let u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], `${filename}.${suffix}`, {
        type: mime,
    })
}

function dataURLToFile(dataUrl, fileName) {
    const dataArr = dataUrl.split(',')
    const mime = dataArr[0].match(/:(.*);/)[1]
    const originStr = atob(dataArr[1])
    return new File([originStr], fileName, { type: mime })
}


const validate = (rule, value, callback) => {
    let count = 0
    value.forEach((v, index) => {
        if (v.raw) {
            count++
        } else if (v.url?.startsWith('data:image')) {
            count++
        }
    })
    if (count < props.validateMinCount) {
        callback(new Error("请上传图片!"))
    } else {
        callback()
    }
}

defineExpose({
    uploadImage,
    validate
})

</script>


<template>
    <div>
        <el-tooltip effect="dark" :content="'最多上传' + props.limit.toString() + '张图片'" placement="top"
            :disabled="props.disabled">
            <el-upload list-type="picture-card" accept="image/*" v-model:file-list="fileList" :action="props.action"
                :auto-upload="false" :http-request="uploadImage" :limit="props.limit" :disabled="props.disabled"
                :on-preview="handlePreview" :on-error="(rsp, f, fs) => { console.log('error upload', rsp) }"
                :on-success="(rsp, f, fs) => { }">
                <slot>
                    <el-icon>
                        <Plus />
                    </el-icon>
                </slot>
            </el-upload>
        </el-tooltip>

        <el-drawer v-model="previewImageShow" size="100%" destroy-on-close append-to-body>
            <div style="display: flex; justify-content: center;align-items: center">
                <el-image :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" fit="cover"
                    :initial-index="currentPreviewImageIndex" :src="currentPreviewSrc" :preview-src-list="previewList">
                    <template #error>
                        <div>
                            <el-empty description="404" />
                        </div>
                    </template>
                </el-image>
            </div>
        </el-drawer>
    </div>
</template>

<style scoped>
:deep(.el-upload.el-upload--picture-card),
:deep(.el-upload-list__item-actions),
:deep(.el-upload-list__item-thumbnail),
:deep(.el-upload-list__item) {
    width: v-bind("props.size + 'px'") !important;
    height: v-bind("props.size + 'px'") !important;
}
</style>