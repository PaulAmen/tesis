import { writable } from 'svelte/store';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '$lib/firebase/config';

export const userStore = writable<User | null>(null);
export const authLoading = writable(true);

onAuthStateChanged(auth, (user) => {
	userStore.set(user);
	authLoading.set(false);
});
