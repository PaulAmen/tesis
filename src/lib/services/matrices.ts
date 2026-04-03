import {
	collection, getDocs, setDoc, doc, getDoc, deleteDoc,
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

export async function eliminarCampo(tipo: TipoMatriz, campo: string): Promise<void> {
	await deleteDoc(doc(db, COL, `${tipo}_${campo}`));
}

export async function obtenerMetaCongruencia(): Promise<{
	counts: Record<string, number>;
	conexiones: Record<string, string>;
}> {
	const snap = await getDoc(doc(db, COL, 'congruencia_meta'));
	if (snap.exists()) {
		const data = snap.data();
		return {
			counts: data.counts ?? { oe: 4, hipotesis: 3, dimension_vi: 3, dimension_vd: 3, indicador_vi: 6, indicador_vd: 3, tema_mt: 3 },
			conexiones: data.conexiones ?? {}
		};
	}
	return {
		counts: { oe: 4, hipotesis: 3, dimension_vi: 3, dimension_vd: 3, indicador_vi: 6, indicador_vd: 3, tema_mt: 3 },
		conexiones: {}
	};
}

export async function obtenerTemasMarcoTeorico(): Promise<string[]> {
	const meta = await obtenerMetaCongruencia();
	const count = meta.counts.tema_mt ?? 3;
	const temas: string[] = [];
	for (let i = 1; i <= count; i++) {
		const snap = await getDoc(doc(db, COL, `congruencia_tema_mt_${i}`));
		if (snap.exists()) {
			const contenido = snap.data().contenido?.trim();
			if (contenido) temas.push(contenido);
		}
	}
	return temas;
}

export async function guardarMetaCongruencia(
	counts: Record<string, number>,
	conexiones: Record<string, string>
): Promise<void> {
	await setDoc(doc(db, COL, 'congruencia_meta'), { counts, conexiones });
}
