import {
	collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
	query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import type { Cita } from '$lib/types';
import { generarReferenciaAPA } from '$lib/utils/apa';

const COL = 'citas';

function docToCita(d: any): Cita {
	const data = d.data();
	return {
		id: d.id,
		autor: data.autor ?? '',
		año: data.año ?? 0,
		titulo: data.titulo ?? '',
		fuente: data.fuente ?? '',
		cita_textual: data.cita_textual ?? '',
		paginas: data.paginas ?? '',
		tipo: data.tipo ?? 'libro',
		temas: data.temas ?? [],
		notas: data.notas ?? '',
		referencia_apa: data.referencia_apa ?? '',
		creado_en: data.creado_en?.toDate() ?? new Date()
	};
}

export async function obtenerCitas(): Promise<Cita[]> {
	const q = query(collection(db, COL), orderBy('creado_en', 'desc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToCita);
}

export async function crearCita(data: Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>): Promise<string> {
	const referencia_apa = generarReferenciaAPA(data);
	const docRef = await addDoc(collection(db, COL), {
		...data,
		referencia_apa,
		creado_en: serverTimestamp()
	});
	return docRef.id;
}

export async function actualizarCita(id: string, data: Partial<Cita>): Promise<void> {
	const ref = doc(db, COL, id);
	const updateData: any = { ...data };
	delete updateData.id;
	delete updateData.creado_en;
	if (data.autor || data.año || data.titulo || data.fuente || data.paginas || data.tipo) {
		updateData.referencia_apa = generarReferenciaAPA(data as any);
	}
	await updateDoc(ref, updateData);
}

export async function eliminarCita(id: string): Promise<void> {
	await deleteDoc(doc(db, COL, id));
}
