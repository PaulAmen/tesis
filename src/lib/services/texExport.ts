import JSZip from 'jszip';
import type { Borrador, Cita, TipoCita, SeccionUIIX, SeccionPersonalizada, ImagenTesis } from '$lib/types';
import { SECCIONES_UIIX, formatAutores, formatAutoresCorto } from '$lib/types';
import { CONTEXTO_TESIS } from '$lib/contexto-academico';

// ─── Mapeo de secciones a comandos LaTeX ───

interface SeccionTeX {
	comando: 'section' | 'subsection' | 'subsubsection';
	titulo: string;
}

const SECCIONES_TEX: Partial<Record<SeccionUIIX, SeccionTeX>> = {
	introduccion: { comando: 'section', titulo: 'Introducción' },

	// Cap. 1
	cap1_proyeccion: { comando: 'section', titulo: 'Capítulo 1. Proyección de la investigación' },
	cap1_linea_investigacion: { comando: 'subsection', titulo: 'Línea de investigación de la Universidad de Innovación e Investigación de México y su ámbito de estudio' },
	cap1_planteamiento: { comando: 'subsection', titulo: 'Planteamiento del problema' },
	cap1_formulacion: { comando: 'subsection', titulo: 'Formulación del problema (Pregunta de investigación)' },
	cap1_justificacion: { comando: 'subsection', titulo: 'Justificación' },
	cap1_objeto: { comando: 'subsection', titulo: 'Objeto de estudio' },
	cap1_campo_accion: { comando: 'subsection', titulo: 'Campo de acción' },
	cap1_objetivos: { comando: 'subsection', titulo: 'Objetivos' },
	cap1_hipotesis: { comando: 'subsection', titulo: 'Hipótesis' },
	cap1_alcance: { comando: 'subsection', titulo: 'Alcance temático' },
	cap1_delimitacion: { comando: 'subsection', titulo: 'Delimitación Espacial y Temporal' },

	// Cap. 2
	cap2_fundamentos: { comando: 'section', titulo: 'CAPÍTULO 2. Fundamentos Teóricos Referenciales' },
	cap2_estado_arte: { comando: 'subsection', titulo: 'Estado del arte (Marco Histórico y Actual)' },
	cap2_marco_teorico: { comando: 'subsection', titulo: 'Marco Teórico' },
	cap2_marco_conceptual: { comando: 'subsection', titulo: 'Marco Conceptual' },
	cap2_marco_contextual: { comando: 'subsection', titulo: 'Marco Contextual' },
	cap2_marco_legal: { comando: 'subsection', titulo: 'Marco Legal y Normativo' },

	// Cap. 3
	cap3_metodologia: { comando: 'section', titulo: 'Capítulo 3. Fundamentos metodológicos y resultados de investigación' },
	cap3_operacionalizacion: { comando: 'subsection', titulo: 'Cuadro Operacionalización de variables' },
	cap3_diseno: { comando: 'subsection', titulo: 'Diseño metodológico' },
	cap3_trabajo_campo: { comando: 'subsection', titulo: 'Trabajo de campo / Presentación de evidencias' },
	cap3_resultados_discusion: { comando: 'subsection', titulo: 'Análisis de los resultados obtenidos' },

	// Cap. 4
	cap4_propuesta: { comando: 'section', titulo: 'Capítulo IV: PROPUESTA DE TRANSFORMACIÓN' },
	cap4_fundamentacion: { comando: 'subsection', titulo: 'Fundamentación de la propuesta' },
	cap4_descripcion: { comando: 'subsection', titulo: 'Estructura de la propuesta' },
	cap4_objetivos_propuesta: { comando: 'subsection', titulo: 'Objetivos de la propuesta' },
	cap4_fases: { comando: 'subsection', titulo: 'Fases de implementación' },
	cap4_recursos: { comando: 'subsection', titulo: 'Recursos' },
	cap4_resultados_esperados: { comando: 'subsection', titulo: 'Resultados esperados' },
	cap4_validacion: { comando: 'subsection', titulo: 'Valoración / validación de la propuesta' },

	// Finales
	conclusiones: { comando: 'section', titulo: 'CONCLUSIONES' },
	recomendaciones: { comando: 'section', titulo: 'RECOMENDACIONES' },
};

