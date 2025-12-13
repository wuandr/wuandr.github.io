export const isExternalHref = (href) => {
    if (!href)
        return false;
    try {
        const url = new URL(href, window.location.origin);
        const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
        return isHttp && url.origin !== window.location.origin;
    }
    catch {
        return false;
    }
};
