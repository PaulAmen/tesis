const SYSTEM_PROMPT = `Eres un asistente académico experto en escritura de tesis doctorales en español, específicamente bajo la estructura UIIX (Introducción, Capítulos 1–3, Capítulo IV Propuesta de Transformación, Conclusiones). Redacta siempre en tercera persona o voz impersonal. Evita el tono artificial. Sé conciso y académico.`;

async function llamarGemini(userPrompt: string): Promise<string> {
	const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
	if (!apiKey) throw new Error('API key de Gemini no configurada');

	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
				contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
				generationConfig: { maxOutputTokens: 1000 }
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

export async function puntosClavesCita(cita: { autor: string; año: number; titulo: string; cita_textual: string }): Promise<string> {
	return llamarGemini(
		`Analiza la siguiente cita bibliográfica y explica qué aporta a una tesis doctoral UIIX. Sé conciso (máximo 3 puntos).

Autor: ${cita.autor} (${cita.año})
Título: ${cita.titulo}
Cita textual: "${cita.cita_textual}"`
	);
}

export async function comoUsarCita(cita: { autor: string; año: number; titulo: string; cita_textual: string; temas: string[] }): Promise<string> {
	return llamarGemini(
		`Dado el siguiente recurso bibliográfico, indica en qué sección de la estructura UIIX encaja mejor y sugiere cómo redactar un párrafo usándolo (en tercera persona, voz impersonal, estilo académico).

Autor: ${cita.autor} (${cita.año})
Título: ${cita.titulo}
Temas: ${cita.temas.join(', ')}
Cita textual: "${cita.cita_textual}"`
	);
}

export async function conexionesIACita(
	cita: { autor: string; año: number; titulo: string; cita_textual: string; temas: string[] },
	otrasCitas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const listaCitas = otrasCitas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`Analiza cómo se relaciona esta cita con las demás citas de mi tesis. Identifica conexiones temáticas, teóricas o metodológicas.

Cita principal:
${cita.autor} (${cita.año}): ${cita.titulo}
Temas: ${cita.temas.join(', ')}
Cita textual: "${cita.cita_textual}"

Otras citas en la tesis:
${listaCitas}`
	);
}

export async function redactarParrafo(
	seccion: string,
	contenidoActual: string,
	citas: { autor: string; año: number; cita_textual: string }[]
): Promise<string> {
	const citasTexto = citas.map(c => `- ${c.autor} (${c.año}): "${c.cita_textual}"`).join('\n');
	return llamarGemini(
		`Redacta un párrafo académico para la sección "${seccion}" de una tesis doctoral UIIX, usando las siguientes citas como soporte. El párrafo debe ser en tercera persona / voz impersonal, estilo académico formal. Integra las citas de forma natural con formato (Autor, año).

Contenido actual del borrador:
${contenidoActual || '(vacío)'}

Citas disponibles:
${citasTexto}`
	);
}

export async function mapaTematicoGlobal(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`A partir de las siguientes citas bibliográficas de una tesis doctoral UIIX, identifica los temas principales, cómo se relacionan entre sí y dibuja un mapa temático conceptual en texto.

${lista}`
	);
}

export async function lagunasAnalisis(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`Analiza las siguientes citas de una tesis doctoral UIIX e identifica:
1. Qué secciones de la estructura UIIX tienen pocas o ninguna cita de soporte
2. Qué temas o áreas temáticas faltan por investigar
3. Recomendaciones concretas de qué buscar

${lista}`
	);
}

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
		`Completa o mejora el siguiente campo de la "${nombreMatriz}" para una tesis doctoral UIIX.

Campo: ${nombreCampo}
Contenido actual: ${contenidoActual || '(vacío)'}

Citas vinculadas:
${citasTexto}

Redacta contenido académico apropiado para este campo. Si hay contenido actual, mejóralo o amplíalo. Sé conciso y directo.`
	);
}

export async function revisarBorrador(borrador: { seccion: string; titulo: string; contenido: string }): Promise<string> {
	return llamarGemini(
		`Revisa el siguiente borrador académico para una tesis doctoral UIIX.
Sección: ${borrador.seccion}
Título: ${borrador.titulo}
Contenido:
${borrador.contenido}

Evalúa y responde exactamente en este formato:

ESTILO: [✓ Correcto / ✗ Problema] — [observación breve]
PERSONA GRAMATICAL: [✓ Tercera persona / ✗ Detectada primera persona] — [citar el fragmento problemático si lo hay]
COHERENCIA CON LA SECCIÓN: [✓ Adecuado / ✗ Fuera de lugar] — [observación]
CITAS: [✓ Bien integradas / ✗ Faltan citas / ✗ Sin citas] — [observación]
SUGERENCIA: [Una acción concreta para mejorar el borrador]`
	);
}

export async function verificarCongruencia(campos: Record<string, string>): Promise<string> {
	const lineas = Object.entries(campos)
		.map(([label, valor]) => `${label}: ${valor || '(vacío)'}`)
		.join('\n');
	return llamarGemini(
		`Analiza la congruencia interna de los elementos centrales de esta tesis doctoral bajo estructura UIIX.

${lineas}

Responde exactamente en este formato:

OBJETIVOS → HIPÓTESIS: [✓ Alineados / ✗ Desalineados] — [observación]
HIPÓTESIS → VARIABLES: [✓ Coherente / ✗ Incoherente] — [observación]
VARIABLES → DIMENSIONES: [✓ Bien desagregadas / ✗ Problema] — [observación]
DIMENSIONES → INDICADORES: [✓ Medibles / ✗ No medibles] — [observación]
CONGRUENCIA GLOBAL: [✓ Alta / ~ Media / ✗ Baja]
RECOMENDACIÓN PRINCIPAL: [Una acción concreta para fortalecer la congruencia]`
	);
}

export async function estructuraCap2(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarGemini(
		`Sugiere un orden lógico para presentar las siguientes referencias en el Capítulo 2 (Fundamentos Teóricos) de una tesis UIIX. Organiza por: Estado del arte → Marco teórico → Marco conceptual → Marco contextual → Marco legal. Indica qué citas van en cada subsección y por qué.

${lista}`
	);
}
