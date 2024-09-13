<!-- <template>
    <div id="codeEditBox" style="width:100%;height: 100%;"></div>
</template>
<script setup>
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor';
import { nextTick, ref, onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
    theme: {
        type: String,
        required: false,
    },
    content: {
        type: String,
        required: false,
    }
})

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker()
        }
        if (['typescript', 'javascript'].includes(label)) {
            return new tsWorker()
        }
        return new EditorWorker()
    },
}

onBeforeUnmount(() => {
    editor.dispose()
})



const editorInit = () => {
    nextTick(() => {
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: false
        });
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            allowNonTsExtensions: true
        });

        if (!editor) {
            monaco.languages.register({ id: 'log' })
            monaco.editor.defineTheme('logTheme', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    {
                        token: 'level-INFO',
                        foreground: '37D86F',
                        fontStyle: 'bold'
                    },
                    {
                        token: 'level-ERROR',
                        foreground: 'FFFFFF',
                        background: 'FF0000',
                        fontStyle: 'bold'
                    },
                    {
                        token: 'level-WARNING',
                        foreground: 'FFFFFF'
                    },
                    {
                        token: 'custom-time',
                        foreground: 'FFCF4A'
                    },
                    {
                        token: "string",
                        foreground: "CE7241"
                    }
                ],
                colors: {
                    // 'editor.background': '#1e1e1e',
                    // 'editor.foreground': '#d4d4d4',
                    // 'editorLineNumber.foreground': '#d4d4d4',
                    // 'editorCursor.foreground': '#d4d4d4',
                    // 'editor.selectionBackground': '#add6ff',
                    // 'editor.selectionForeground': '#000000'
                    // 'editorBracketMatch.background': '#6D0829',// 匹配的括号的背景色。
                    // 'editorBracketMatch.border': '#6D0829'//匹配的括号的边框颜色。
                }
            })
            monaco.languages.setMonarchTokensProvider('log', {
                ignoreCase: false,
                escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
                tokenizer: {
                    root: [
                        [/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, { token: "custom-time" }],
                        [/(INFO|ERROR|WARNING)(?=:)/, { token: "level-$1" }],
                        [/\d+/, { token: "number" }],
                        [/[{}()\[\]]/, '@brackets'],
                        //链接
                        [/(https?:\/\/[^\s]+)/, { token: "link" }],
                        // 字符串定义
                        [/'[^']*'/, { token: "string" }],
                    ],
                },
            })
            editor = monaco.editor.create(document.getElementById('codeEditBox'), {
                value: props.content, // 编辑器初始显示文字
                language: 'log', // 语言支持自行查阅demo
                automaticLayout: true, // 自适应布局  
                theme: props.theme ?? 'vs', // 官方自带三种主题vs, hc-black, or vs-dark
                folding: true, // 是否折叠
                foldingHighlight: true, // 折叠等高线
                foldingStrategy: "indentation", // 折叠方式  auto | indentation
                showFoldingControls: "always", // 是否一直显示折叠 always | mouseover
                renderLineHighlight: 'all', // 行亮
                selectOnLineNumbers: true, // 显示行号
                colorDecorators: true, // 颜色装饰器
                codeLens: true, // 代码镜头
                minimap: {
                    enabled: false,
                },
                readOnly: false, // 只读
                fontSize: 14, // 字体大小
                scrollBeyondLastLine: false, // 取消代码后面一大段空白 
                overviewRulerBorder: false, // 不要滚动条的边框  ,
                wordWrap: "on"
            })
            function renderDecorations() {
                const model = editor.getModel();

                // 用来存储包含 `level-ERROR` token的范围
                let errorRanges = [];
                let warnRanges = [];
                // 遍历模型中的每一行
                for (let i = 1; i <= model.getLineCount(); i++) {
                    // 获取当前行的文本
                    const lineText = model.getLineContent(i);
                    // 调用tokenize方法来获取行token信息
                    const lineTokens = monaco.editor.tokenize(lineText, "log");
                    // 遍历行的每一个token
                    for (let token of lineTokens[0]) { // tokenize返回的是一个二维数组
                        const tokenType = token.type;

                        // 检查token是否是我们关注的 `level-ERROR`
                        if (tokenType === 'level-ERROR.log') {
                            // const tokenText = lineText.substring(token.offset, token.offset + 6);
                            // console.log('tt ==>?', tokenText);
                            // 创建range对象
                            const range = new monaco.Range(i, token.offset + 1, i, token.offset + 6);
                            errorRanges.push(range);
                        }
                        else if (tokenType === 'level-WARNING.log') {
                            // const tokenText = lineText.substring(token.offset, token.offset + 8);
                            // 创建range对象
                            const range = new monaco.Range(i, token.offset + 1, i, token.offset + 8);
                            warnRanges.push(range)

                        }
                    }
                }

                // 创建装饰器，并将它们应用于`level-ERROR`位置
                const decorations = errorRanges.map(range => ({
                    range: range,
                    options: {
                        // 使用`isWholeLine`属性可以选择是否整行都应用装饰
                        isWholeLine: false,
                        className: 'error'
                    }
                }));

                const warnDecorations = warnRanges.map(range => ({
                    range: range,
                    options: {
                        // 使用`isWholeLine`属性可以选择是否整行都应用装饰
                        isWholeLine: false,
                        className: 'warn'
                    }
                }));
                // 清除先前的装饰器并应用新装饰器
                return editor.deltaDecorations([], [...decorations, ...warnDecorations]);
            }

            renderDecorations()

        } else {
            editor.setValue(props.content)
            renderDecorations()
            // editor.setValue("console.log('aaaaa')");
        }
        // 监听值的变化
        editor.onDidChangeModelContent((val) => {
            // text.value = editor.getValue();
        })
        editor.onMouseUp((e) => {
            console.log(e);
        })

    })
}

