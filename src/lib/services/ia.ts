import {
	REGLAS_APA7,
	REGLAS_REDACCION_UIIX,
	REGLAS_POR_SECCION,
	resumenContexto
} from '$lib/contexto-academico';

const SYSTEM_PROMPT = `Eres un asistente académico experto en escritura de tesis doctorales en español bajo estructura UIIX. Sé conciso y académico.

${REGLAS_REDACCION_UIIX}`;

async function llamarGemini(userPrompt: string, systemOverride?: string): Promise<string> {
	const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
	if (!apiKey) throw new Error('API key de Gemini no configurada');

	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: { parts: [{ text: systemOverride ?? SYSTEM_PROMPT }] },
				contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
				generationConfig: { maxOutputTokens: 1500 }
			})
		}
	);

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Error de Gemini API: ${res.status} — ${err}`);
	}

	const data = await res.json();
	if (data.promptFeedback?.blockReason) {
		throw new Error(`Contenido bloqueado por Gemini: ${data.promptFeedback.blockReason}`);
	}
	if (!data.candidates?.length) {
		throw new Error('Gemini no generó respuesta');
	}
	return data.candidates[0].content.parts[0].text ?? '';
}

// ─── Funciones de citas (inyectan REGLAS_APA7) ───

export async function puntosClavesCita(cita: { autores: string[]; año: number; titulo: string; cita_textual: string }): Promise<string> {
	const autor = cita.autores.join(', ');
	return llamarGemini(
		`${resumenContexto()}

Analiza la siguiente cita y explica qué aporta a esta tesis. Sé conciso (máximo 3 puntos).

Autor: ${autor} (${cita.año})
Título: ${cita.titulo}
Cita textual: "${cita.cita_textual}"`
	);
}

export async function comoUsarCita(cita: { autores: string[]; año: number; titulo: string; cita_textual: string; temas: string[] }): Promise<string> {
	const autor = cita.autores.join(', ');
	return llamarGemini(
		`${resumenContexto()}

${REGLAS_APA7}

Indica en qué sección UIIX encaja mejor esta cita y redacta un párrafo ejemplo usándola. Aplica formato APA 7 en la citación.

Autor: ${autor} (${cita.año})
Título: ${cita.titulo}
Temas: ${cita.temas.join(', ')}
Cita textual: "${cita.cita_textual}"`
	);
}

export async function conexionesIACita(
	cita: { autores: string[]; año: number; titulo: string; cita_textual: string; temas: string[] },
	otrasCitas: { autores: string[]; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const autor = cita.autores.join(', ');
	const listaCitas = otrasCitas.map(c => `- ${c.autores.join(', ')} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`${resumenContexto()}

Identifica conexiones temáticas, teóricas o metodológicas entre esta cita y las demás.

Cita principal:
${autor} (${cita.año}): ${cita.titulo}
Temas: ${cita.temas.join(', ')}
Cita textual: "${cita.cita_textual}"

Otras citas en la tesis:
${listaCitas}`
	);
}

// ─── Funciones de redacción (inyectan REGLAS_REDACCION + APA + sección) ───

export async function redactarParrafo(
	seccion: string,
	contenidoActual: string,
	citas: { autor: string; año: number; cita_textual: string }[]
): Promise<string> {
	const citasTexto = citas.map(c => `- ${c.autor} (${c.año}): "${c.cita_textual}"`).join('\n');
	const seccionKey = Object.entries(REGLAS_POR_SECCION).find(([_, v]) => v.includes(seccion))?.[0] ?? '';
	const reglasSeccion = seccionKey ? REGLAS_POR_SECCION[seccionKey] : '';

	return llamarGemini(
		`${resumenContexto()}

${REGLAS_APA7}

${reglasSeccion}

Redacta un párrafo académico para la sección "${seccion}". Integra las citas con formato APA 7 (Autor, año).

Contenido actual:
${contenidoActual || '(vacío)'}

Citas disponibles:
${citasTexto}`
	);
}

