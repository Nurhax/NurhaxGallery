/** Triggers a browser download for a file served from /public. */
export function downloadFile(path: string, filename: string): void {
    const a = document.createElement('a');
    a.href = encodeURI(path);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
}