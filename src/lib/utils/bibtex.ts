import type { Cita, TipoCita } from '$lib/types';

/** Mapa de comandos LaTeX comunes a caracteres Unicode */
const LATEX_MAP: Record<string, Record<string, string>> = {
	'`': { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù', A: 'À', E: 'È', I: 'Ì', O: 'Ò', U: 'Ù' },
	"'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', c: 'ć', C: 'Ć', n: 'ń', N: 'Ń', s: 'ś', S: 'Ś', z: 'ź', Z: 'Ź' },
	'^': { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û', A: 'Â', E: 'Ê', I: 'Î', O: 'Ô', U: 'Û' },
	'"': { a: 'ä', e: 'ë', i: 'ï', o: 'ö', u: 'ü', A: 'Ä', E: 'Ë', I: 'Ï', O: 'Ö', U: 'Ü' },
	'~': { a: 'ã', n: 'ñ', o: 'õ', A: 'Ã', N: 'Ñ', O: 'Õ' },
	'c': { c: 'ç', C: 'Ç', s: 'ş', S: 'Ş' },
	'v': { c: 'č', C: 'Č', s: 'š', S: 'Š', z: 'ž', Z: 'Ž', r: 'ř', R: 'Ř', n: 'ň', N: 'Ň', e: 'ě', E: 'Ě', d: 'ď', D: 'Ď', t: 'ť', T: 'Ť' },
	'u': { a: 'ă', A: 'Ă', g: 'ğ', G: 'Ğ' },
	'H': { o: 'ő', O: 'Ő', u: 'ű', U: 'Ű' },
	'k': { a: 'ą', A: 'Ą', e: 'ę', E: 'Ę' },
	'.': { z: 'ż', Z: 'Ż', e: 'ė', E: 'Ė' },
	'=': { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū', A: 'Ā', E: 'Ē', I: 'Ī', O: 'Ō', U: 'Ū' },
};

const LATEX_SPECIAL: Record<string, string> = {
	'\\aa': 'å', '\\AA': 'Å', '\\ae': 'æ', '\\AE': 'Æ',
	'\\oe': 'œ', '\\OE': 'Œ', '\\o': 'ø', '\\O': 'Ø',
	'\\ss': 'ß', '\\i': 'ı', '\\l': 'ł', '\\L': 'Ł',
};

function cleanLatex(str: string): string {
	let result = str;

	// Replace special commands: \aa, \ss, etc.
	for (const [cmd, ch] of Object.entries(LATEX_SPECIAL)) {
		result = result.replaceAll(cmd, ch);
	}

	// Replace {\cmd{X}} patterns: e.g. {\v{c}} -> č
	result = result.replace(/\{\\(\w)\{(\w)\}\}/g, (_, cmd, letter) => {
		return LATEX_MAP[cmd]?.[letter] ?? letter;
	});

	// Replace \cmd{X} patterns: e.g. \v{c} -> č
	result = result.replace(/\\(\w)\{(\w)\}/g, (_, cmd, letter) => {
		return LATEX_MAP[cmd]?.[letter] ?? letter;
	});

	// Replace \'X or \~X patterns (single char commands): e.g. \'a -> á
	result = result.replace(/\\([`'^"~=.])\{(\w)\}/g, (_, cmd, letter) => {
		return LATEX_MAP[cmd]?.[letter] ?? letter;
	});
	result = result.replace(/\\([`'^"~=.])(\w)/g, (_, cmd, letter) => {
		return LATEX_MAP[cmd]?.[letter] ?? letter;
	});

	// Remove remaining braces
	result = result.replace(/\{|\}/g, '');

	return result.trim();
}

/** Extrae el valor de un campo BibTeX respetando llaves anidadas */
function extractBracedValue(body: string, startIdx: number): { value: string; endIdx: number } | null {
	if (body[startIdx] !== '{') return null;
	let depth = 1;
	let i = startIdx + 1;
	while (i < body.length && depth > 0) {
		if (body[i] === '{') depth++;
		else if (body[i] === '}') depth--;
		i++;
	}
	if (depth !== 0) return null;
	return { value: body.substring(startIdx + 1, i - 1), endIdx: i };
}

function parseFields(body: string): Record<string, string> {
	const fields: Record<string, string> = {};
	const nameRegex = /(\w+)\s*=\s*/g;
	let m;

	while ((m = nameRegex.exec(body)) !== null) {
		const name = m[1].toLowerCase();
		const afterEq = m.index + m[0].length;
		let value: string | null = null;

		if (body[afterEq] === '{') {
			const extracted = extractBracedValue(body, afterEq);
			if (extracted) {
				value = extracted.value;
				nameRegex.lastIndex = extracted.endIdx;
			}
		} else if (body[afterEq] === '"') {
			const end = body.indexOf('"', afterEq + 1);
			if (end >= 0) {
				value = body.substring(afterEq + 1, end);
				nameRegex.lastIndex = end + 1;
			}
		} else {
			const numMatch = body.substring(afterEq).match(/^(\d+)/);
			if (numMatch) {
				value = numMatch[1];
				nameRegex.lastIndex = afterEq + numMatch[1].length;
			}
		}

		if (value !== null) {
			fields[name] = cleanLatex(value.replace(/\s+/g, ' ').trim());
		}
	}

	return fields;
}

/**
 * Parser de BibTeX para importar fuentes académicas.
 * Usa conteo de llaves, soporta entradas en una sola línea o multilínea.
 * Convierte comandos LaTeX a Unicode.
 */
export function parseBibTeX(bib: string): Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] {
	const entries: Omit<Cita, 'id' | 'creado_en' | 'referencia_apa'>[] = [];

	const entryStartRegex = /@(\w+)\s*\{\s*([^,]*),/g;
	let startMatch;

	while ((startMatch = entryStartRegex.exec(bib)) !== null) {
		const type = startMatch[1].toLowerCase();
		const bodyStart = startMatch.index + startMatch[0].length;

		let depth = 1;
		let i = bodyStart;
		while (i < bib.length && depth > 0) {
			if (bib[i] === '{') depth++;
			else if (bib[i] === '}') depth--;
			i++;
		}
		if (depth !== 0) continue;

		const body = bib.substring(bodyStart, i - 1);
		const fields = parseFields(body);

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
