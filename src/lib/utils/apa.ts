import type { TipoCita } from '$lib/types';
import { formatAutores } from '$lib/types';

interface ApaInput {
	autores: string[];
	año: number;
	titulo: string;
	fuente: string;
	paginas: string;
	tipo: TipoCita;
}

export function generarReferenciaAPA(data: ApaInput): string {
	const { autores, año, titulo, fuente, paginas, tipo } = data;
	const autor = formatAutores(autores);

	switch (tipo) {
		case 'libro': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(`${fuente}.`);
			return parts.join(' ');
		}
		case 'articulo': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente && paginas) {
				parts.push(`${fuente}, ${paginas}.`);
			} else if (fuente) {
				parts.push(`${fuente}.`);
			}
			return parts.join(' ');
		}
		case 'reporte': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(`${fuente}.`);
			return parts.join(' ');
		}
		case 'tesis': {
			const parts = [`${autor} (${año}).`, `${titulo} [Tesis doctoral].`];
			if (fuente) parts.push(`${fuente}.`);
			return parts.join(' ');
		}
		case 'web': {
			const parts = [`${autor} (${año}).`, `${titulo}.`];
			if (fuente) parts.push(fuente);
			return parts.join(' ');
		}
		default:
			return `${autor} (${año}). ${titulo}.`;
	}
}
