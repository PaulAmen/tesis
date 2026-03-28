import {
	collection, getDocs, setDoc, doc,
	serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/config';
import type { CampoMatriz, TipoMatriz } from '$lib/types';

const COL = 'matrices';

function docToCampo(d: any): CampoMatriz {
	const data = d.data();
	return {
		id: d.id,
		tipo: data.tipo ?? 'congruencia',
		campo: data.campo ?? '',
		contenido: data.contenido ?? '',
		citas_usadas: data.citas_usadas ?? [],
		actualizado_en: data.actualizado_en?.toDate() ?? new Date()
	};
}

export async function obtenerCamposPorTipo(tipo: TipoMatriz): Promise<CampoMatriz[]> {
	const snap = await getDocs(collection(db, COL));
	const todos = snap.docs.map(docToCampo);
	return todos.filter(c => c.tipo === tipo);
}

export async function guardarCampo(tipo: TipoMatriz, campo: string, contenido: string, citas_usadas: string[]): Promise<void> {
	const docId = `${tipo}_${campo}`;
	await setDoc(doc(db, COL, docId), {
		tipo,
		campo,
		contenido,
		citas_usadas,
		actualizado_en: serverTimestamp()
	});
}
