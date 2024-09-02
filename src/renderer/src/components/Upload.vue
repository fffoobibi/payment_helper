<script setup>
import axios from 'axios';
import { computed, ref } from 'vue';
const fileList = defineModel()

const emit = defineEmits(['done'])
const props = defineProps({
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
    currentPreviewImageIndex.value = fileIndex
    currentPreviewSrc.value = uploadFile.url
    previewImageShow.value = true
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
    let arr = dataUrl.split(',');
    let mime = arr[0].match(/:(.*?);/)[1];
    // suffix是该文件的后缀
    let suffix = mime.replaceAll("image/", "");
    // atob 对经过 base-64 编码的字符串进行解码
    let bstr = atob(arr[1]);
    // n 是解码后的长度
    let n = bstr.length;
    // Uint8Array 数组类型表示一个 8 位无符号整型数组 初始值都是 数子0
    let u8arr = new Uint8Array(n);
    // charCodeAt() 方法可返回指定位置的字符的 Unicode 编码。这个返回值是 0 - 65535 之间的整数
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    // new File返回File对象 第一个参数是 ArraryBuffer 或 Bolb 或Arrary 第二个参数是文件名
    // 第三个参数是 要放到文件中的内容的 MIME 类型
    return new File([u8arr], `${filename}.${suffix}`, {
        type: mime,
    })
}


defineExpose({
    uploadImage
})

</script>


<template>
    <div>
        <el-popover placement="top-start" title="" trigger="hover" :content="'最多上传' + props.limit.toString() + '张图片'">
            <template #reference>
                <el-upload list-type="picture-card" accept="image/*" v-model:file-list="fileList" :action="props.action"
                    :auto-upload="false" :http-request="uploadImage" :limit="props.limit" :disabled="props.disabled"
                    :on-preview="handlePreview" :on-error="(rsp, f, fs) => { console.log('error upload', rsp) }"
                    :on-success="(rsp, f, fs) => {  }">
                    <el-icon>
                        <Plus />
                    </el-icon>
                </el-upload>
            </template>
        </el-popover>

        <el-drawer v-model="previewImageShow" size="100%">
            <div style="display: flex; justify-content: center;align-items: center">
                <el-image :zoom-rate="1.2" :max-scale="7" :min-scale="0.2" fit="cover"
                    :initial-index="currentPreviewImageIndex" :src="currentPreviewSrc" :preview-src-list="previewList">
                    <template #tip>
                        <div class="el-upload__tip">
                            jpg/png files with a size less than 500kb
                        </div>
                    </template>
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