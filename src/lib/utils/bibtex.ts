import type { Cita, TipoCita } from '$lib/types';

/**
 * Un parser básico de BibTeX para importar fuentes académicas.
 * Soporta los campos más comunes: author, year, title, journal, publisher, school, institution, url, pages.
 */
export function parseBibTeX(bib: string): Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] {
	const entries: Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] = [];
	
	// Limpieza básica: remover comentarios de BibTeX que no empiecen con @
	const lines = bib.split('\n');
	let cleanBib = '';
	let insideEntry = false;
	for (const line of lines) {
		if (line.trim().startsWith('@')) insideEntry = true;
		if (insideEntry) cleanBib += line + '\n';
		if (line.trim() === '}') insideEntry = false;
	}

	// Regex para capturar el tipo de entrada y su contenido
	// @tipo{llave, campos...}
	const entryRegex = /@(\w+)\s*\{\s*([^,]*),([\s\S]*?)\n\s*\}/g;
	let match;

	while ((match = entryRegex.exec(cleanBib)) !== null) {
		const type = match[1].toLowerCase();
		const body = match[3];
		
		const fields: Record<string, string> = {};
		
		// Regex para campos: nombre = {valor} o nombre = "valor" o nombre = valor
		// Maneja llaves anidadas simples y comillas
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

		// Determinar el tipo de cita en nuestra app
		let appTipo: TipoCita = 'libro';
		if (['article', 'periodical'].includes(type)) appTipo = 'articulo';
		else if (['techreport', 'manual', 'proceedings'].includes(type)) appTipo = 'reporte';
		else if (['phdthesis', 'mastersthesis', 'thesis'].includes(type)) appTipo = 'tesis';
		else if (['misc', 'online', 'booklet'].includes(type)) appTipo = 'web';

		// Fuente (depende del tipo)
		let fuente = fields.publisher || fields.journal || fields.school || fields.institution || fields.howpublished || '';
		if (!fuente && fields.url) fuente = fields.url;
		if (type === 'article' && fields.journal) {
			if (fields.volume) fuente += `, ${fields.volume}`;
			if (fields.number) fuente += `(${fields.number})`;
		}

		// Autores: BibTeX usa "and" para separar autores
		// Formatos: "First Last", "Last, First", "Last, First and Others"
		const autoresRaw = (fields.author || fields.editor || 'Anónimo')
			.split(/\s+and\s+/i)
			.map(a => {
				const parts = a.trim().split(/\s*,\s*/);
				if (parts.length === 2) {
					// Formato "Last, First" -> "Last, F."
					const last = parts[0];
					const first = parts[1].charAt(0).toUpperCase();
					return `${last}, ${first}.`;
				}
				// Formato "First Last" -> intentamos "Last, F."
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
			temas: [],
			notas: ''
		});
	}

	return entries;
}
