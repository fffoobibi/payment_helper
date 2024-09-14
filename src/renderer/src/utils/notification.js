import { ElNotification } from 'element-plus'

const showNotification = (msg, onClose, onClick, type) => {
    const title = type[0].toUpperCase() + type.slice(1)
    ElNotification({
        title,
        message: msg,
        type,
        onClose,
        onClick,
        offset: 30
    })
}

const notification = {
    success: (msg, onClose, onClick) => showNotification(msg, onClose, onClick, 'success'),
    error: (msg, onClose, onClick) => showNotification(msg, onClose, onClick, 'error'),
    warning: (msg, onClose, onClick) => showNotification(msg, onClose, onClick, 'warning'),
    info: (msg, onClose, onClick) => showNotification(msg, onClose, onClick, 'info')
}

export default notification
