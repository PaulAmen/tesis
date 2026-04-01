import {
	collection, getDocs, addDoc, deleteDoc, doc,
	query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import type { SeccionPersonalizada } from '$lib/types';

const COL = 'secciones_personalizadas';

function docToSeccion(d: any): SeccionPersonalizada {
	const data = d.data();
	return {
		id: d.id,
		nombre: data.nombre ?? '',
		orden: data.orden ?? 0,
		creado_en: data.creado_en?.toDate() ?? new Date()
	};
}

export async function obtenerSeccionesPersonalizadas(): Promise<SeccionPersonalizada[]> {
	const q = query(collection(db, COL), orderBy('orden', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToSeccion);
}

export async function crearSeccionPersonalizada(nombre: string, orden: number): Promise<string> {
	const docRef = await addDoc(collection(db, COL), {
		nombre,
		orden,
		creado_en: serverTimestamp()
	});
	return docRef.id;
}

export async function eliminarSeccionPersonalizada(id: string): Promise<void> {
	await deleteDoc(doc(db, COL, id));
}