/** @type {monaco.editor.IStandaloneCodeEditor} */
let editor


onMounted(() => {
    editorInit()

})
const changeLanguage = () => {
    monaco.editor.setModelLanguage(editor.getModel(), language.value)
    //  editor.updateOptions({
    //           language: "objective-c"
    //       });
}

defineExpose({
    changeTheme: (theme) => {
        monaco.editor.setTheme(theme);
    },
    setContent: (value) => {
        editor.setValue(value)
        renderDecorations()
    }
})

</script>
<style scoped>
:deep(.error) {
    background: red !important;
    /* text-decoration: underline !important; */
    text-decoration-style: wavy !important;
    text-decoration-line: line-through !important;
    text-decoration-color: red !important;
}

:deep(.warn) {
    background-color: #800080 !important;
    color: white !important;

}
</style> -->


<template>
    <div ref="editorContainer" style="height: 100%; width: 100%"></div>
</template>

<script setup>
// import * as monaco from "monaco-editor/esm/vs/editor/editor.main.js";
import * as monaco from 'monaco-editor';
import { watch, ref, onMounted, getCurrentInstance, watchEffect, onBeforeUnmount } from "vue";
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
            [/\[info\]|\[error\]|\[warning\]|\[debug\]/, 'custom-level'] // 匹配日志级别
        ]
    }
});
// 主题
monaco.editor.defineTheme('log', {
    base: 'vs', 
    inherit: true,
    rules: [
        { token: 'custom-date', foreground: '1E7C38' }, // 灰色
        { token: 'custom-level', foreground: 'ff0000', fontStyle: 'bold' }, // 红色并加粗
        // { token: 'string', foreground: "4B2C43" },
        // { token: 'delimiter.bracket', background: 'ff0000' }, // 设置括号的颜色为红色
    ],
    colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        "editor.lineHighlightBackground": "#FFFBD1",
        "editorCursor.foreground": "#000000",
        "editorWhitespace.foreground": "#000000",
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
    });
});


onBeforeUnmount(() => {
    editor?.dispose()
    editor = null
})

const getEditorValue = () => {
    return editor.getValue();
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
});
</script>

