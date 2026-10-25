import { isNativeApp } from './device';
import { SITE_URL } from './shareLink';

// Sharing and saving that work the same from the screens' point of view in a
// browser and in the Android app.

/** Where links to the app should point. */
export function appBaseUrl(): string {
  return isNativeApp() ? SITE_URL : `${location.origin}${import.meta.env.BASE_URL}`;
}

/** Shares a message and link; falls back to copying the link. */
export async function shareMessage(title: string, text: string, url: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (isNativeApp()) {
    const { shareLink } = await import('./nativeShare');
    return (await shareLink(title, text, url)) ? 'shared' : 'cancelled';
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(url)) ? 'copied' : 'cancelled';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Hands a file to the person: Android's share sheet in the app, the
 * browser's share sheet when `preferShare` is set and the browser can share
 * files (phones), otherwise a download.
 */
export async function deliverFile(blob: Blob, name: string, title: string, preferShare = false): Promise<void> {
  if (isNativeApp()) {
    const { shareBase64File } = await import('./nativeShare');
    await shareBase64File(name, await blobToBase64(blob), title);
    return;
  }
  const file = new File([blob], name, { type: blob.type });
  if (preferShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  download(blob, name);
}