// Orden deseado de las secciones en el documento
const ORDEN_SECCIONES: SeccionUIIX[] = [
	'introduccion',
	'cap1_proyeccion', 'cap1_linea_investigacion', 'cap1_planteamiento',
	'cap1_formulacion', 'cap1_justificacion', 'cap1_objeto',
	'cap1_campo_accion', 'cap1_objetivos', 'cap1_hipotesis',
	'cap1_alcance', 'cap1_delimitacion',
	'cap2_fundamentos', 'cap2_estado_arte', 'cap2_marco_teorico',
	'cap2_marco_conceptual', 'cap2_marco_contextual', 'cap2_marco_legal',
	'cap3_metodologia', 'cap3_operacionalizacion', 'cap3_diseno',
	'cap3_trabajo_campo', 'cap3_resultados_discusion',
	'cap4_propuesta', 'cap4_fundamentacion', 'cap4_descripcion',
	'cap4_objetivos_propuesta', 'cap4_fases', 'cap4_recursos',
	'cap4_resultados_esperados', 'cap4_validacion',
	'conclusiones', 'recomendaciones',
];

// ─── Escapar caracteres especiales de LaTeX ───

function escaparTeX(texto: string): string {
	// Protegemos comandos que nosotros mismos insertamos o que el usuario
	// podría querer usar (como \begin, \end, \textcite, \parencite)
	// Esta regex intenta capturar el comando y sus argumentos entre llaves o corchetes
	const protegidos: string[] = [];
	let procesado = texto.replace(/\\(begin|end|textcite|parencite|singlespacing|url|cite|printbibliography|newpage|section|subsection|subsubsection|tableofcontents|listoffigures|listoftables|textbf|textit|Huge|Large|large|bfseries|vspace|vfill|noindent|label|caption|includegraphics|centering|onehalfspacing|addbibresource|DeclareLanguageMapping|usepackage|documentclass)(?:\[[^\]]*\])?(?:\{[^}]*\})*|\\\\\n?/g, (match) => {
		protegidos.push(match);
		// Usamos un marcador sin guiones bajos ni caracteres especiales para evitar que sea escapado
		return `CMDPROT${protegidos.length - 1}IDX`;
	});

	procesado = procesado
		.replace(/\\/g, '\\textbackslash{}')
		.replace(/[&%$#_{}]/g, (m) => '\\' + m)
		.replace(/~/g, '\\textasciitilde{}')
		.replace(/\^/g, '\\textasciicircum{}');

	// Restauramos protegidos
	return procesado.replace(/CMDPROT(\d+)IDX/g, (_, i) => protegidos[parseInt(i)]);
}

// ─── Generar clave BibTeX única para una cita ───

function generarClaveBib(cita: Cita): string {
	const apellido = (cita.autores[0] ?? 'anon')
		.split(',')[0]
		.split(' ')[0]
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z]/g, '')
		.toLowerCase();
	
	// Limpiamos también el fragmento del ID para evitar caracteres no permitidos en llaves BibTeX
	const idPart = cita.id.slice(0, 6).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	
	return `${apellido}${cita.año}${idPart}`;
}

// ─── Mapeo TipoCita → tipo de entrada BibTeX ───

const BIBTEX_TYPES: Record<TipoCita, string> = {
	libro: '@book',
	articulo: '@article',
	reporte: '@techreport',
	tesis: '@phdthesis',
	web: '@misc',
};

// ─── Escapar caracteres para BibTeX (similar a LaTeX pero más simple para campos) ───

