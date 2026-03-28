import {
	collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
	query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import type { Conexion } from '$lib/types';

const COL = 'conexiones';

function docToConexion(d: any): Conexion {
	const data = d.data();
	return {
		id: d.id,
		cita_origen_id: data.cita_origen_id ?? '',
		cita_destino_id: data.cita_destino_id ?? '',
		tipo_conexion: data.tipo_conexion ?? 'manual',
		etiqueta: data.etiqueta ?? '',
		comentario: data.comentario ?? '',
		creado_en: data.creado_en?.toDate() ?? new Date()
	};
}

export async function obtenerConexiones(): Promise<Conexion[]> {
	const q = query(collection(db, COL), orderBy('creado_en', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToConexion);
}

export async function crearConexion(data: Omit<Conexion, 'id' | 'creado_en'>): Promise<string> {
	const docRef = await addDoc(collection(db, COL), {
		...data,
		creado_en: serverTimestamp()
	});
	return docRef.id;
}

export async function actualizarConexion(id: string, data: Partial<Conexion>): Promise<void> {
	const ref = doc(db, COL, id);
	const updateData: any = { ...data };
	delete updateData.id;
	delete updateData.creado_en;
	await updateDoc(ref, updateData);
}

export async function eliminarConexion(id: string): Promise<void> {
	await deleteDoc(doc(db, COL, id));
}
