const removeUndefined = (obj) => {
    const a = {}
    Object.keys(obj).forEach(k => {
        if (obj[k] !== undefined) {
            a[k] = obj[k]
        }
    })
    return a
}

export {
    removeUndefined
}