function escaparBibTeX(texto: string): string {
	if (!texto) return '';
	return texto
		.replace(/[&%$#_{}]/g, (m) => '\\' + m)
		.replace(/~/g, '\\textasciitilde{}')
		.replace(/\^/g, '\\textasciicircum{}');
}

// ─── Generar archivo .bib completo ───

export function generarBib(citas: Cita[]): string {
	if (citas.length === 0) return '% No hay referencias cargadas.\n';

	const sorted = [...citas].sort((a, b) => {
		const autorA = (a.autores[0] ?? '').toLowerCase();
		const autorB = (b.autores[0] ?? '').toLowerCase();
		if (autorA < autorB) return -1;
		if (autorA > autorB) return 1;
		return a.año - b.año;
	});

	return sorted.map((c) => {
		const tipo = BIBTEX_TYPES[c.tipo] ?? '@misc';
		const clave = generarClaveBib(c);
		// BibTeX autores deben separarse por ' and '
		const autor = c.autores.join(' and ');

		const campos: string[] = [
			`  author       = {${escaparBibTeX(autor)}}`,
			`  title        = {${escaparBibTeX(c.titulo)}}`,
			`  year         = {${c.año}}`,
			`  date         = {${c.año}}`,
		];

		switch (c.tipo) {
			case 'libro':
				if (c.fuente) campos.push(`  publisher    = {${escaparBibTeX(c.fuente)}}`);
				break;
			case 'articulo':
				if (c.fuente) {
					campos.push(`  journal      = {${escaparBibTeX(c.fuente)}}`);
					campos.push(`  journaltitle = {${escaparBibTeX(c.fuente)}}`);
				}
				if (c.paginas) campos.push(`  pages        = {${escaparBibTeX(c.paginas)}}`);
				break;
			case 'reporte':
				if (c.fuente) campos.push(`  institution  = {${escaparBibTeX(c.fuente)}}`);
				break;
			case 'tesis':
				if (c.fuente) {
					campos.push(`  school       = {${escaparBibTeX(c.fuente)}}`);
					campos.push(`  institution  = {${escaparBibTeX(c.fuente)}}`);
				}
				campos.push(`  type         = {Tesis doctoral}`);
				break;
			case 'web':
				if (c.fuente) {
					campos.push(`  url          = {${c.fuente}}`);
					campos.push(`  howpublished = {\\url{${c.fuente}}}`);
				}
				break;
		}

		// Añadimos una coma al final de cada campo y cerramos la llave
		return `${tipo}{${clave},\n${campos.join(',\n')}\n}`;
	}).join('\n\n') + '\n';
}

// ─── Agrupar borradores por sección ───

function agruparBorradores(borradores: Borrador[]): Record<string, string> {
	const agrupados: Record<string, string> = {};

	for (const b of borradores) {
		if (!b.contenido.trim()) continue;
		if (agrupados[b.seccion]) {
			agrupados[b.seccion] += '\n\n' + b.contenido;
		} else {
			agrupados[b.seccion] = b.contenido;
		}
	}

	return agrupados;
}

// ─── Nombre de archivo seguro para imágenes ───

function nombreArchivoImagen(img: ImagenTesis): string {
	const ext = img.nombre.split('.').pop() ?? 'png';
	const base = img.nombre.replace(/\.[^.]+$/, '')
		.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.toLowerCase();
	return `${base}_${img.id.slice(0, 6)}.${ext}`;
}

// ─── Reemplazar citas inline con comandos BibLaTeX ───

function reemplazarCitas(texto: string, citas: Cita[]): string {
	let resultado = texto;
	
	// Ordenamos las citas por longitud del nombre del autor (descendente) para evitar matches parciales
	const sortedCitas = [...citas].sort((a, b) => {
		const lenA = formatAutoresCorto(a.autores).length;
		const lenB = formatAutoresCorto(b.autores).length;
		return lenB - lenA;
	});

	for (const c of sortedCitas) {
		const key = generarClaveBib(c);
		const autores = formatAutoresCorto(c.autores).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const año = c.año;

		// 1. Parentética con páginas: (Autores, Año, p. X) -> \parencite[X]{key}
		const parenPagesRegex = new RegExp(`\\(${autores}, ${año}, p\\. ([^)]+)\\)`, 'g');
		resultado = resultado.replace(parenPagesRegex, `\\parencite[$1]{${key}}`);

		// 2. Parentética simple: (Autores, Año) -> \parencite{key}
		const parenRegex = new RegExp(`\\(${autores}, ${año}\\)`, 'g');
		resultado = resultado.replace(parenRegex, `\\parencite{${key}}`);

		// 3. Narrativa con páginas: Autores (Año, p. X) -> \textcite[X]{key}
		const textPagesRegex = new RegExp(`${autores} \\(${año}, p\\. ([^)]+)\\)`, 'g');
		resultado = resultado.replace(textPagesRegex, `\\textcite[$1]{${key}}`);

		// 4. Narrativa simple: Autores (Año) -> \textcite{key}
		const textRegex = new RegExp(`${autores} \\(${año}\\)`, 'g');
		resultado = resultado.replace(textRegex, `\\textcite{${key}}`);
		
		// 5. Cita de cita: Autor (citado en Autores, Año)
		const citaDeCitaRegex = new RegExp(`([^)]+) \\(citado en ${autores}, ${año}\\)`, 'g');
		resultado = resultado.replace(citaDeCitaRegex, `$1 \\parencite[citado en]{${key}}`);
	}

	return resultado;
}

// ─── Convertir saltos de línea a LaTeX ───
//   \n\n  → párrafo nuevo (se mantiene como línea en blanco)
//   \n    → \\ (salto de línea forzado)

function procesarSaltos(texto: string): string {
	return texto
		.replace(/\r\n/g, '\n')
		.split(/\n{2,}/)
		.map(parrafo => parrafo.replace(/\n/g, '\\\\\n'))
		.join('\n\n');
}

// ─── Procesar un segmento de texto: citas + escape + saltos de línea ───

function procesarSegmento(texto: string, citas: Cita[]): string {
	// 1. Reemplazamos citas por sus comandos LaTeX (antes de escapar para que los comandos sean protegidos)
	const conCitas = reemplazarCitas(texto, citas);
	// 2. Escapamos caracteres especiales de LaTeX (protegiendo los comandos de cita recién creados)
	const escapado = escaparTeX(conCitas);
	// 3. Procesamos saltos de línea
	return procesarSaltos(escapado);
}

// ─── Procesar contenido completo: figuras, citas y saltos ───

function procesarContenido(
	texto: string,
	imagenesMap: Map<string, ImagenTesis>,
	citas: Cita[]
): string {
	const partes: string[] = [];
	let ultimo = 0;
	const regex = /\[fig:([^\]]+)\]/g;
	let match;

	while ((match = regex.exec(texto)) !== null) {
		if (match.index > ultimo) {
			partes.push(procesarSegmento(texto.substring(ultimo, match.index), citas));
		}
		const id = match[1];
		const img = imagenesMap.get(id);
		if (img) {
			const archivo = nombreArchivoImagen(img);
			const caption = img.caption ? escaparTeX(img.caption) : 'Sin descripción';
			const ancho = (img.ancho ?? 80) / 100;
			partes.push([
				'',
				'\\begin{figure}[htbp]',
				'    \\centering',
				`    \\includegraphics[width=${ancho}\\textwidth]{imagenes/${archivo}}`,
				`    \\caption{${caption}}`,
				`    \\label{fig:${id}}`,
				'\\end{figure}',
				''
			].join('\n'));
		} else {
			partes.push(`% Imagen no encontrada: ${id}`);
		}
		ultimo = match.index + match[0].length;
	}

	if (ultimo < texto.length) {
		partes.push(procesarSegmento(texto.substring(ultimo), citas));
	}

	return partes.join('');
}

// ─── Generar el documento .tex completo ───

export function generarTeX(
	borradores: Borrador[],
	citas: Cita[],
	titulo?: string,
	seccionesPersonalizadas: SeccionPersonalizada[] = [],
	imagenes: ImagenTesis[] = []
): string {
	const ctx = CONTEXTO_TESIS;
	const tituloDoc = titulo || ctx.tema;
	const contenidoPorSeccion = agruparBorradores(borradores);
	const imagenesMap = new Map(imagenes.map(img => [img.id, img]));

	const partes: string[] = [];

	// ── Preámbulo ──
	partes.push(`\\documentclass[doc, 12pt]{apa7}

% --- PAQUETES DE IDIOMA Y TIPOGRAFÍA ---
\\usepackage[spanish, es-tabla]{babel}
\\usepackage[utf8]{inputenc}
\\usepackage{mathptmx}

% --- PAQUETES DE FORMATO UIIX ---
\\usepackage[letterpaper, left=4cm, top=2.5cm, right=2.5cm, bottom=2.5cm]{geometry}
\\usepackage{setspace}
\\onehalfspacing
\\usepackage[document]{ragged2e}

% --- PAQUETES GRÁFICOS Y TABLAS ---
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{tabularx}
\\usepackage{pdflscape}

% --- BIBLIOGRAFÍA ---
\\usepackage{url}
\\usepackage[style=apa, sortcites=true, sorting=nyt, backend=biber]{biblatex}
\\DeclareLanguageMapping{spanish}{spanish-apa}
\\addbibresource{referencias.bib}

\\begin{document}`);

	// ── Portada UIIX ──
	partes.push(`
% ==========================================
% PORTADA UIIX
% ==========================================
\\begin{titlepage}
    \\centering

    {\\Huge\\bfseries Universidad de Investigación e Innovación de México\\par}
    \\vspace{2cm}

    {\\Large ${escaparTeX(tituloDoc)}\\par}
    \\vspace{1.5cm}

    {\\Large \\textbf{TESIS DOCTORAL}\\par}
    {\\large que, para obtener el Grado de Ph.D.\\par}
    \\vspace{0.5cm}
    {\\large \\textbf{Doctor en Educación e Innovación}\\par}
    \\vspace{2cm}

    {\\large \\textbf{PRESENTA}\\par}
    {\\Large Paúl\\par}
    \\vspace{1.5cm}

    {\\large \\textbf{ASESOR}\\par}
    {\\Large Nombre del asesor\\par}
    \\vfill

    {\\large México, ${new Date().getFullYear()}\\par}
\\end{titlepage}`);

	// ── Páginas preliminares ──
	partes.push(`
% ==========================================
% PÁGINAS PRELIMINARES
% ==========================================
\\newpage
\\noindent La presente Tesis Doctoral debe ser citada como:\\\\
\\textit{Apellidos del autor, Paúl (${new Date().getFullYear()}). ${escaparTeX(tituloDoc)}. [Tesis de Doctorado de la Universidad de Investigación e Innovación de México - UIIX]}

\\vspace{2cm}
\\noindent Esta obra está bajo una Licencia Creative Commons Atribución-NoComercial-SinDerivar 4.0 Internacional.

\\newpage
\\section*{Resumen}
Texto del resumen aquí...

\\newpage
\\section*{Abstract}
Texto del abstract aquí...

\\newpage
\\section*{Agradecimientos}
Texto de agradecimientos aquí...

\\newpage
\\section*{Dedicatorias}
Texto de dedicatorias aquí...`);

	// ── Índices ──
	partes.push(`
% ==========================================
% ÍNDICES
% ==========================================
\\newpage
\\tableofcontents
\\newpage
\\listoffigures
\\newpage
\\listoftables`);

	// ── Cuerpo de la tesis ──
	partes.push(`
% ==========================================
% CUERPO DE LA TESIS
% ==========================================`);

	for (const seccion of ORDEN_SECCIONES) {
		const texInfo = SECCIONES_TEX[seccion];
		if (!texInfo) continue;

		const contenido = contenidoPorSeccion[seccion];

		// Solo agregar \newpage antes de \section (capítulos principales)
		if (texInfo.comando === 'section') {
			partes.push(`\n\\newpage`);
		}

		partes.push(`\\${texInfo.comando}{${texInfo.titulo}}`);

		if (contenido) {
			partes.push(procesarContenido(contenido, imagenesMap, citas));
		} else {
			partes.push(`% Sin contenido redactado aún para: ${SECCIONES_UIIX[seccion]}`);
		}
	}

	// ── Secciones personalizadas ──
	for (const sec of seccionesPersonalizadas) {
		const key = `custom_${sec.id}`;
		const contenido = contenidoPorSeccion[key];
		if (contenido) {
			partes.push(`\n\\newpage`);
			partes.push(`\\section{${escaparTeX(sec.nombre)}}`);
			partes.push(procesarContenido(contenido, imagenesMap, citas));
		}
	}

	// ── Bibliografía (usa el archivo referencias.bib) ──
	partes.push(`
\\newpage
\\printbibliography[title=BIBLIOGRAFÍA]`);

	// ── Anexos ──
	partes.push(`
\\newpage
\\section{ANEXOS}
\\small
% Documentos complementarios aquí...

\\end{document}`);

	return partes.join('\n');
}

// ─── Descargar todo como .zip ───

export { nombreArchivoImagen };

export async function descargarTeX(
	texContenido: string,
	bibContenido: string,
	imagenes: ImagenTesis[] = []
): Promise<void> {
	const zip = new JSZip();

	zip.file('tesis_uiix.tex', texContenido);
	zip.file('referencias.bib', bibContenido);

	// Download and add each image
	if (imagenes.length > 0) {
		const imgFolder = zip.folder('imagenes')!;
		const descargas = imagenes.map(async (img) => {
			try {
				const resp = await fetch(img.url);
				const blob = await resp.blob();
				imgFolder.file(nombreArchivoImagen(img), blob);
			} catch {
				// Skip images that fail to download
			}
		});
		await Promise.all(descargas);
	}

	const blob = await zip.generateAsync({ type: 'blob' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'tesis_uiix.zip';
	a.click();
	URL.revokeObjectURL(url);
}