export async function revisarBorrador(borrador: { seccion: string; titulo: string; contenido: string }): Promise<string> {
	const seccionKey = Object.entries(REGLAS_POR_SECCION).find(([_, v]) => v.includes(borrador.seccion))?.[0] ?? '';
	const reglasSeccion = seccionKey ? REGLAS_POR_SECCION[seccionKey] : '';

	return llamarGemini(
		`${resumenContexto()}

${reglasSeccion}

Revisa el siguiente borrador.
Sección: ${borrador.seccion}
Título: ${borrador.titulo}
Contenido:
${borrador.contenido}

Evalúa exactamente en este formato:

ESTILO: [✓ Correcto / ✗ Problema] — [observación breve]
PERSONA GRAMATICAL: [✓ Tercera persona / ✗ Detectada primera persona] — [citar fragmento problemático]
COHERENCIA CON LA SECCIÓN: [✓ Adecuado / ✗ Fuera de lugar] — [observación]
CITAS APA: [✓ Bien integradas / ✗ Faltan citas / ✗ Formato incorrecto] — [observación]
SUGERENCIA: [Una acción concreta para mejorar]`
	);
}

// ─── Funciones de análisis global ───

export async function mapaTematicoGlobal(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`${resumenContexto()}

A partir de estas citas, identifica los temas principales, cómo se relacionan entre sí y dibuja un mapa temático conceptual en texto.

${lista}`
	);
}

export async function lagunasAnalisis(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`${resumenContexto()}

Analiza estas citas e identifica:
1. Qué secciones UIIX tienen pocas o ninguna cita de soporte
2. Qué temas o áreas faltan por investigar
3. Recomendaciones concretas de qué buscar

${lista}`
	);
}

export async function estructuraCap2(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`${resumenContexto()}

${REGLAS_POR_SECCION['cap2_estado_arte']}
${REGLAS_POR_SECCION['cap2_marco_teorico']}

Sugiere un orden lógico para presentar estas referencias en el Capítulo 2. Organiza por: Estado del arte → Marco teórico → Marco conceptual → Marco contextual → Marco legal.

${lista}`
	);
}

// ─── Funciones de matriz (inyectan REGLAS_REDACCION + CONTEXTO) ───

export async function completarCampoMatriz(
	nombreMatriz: string,
	nombreCampo: string,
	contenidoActual: string,
	citas: { autor: string; año: number; cita_textual: string }[]
): Promise<string> {
	const citasTexto = citas.length > 0
		? citas.map(c => `- ${c.autor} (${c.año}): "${c.cita_textual}"`).join('\n')
		: '(sin citas vinculadas)';

	return llamarGemini(
		`${resumenContexto()}

Completa o mejora el campo "${nombreCampo}" de la "${nombreMatriz}".

Contenido actual: ${contenidoActual || '(vacío)'}

Citas vinculadas:
${citasTexto}

Si hay contenido, mejóralo respetando la intención. Si está vacío, redacta una propuesta. Sé conciso.`
	);
}

export async function verificarCongruencia(campos: Record<string, string>): Promise<string> {
	const lineas = Object.entries(campos)
		.map(([label, valor]) => `${label}: ${valor || '(vacío)'}`)
		.join('\n');
	return llamarGemini(
		`Analiza la congruencia interna de los siguientes elementos de una tesis doctoral. Todos los datos fueron ingresados por el usuario — evalúa únicamente la coherencia entre ellos, sin asumir información externa.

Si el usuario incluye un marco metodológico, úsalo para determinar si los indicadores son medibles con el instrumento y enfoque descritos.

ELEMENTOS DE LA TESIS:
${lineas}

Responde exactamente en este formato:

OBJETIVOS → HIPÓTESIS: [✓ Alineados / ✗ Desalineados] — [observación]
HIPÓTESIS → VARIABLES: [✓ Coherente / ✗ Incoherente] — [observación]
VARIABLES → DIMENSIONES: [✓ Bien desagregadas / ✗ Problema] — [observación]
DIMENSIONES → INDICADORES: [✓ Medibles / ✗ No medibles] — [observación]
INDICADORES → METODOLOGÍA: [✓ Coherente / ✗ Incoherente] — [observación sobre si el instrumento y enfoque permiten medir los indicadores]
CONGRUENCIA GLOBAL: [✓ Alta / ~ Media / ✗ Baja]
RECOMENDACIÓN PRINCIPAL: [Una acción concreta para fortalecer la congruencia]`
	);
}
