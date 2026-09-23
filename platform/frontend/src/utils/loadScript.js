/**
 * Dynamically load an external script once.
 * Avoids duplicate script injection on repeated calls.
 * @param {string} src - script URL
 * @returns {Promise<void>}
 */
export function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
