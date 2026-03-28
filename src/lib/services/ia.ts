const SYSTEM_PROMPT = `Eres un asistente académico experto en escritura de tesis doctorales en español, específicamente bajo la estructura UIIX (Introducción, Capítulos 1–3, Capítulo IV Propuesta de Transformación, Conclusiones). Redacta siempre en tercera persona o voz impersonal. Evita el tono artificial. Sé conciso y académico.`;

async function llamarClaude(userPrompt: string): Promise<string> {
	const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
	if (!apiKey) throw new Error('API key de Anthropic no configurada');

	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1000,
			system: SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userPrompt }]
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Error de Claude API: ${res.status} — ${err}`);
	}

	const data = await res.json();
	return data.content[0]?.text ?? '';
}

export async function puntosClavesCita(cita: { autor: string; año: number; titulo: string; cita_textual: string }): Promise<string> {
	return llamarClaude(
		`Analiza la siguiente cita bibliográfica y explica qué aporta a una tesis doctoral UIIX. Sé conciso (máximo 3 puntos).

Autor: ${cita.autor} (${cita.año})
Título: ${cita.titulo}
Cita textual: "${cita.cita_textual}"`
	);
}

export async function comoUsarCita(cita: { autor: string; año: number; titulo: string; cita_textual: string; temas: string[] }): Promise<string> {
	return llamarClaude(
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
	return llamarClaude(
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
	return llamarClaude(
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
	return llamarClaude(
		`A partir de las siguientes citas bibliográficas de una tesis doctoral UIIX, identifica los temas principales, cómo se relacionan entre sí y dibuja un mapa temático conceptual en texto.

${lista}`
	);
}

export async function lagunasAnalisis(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarClaude(
		`Analiza las siguientes citas de una tesis doctoral UIIX e identifica:
1. Qué secciones de la estructura UIIX tienen pocas o ninguna cita de soporte
2. Qué temas o áreas temáticas faltan por investigar
3. Recomendaciones concretas de qué buscar

${lista}`
	);
}

export async function estructuraCap2(
	citas: { autor: string; año: number; titulo: string; temas: string[] }[]
): Promise<string> {
	const lista = citas.map(c => `- ${c.autor} (${c.año}): ${c.titulo} [${c.temas.join(', ')}]`).join('\n');
	return llamarClaude(
		`Sugiere un orden lógico para presentar las siguientes referencias en el Capítulo 2 (Fundamentos Teóricos) de una tesis UIIX. Organiza por: Estado del arte → Marco teórico → Marco conceptual → Marco contextual → Marco legal. Indica qué citas van en cada subsección y por qué.

${lista}`
	);
}
