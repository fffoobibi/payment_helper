<script setup>
import * as monaco from 'monaco-editor'
// import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { watch, onMounted, getCurrentInstance, onBeforeUnmount } from "vue";
import { useLogStore } from "@/stores/index"
const logStore = useLogStore()

const props = defineProps({
    content: String,
    language: String
})

let editor = null;

const { proxy } = getCurrentInstance();

watch(() => logStore.dynamic, () => {
    if (logStore.dynamic.length) {
        logStore.dynamic.forEach(v => {
            appendTextToEnd(v)
        })
        logStore.dynamic.splice(0, logStore.dynamic.length)
    }
}, { deep: true })

// 定义语言
monaco.languages.register({ id: 'log' });

// 定义语法规则
monaco.languages.setMonarchTokensProvider('log', {
    tokenizer: {
        root: [
            [/\[\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d{3})?\]/, 'custom-date'], // 匹配方括号内的内容作为日期
            // [/\[info\]|\[error\]|\[warning\]|\[debug\]/, 'custom-level'] // 匹配日志级别
            [/\[info\]/, 'custom-info'], // 匹配 info 级别
            [/\[error\]/, 'custom-error'], // 匹配 error 级别
            [/\[warning\]/, 'custom-warning'], // 匹配 warning 级别
            [/\[debug\]/, 'custom-debug'], // 匹配 debug 级别
            [/".*?"/, 'custom-string'], // 匹配双引号内的字符串
            [/'[^']*'/, 'custom-string'], // 匹配单引号内的字符串
            [/\d+/, 'custom-number'], // 匹配单引号内的字符串
            // [/, response/, {token: 'json-start', next: '@jsonContent',  nextEmbedded: 'json'}],
             // 捕获 JSON 开始的标记
            //  [/^\[\d{4}.*, response/, {token:'custom-marker', next: '@jsonMode',  nextEmbedded: 'json'}],
            //     // 默认文本
            //     [/./, 'text']
        ],
        // jsonMode: [
        //     // 捕获 JSON 结束的标记
        //     [/^\[\d{4}/, 'custom-marker', '@pop'],
        //     // 剩余的文本在这个状态被视为 JSON
        //     [/./, 'json']
        // ]
    }
})
// 主题
monaco.editor.defineTheme('log', {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'number', foreground: '#6bbeeb', fontStyle: 'italic' },
        { token: 'custom-date', foreground: '1E7C38' }, // 灰色
        { token: 'custom-info', foreground: '0000FF', fontStyle: 'bold' }, // info 级别显示为蓝色并加粗
        { token: 'custom-error', foreground: 'FF0000', fontStyle: 'bold' }, // error 级别显示为红色并加粗
        { token: 'custom-warning', foreground: 'FFA500', fontStyle: 'bold' }, // warning 级别显示为橙色并加粗
        { token: 'custom-debug', foreground: '808080', fontStyle: 'bold', background: '82B1D7' }, // debug 级别显示为灰色并加粗
        { token: 'custom-string', foreground: "AE672E" },
        { token: 'custom-number', foreground: "2E8ABA" },
        // { token: 'delimiter.bracket', background: 'ff0000' }, // 设置括号的颜色为红色
    ],
    colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        "editor.lineHighlightBackground": "#FFFBD1",
        "editorCursor.foreground": "#000000",
        "editorWhitespace.foreground": "#D6D6D6",
    }
})

onMounted(() => {
    editor = monaco.editor.create(proxy.$refs.editorContainer, {
        value: props.content,
        readOnly: true,
        language: "log",
        theme: "log",
        selectOnLineNumbers: true,
        automaticLayout: true,
        renderSideBySide: false,
        folding: true, // 是否折叠
        foldingHighlight: true, // 折叠等高线
        foldingStrategy: "indentation", // 折叠方式  auto | indentation
        showFoldingControls: "always", // 是否一直显示折叠 always | mouseover
        renderLineHighlight: 'all', // 行亮
        selectOnLineNumbers: true, // 显示行号
        cursorStyle: 'line',
        cursorWidth: 3
    })
    toEnd()
})

onBeforeUnmount(() => {
    editor?.dispose()
    editor = null
})

const getEditorValue = () => {
    return editor.getValue();
}

const toEnd = () => {
    const model = editor.getModel()
    editor.revealLine(model.getLineCount())
}

const appendTextToEnd = (text) => {
    const model = editor.getModel();
    const lastLine = model.getLineCount();
    const lastColumn = model.getLineMaxColumn(lastLine);
    const range = new monaco.Range(lastLine, lastColumn, lastLine, lastColumn);
    const op = {
        range: range,
        text: text + '\n',
        forceMoveMarkers: true
    };
    model.pushEditOperations([], [op], () => null);
    editor.revealLine(model.getLineCount());
}

defineExpose({
    getEditorValue,
    appendTextToEnd
})

</script>

<template>
    <div ref="editorContainer" class="monaco"></div>
</template>

<style scoped>
.monaco {
    height: calc(100vh - 30px);
    width: 100%;
}
</style>