import type { Cita, TipoCita } from '$lib/types';

/**
 * Un parser de BibTeX para importar fuentes académicas.
 * Usa conteo de llaves para encontrar entradas, soporta entradas en una sola línea o multilínea.
 */
export function parseBibTeX(bib: string): Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] {
	const entries: Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] = [];

	const entryStartRegex = /@(\w+)\s*\{\s*([^,]*),/g;
	let startMatch;

	while ((startMatch = entryStartRegex.exec(bib)) !== null) {
		const type = startMatch[1].toLowerCase();
		const bodyStart = startMatch.index + startMatch[0].length;

		// Conteo de llaves para encontrar el cierre de la entrada
		let depth = 1;
		let i = bodyStart;
		while (i < bib.length && depth > 0) {
			if (bib[i] === '{') depth++;
			else if (bib[i] === '}') depth--;
			i++;
		}
		if (depth !== 0) continue;

		const body = bib.substring(bodyStart, i - 1);

		const fields: Record<string, string> = {};
		const fieldRegex = /(\w+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)"|(\d+))/g;
		let fieldMatch;

		while ((fieldMatch = fieldRegex.exec(body)) !== null) {
			const name = fieldMatch[1].toLowerCase();
			const value = fieldMatch[2] || fieldMatch[3] || fieldMatch[4];
			if (value) {
				fields[name] = value.replace(/\s+/g, ' ').trim();
			}
		}

		if (!fields.title) continue;

		let appTipo: TipoCita = 'libro';
		if (['article', 'periodical'].includes(type)) appTipo = 'articulo';
		else if (['techreport', 'manual', 'proceedings'].includes(type)) appTipo = 'reporte';
		else if (['phdthesis', 'mastersthesis', 'thesis'].includes(type)) appTipo = 'tesis';
		else if (['misc', 'online', 'booklet'].includes(type)) appTipo = 'web';

		let fuente = fields.publisher || fields.journal || fields.school || fields.institution || fields.howpublished || '';
		if (!fuente && fields.url) fuente = fields.url;
		if (type === 'article' && fields.journal) {
			if (fields.volume) fuente += `, ${fields.volume}`;
			if (fields.number) fuente += `(${fields.number})`;
		}

		const autoresRaw = (fields.author || fields.editor || 'Anónimo')
			.split(/\s+and\s+/i)
			.map(a => {
				const parts = a.trim().split(/\s*,\s*/);
				if (parts.length === 2) {
					const last = parts[0];
					const first = parts[1].charAt(0).toUpperCase();
					return `${last}, ${first}.`;
				}
				const nameParts = a.trim().split(/\s+/);
				if (nameParts.length > 1) {
					const last = nameParts[nameParts.length - 1];
					const first = nameParts[0].charAt(0).toUpperCase();
					return `${last}, ${first}.`;
				}
				return a.trim();
			});

		entries.push({
			autores: autoresRaw,
			año: parseInt(fields.year || fields.date || '0'),
			titulo: fields.title,
			fuente,
			cita_textual: '',
			paginas: fields.pages || '',
			tipo: appTipo,
			doi: fields.doi || '',
			temas: [],
			notas: ''
		});
	}

	return entries;
}
