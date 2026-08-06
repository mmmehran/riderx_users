let deepLinkUrl: string | null = null
let listener: ((url: string) => void) | null = null

export const setDeepLink = (link: string) => {
    if (listener) {
        listener(link)
        return
    }
    deepLinkUrl = link
}

export const getDeepLink = () => {
    const temp = deepLinkUrl
    deepLinkUrl = null
    return temp
}

export const setDeepLinkListener = (cb: ((url: string) => void) | null) => {
    listener = cb
    if (cb && deepLinkUrl) {
        const url = deepLinkUrl
        deepLinkUrl = null
        cb(url)
    }
}
