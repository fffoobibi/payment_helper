import fs from 'fs';

const content = fs.readFileSync('./features.txt', { encoding: 'utf-8' })
const lines = content.split('\n').map(v => {
    if (v.trim()) {
        return "<li>" + v.trim() + "</li>"
    } return false
}).filter(v => v).join('')

const c = '<ul>' + lines + '</ul>'

fs.appendFileSync('./dist/latest.yml', 'content: ' + c, 'utf-8')