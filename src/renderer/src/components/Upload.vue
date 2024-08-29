<script setup>
import axios from 'axios';
const fileList = defineModel()

const emit = defineEmits(['done'])
const props = defineProps({
    action: {
        type: String,
        required: true
    },
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

const upload = async (file, r) => {
    const f = new FormData()
    f.append('file', file)
    f.append('dir', props.dir)
    f.append('file_name', file.name)
    f.append('token', 'b7M89zeAFj8ts493d1Ujz2HrjC')
    try {
        const response = await axios.post(props.action, f, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        if (response.status === 200) {
            r.response = response.data
            return response.data
        }
        console.log('err --> ', resp);
    } catch (err) {
        console.log('err --> ', err);
    }
}

const uploadImage = async () => {
    const tasks = []
    fileList.value.forEach(v => {
        if (v.raw) {
            tasks.push(upload(v.raw, v))
        }
    })
    if (tasks.length) {
        const rs = await Promise.all(tasks)
        emit("done", rs)
        return rs
    }
}

defineExpose({
    uploadImage
})

</script>


<template>
    <el-upload 
        list-type="picture-card" accept="image/*" v-model:file-list="fileList"
        :action="props.action" 
        :auto-upload="false"
        :http-request="uploadImage" 
        :limit="props.limit" 
        :disabled="props.disabled"
        :on-error="(rsp, f, fs) => { console.log('error upload', rsp) }"
        :on-success="(rsp, f, fs) => { console.log('ssss ==> ', rsp) }">
        <el-icon>
            <Plus />
        </el-icon>
    </el-upload>
</template>


<style scoped>
:deep(.el-upload.el-upload--picture-card),
:deep(.el-upload-list__item-actions),
:deep(.el-upload-list__item-thumbnail),
:deep(.el-upload-list__item) {
    width: 66px !important;
    height: 66px !important;
}
</style>