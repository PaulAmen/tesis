import type { TipoCita } from '$lib/types';
import { formatAutores } from '$lib/types';

interface ApaInput {
	autores: string[];
	año: number;
	titulo: string;
	fuente: string;
	paginas: string;
	tipo: TipoCita;
	doi?: string;
}

export function generarReferenciaAPA(data: ApaInput): string {
	const { autores, año, titulo, fuente, paginas, tipo, doi } = data;
	const autor = formatAutores(autores);

	let ref: string;
	switch (tipo) {
		case 'libro': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(`${fuente}.`);
			ref = parts.join(' ');
			break;
		}
		case 'articulo': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente && paginas) {
				parts.push(`${fuente}, ${paginas}.`);
			} else if (fuente) {
				parts.push(`${fuente}.`);
			}
			ref = parts.join(' ');
			break;
		}
		case 'reporte': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(`${fuente}.`);
			ref = parts.join(' ');
			break;
		}
		case 'tesis': {
			const parts = [`${autor} (${año}).`, `${titulo} [Tesis doctoral].`];
			if (fuente) parts.push(`${fuente}.`);
			ref = parts.join(' ');
			break;
		}
		case 'web': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(fuente);
			ref = parts.join(' ');
			break;
		}
		default:
			ref = `${autor} (${año}). ${titulo}.`;
	}

	if (doi) {
		const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
		ref += ` ${doiUrl}`;
	}

	return ref;
}
