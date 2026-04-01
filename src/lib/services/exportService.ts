import { PUBLIC_GAS_WEB_APP_URL } from '$env/static/public';
import { SECCIONES_UIIX } from '$lib/types';
import type { Borrador } from '$lib/types';
import type { ExportAction, ExportPayload, ExportResponse, ExportResult } from '$lib/types';

/**
 * Construye el `documentData` usando el nombre legible de cada sección
 * (ej. "Cap. 1 — Planteamiento del problema") como clave.
 * El backend buscará el placeholder {{Cap. 1 — Planteamiento del problema}} en la plantilla.
 */
function buildDocumentData(borradores: Borrador[]): Record<string, string> {
	const data: Record<string, string> = {};

	for (const borrador of borradores) {
		if (!borrador.contenido.trim()) continue;

		const nombreSeccion = SECCIONES_UIIX[borrador.seccion as keyof typeof SECCIONES_UIIX] ?? borrador.seccion;
		if (data[nombreSeccion]) {
			data[nombreSeccion] = data[nombreSeccion] + '\n\n' + borrador.contenido;
		} else {
			data[nombreSeccion] = borrador.contenido;
		}
	}

	return data;
}

/**
 * Exporta los borradores a Google Docs o PDF a través del Web App de GAS.
 *
 * @param borradores  Lista de borradores a exportar (todos o un subconjunto).
 * @param action      "generate_doc" para obtener un Google Doc editable,
 *                    "generate_pdf" para obtener un PDF en Drive.
 * @param templateId  ID del Google Doc que actúa como plantilla.
 * @param title       Título opcional del documento generado.
 * @returns           URL del documento o PDF generado.
 * @throws            Error con mensaje descriptivo si la petición falla.
 */
export async function exportarBorradores(
	borradores: Borrador[],
	action: ExportAction,
	templateId: string,
	title?: string
): Promise<string> {
	const payload: ExportPayload = {
		action,
		templateId,
		title,
		documentData: buildDocumentData(borradores)
	};

	// GAS Web Apps redirigen internamente a script.googleusercontent.com.
	// Usar 'text/plain' evita el preflight OPTIONS; 'follow' asegura que
	// fetch siga la redirección y reciba la respuesta con CORS headers.
	const response = await fetch(PUBLIC_GAS_WEB_APP_URL, {
		method: 'POST',
		redirect: 'follow',
		headers: { 'Content-Type': 'text/plain;charset=utf-8' },
		body: JSON.stringify(payload)
	});

	if (!response.ok) {
		throw new Error(`Error HTTP ${response.status} al contactar el servicio de exportación.`);
	}

	const result: ExportResponse = await response.json();

	if (!result.success) {
		throw new Error(result.error ?? 'Error desconocido en el servicio de exportación.');
	}

	return (result as ExportResult).url;
}
