let deepLinkUrl: string | null = null

export const setDeepLink = (link: string) => {
    deepLinkUrl = link
}

export const getDeepLink = (link: string) => {
    const temp = deepLinkUrl
    deepLinkUrl = null
    return temp
}