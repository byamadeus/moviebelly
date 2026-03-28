// Firebase Storage helpers for MovieBeli
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { updateUserProfile } from './firestore';

/**
 * Upload a profile avatar image to Firebase Storage, then persist the
 * download URL to the user's Firestore profile document.
 * Stored at avatars/{uid} — each upload overwrites the previous one.
 * Returns the public download URL.
 */
export async function uploadProfileAvatar(uid: string, file: File): Promise<string> {
  const avatarRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(avatarRef, file, { contentType: file.type });
  const url = await getDownloadURL(avatarRef);
  await updateUserProfile(uid, { photoURL: url });
  return url;
}
