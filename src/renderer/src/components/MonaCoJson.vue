<script setup>
import * as monaco from 'monaco-editor';
import {onMounted, getCurrentInstance, onBeforeUnmount } from "vue";

const props = defineProps({
    content: String,
})

let editor = null;

const { proxy } = getCurrentInstance();


// 定义语言

onMounted(() => {
    console.log('create ....');
    editor = monaco.editor.create(proxy.$refs.jsonRef, {
        value: props.content,
        readOnly: true,
        language: "text/plain",
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
    <div ref="jsonRef" class="monaco"></div>
</template>

<style scoped>
.monaco {
    height: calc(100% - 30px);
    width: 100%;
}
</style>