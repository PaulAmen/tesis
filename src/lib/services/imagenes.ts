import {
	collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
	query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
	ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db, storage } from '$lib/firebase/config';
import type { ImagenTesis } from '$lib/types';

const COL = 'imagenes';

function docToImagen(d: any): ImagenTesis {
	const data = d.data();
	return {
		id: d.id,
		nombre: data.nombre ?? '',
		caption: data.caption ?? '',
		seccion: data.seccion ?? '',
		url: data.url ?? '',
		storagePath: data.storagePath ?? '',
		ancho: data.ancho ?? 80,
		creado_en: data.creado_en?.toDate() ?? new Date()
	};
}

export async function obtenerImagenes(): Promise<ImagenTesis[]> {
	const q = query(collection(db, COL), orderBy('creado_en', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToImagen);
}

export async function obtenerImagenesPorSeccion(seccion: string): Promise<ImagenTesis[]> {
	const q = query(collection(db, COL), where('seccion', '==', seccion), orderBy('creado_en', 'asc'));
	const snap = await getDocs(q);
	return snap.docs.map(docToImagen);
}

export async function subirImagen(
	archivo: File,
	seccion: string,
	caption: string
): Promise<ImagenTesis> {
	const timestamp = Date.now();
	const ext = archivo.name.split('.').pop() ?? 'png';
	const nombreLimpio = archivo.name.replace(/\.[^.]+$/, '')
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.toLowerCase();
	const storagePath = `imagenes/${timestamp}_${nombreLimpio}.${ext}`;

	const storageRef = ref(storage, storagePath);
	await uploadBytes(storageRef, archivo);
	const url = await getDownloadURL(storageRef);

	const docRef = await addDoc(collection(db, COL), {
		nombre: archivo.name,
		caption,
		seccion,
		url,
		storagePath,
		ancho: 80,
		creado_en: serverTimestamp()
	});

	return {
		id: docRef.id,
		nombre: archivo.name,
		caption,
		seccion,
		url,
		storagePath,
		ancho: 80,
		creado_en: new Date()
	};
}

export async function actualizarImagen(id: string, data: Partial<Pick<ImagenTesis, 'caption' | 'ancho'>>): Promise<void> {
	await updateDoc(doc(db, COL, id), data);
}

export async function eliminarImagen(imagen: ImagenTesis): Promise<void> {
	try {
		await deleteObject(ref(storage, imagen.storagePath));
	} catch {
		// File may already be deleted from storage
	}
	await deleteDoc(doc(db, COL, imagen.id));
}
