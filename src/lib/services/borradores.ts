import {
	collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
	query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import type { Borrador } from '$lib/types';

const COL = 'borradores';

function docToBorrador(d: any): Borrador {
	const data = d.data();
	return {
		id: d.id,
		seccion: data.seccion ?? 'introduccion',
		subseccion: data.subseccion ?? '',
		titulo: data.titulo ?? '',
		contenido: data.contenido ?? '',
		citas_usadas: data.citas_usadas ?? [],
		creado_en: data.creado_en?.toDate() ?? new Date(),
		actualizado_en: data.actualizado_en?.toDate() ?? new Date()
	};
}

export async function obtenerBorradores(): Promise<Borrador[]> {
	const q = query(collection(db, COL), orderBy('actualizado_en', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToBorrador);
}

export async function obtenerBorradoresPorSeccion(seccion: string): Promise<Borrador[]> {
	const q = query(collection(db, COL), where('seccion', '==', seccion), orderBy('actualizado_en', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToBorrador);
}

export async function crearBorrador(data: Omit<Borrador, 'id' | 'creado_en' | 'actualizado_en'>): Promise<string> {
	const docRef = await addDoc(collection(db, COL), {
		...data,
		creado_en: serverTimestamp(),
		actualizado_en: serverTimestamp()
	});
	return docRef.id;
}

export async function actualizarBorrador(id: string, data: Partial<Borrador>): Promise<void> {
	const ref = doc(db, COL, id);
	const updateData: any = { ...data };
	delete updateData.id;
	delete updateData.creado_en;
	updateData.actualizado_en = serverTimestamp();
	await updateDoc(ref, updateData);
}

export async function eliminarBorrador(id: string): Promise<void> {
	await deleteDoc(doc(db, COL, id));
}
