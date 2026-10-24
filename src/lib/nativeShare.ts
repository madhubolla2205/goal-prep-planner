// The Android app's web view can't download files or share them the way a
// browser does, so it writes the file to the app's cache and opens Android's
// share sheet, from which the person can save it to Files or Drive or send it.

import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Resolves to whether the person picked somewhere to send the file. */
export async function shareTextFile(name: string, text: string, title: string): Promise<boolean> {
  const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  try {
    await Share.share({ title, files: [uri] });
    return true;
  } catch {
    // Closing the share sheet rejects; that isn't an error worth showing.
    return false;
  }
}
