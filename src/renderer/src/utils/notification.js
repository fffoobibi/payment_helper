import { ElNotification } from 'element-plus'

const showNotification = (msg, onClose, onClick, type) => {

    ElNotification({
        title: type,
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
