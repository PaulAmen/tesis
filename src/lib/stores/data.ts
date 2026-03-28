import { writable } from 'svelte/store';
import type { Cita, Conexion } from '$lib/types';

export const citasStore = writable<Cita[]>([]);
export const conexionesStore = writable<Conexion[]>([]);
export const loadingStore = writable(false);
