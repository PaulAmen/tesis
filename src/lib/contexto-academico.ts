// ─── Contexto académico estático para inyección en prompts de IA ───

export const REGLAS_APA7 = `REGLAS DE CITACIÓN APA 7:

Citas en el texto:
- Un autor: (Apellido, año) → (Pérez, 2020)
- Dos autores: (Apellido & Apellido, año) → (Pérez & López, 2021)
- Tres o más autores: (Primer apellido et al., año) → (Pérez et al., 2019)
- Con página (cita textual): (Apellido, año, p. 45) o (Apellido, año, pp. 45-47)
- Cita narrativa: Según Pérez (2020), "texto citado" (p. 45).

Cita textual vs paráfrasis:
- Textual corta (<40 palabras): entre comillas dobles, con página obligatoria.
- Textual larga (≥40 palabras): bloque indentado sin comillas, con página obligatoria.
- Paráfrasis: reformular la idea en palabras propias. La página es recomendada pero no obligatoria. NO usar comillas.
- Nunca copiar texto sin comillas ni sin citar.

Referencias bibliográficas:
- Libro: Apellido, I. (Año). Título del libro (Xª ed.). Editorial.
- Artículo: Apellido, I. (Año). Título del artículo. Nombre de la Revista, vol(núm), pp-pp. https://doi.org/xxx
- Reporte: Institución. (Año). Título del reporte. Editorial.
- Tesis: Apellido, I. (Año). Título de la tesis [Tesis doctoral, Universidad]. Repositorio. URL
- Web: Apellido, I. (Año, día de mes). Título de la página. Sitio Web. URL

Formato:
- Sangría francesa en cada referencia (primera línea al margen, siguientes indentadas).
- Título del libro/tesis en cursiva. Título de artículo sin cursiva; nombre de revista en cursiva.
- Punto al final de cada referencia.
- Orden alfabético por apellido del primer autor.
- Si el mismo autor tiene varias obras, ordenar por año ascendente.
- Si el mismo autor tiene varias obras del mismo año, agregar letras: 2020a, 2020b.`;

export const REGLAS_REDACCION_UIIX = `NORMAS DE REDACCIÓN UIIX (TESIS DOCTORAL):

Persona gramatical:
- OBLIGATORIO: tercera persona o voz impersonal.
- Correcto: "Se observó que...", "Los resultados evidencian...", "El autor sostiene..."
- Incorrecto: "Yo observé...", "Nosotros creemos...", "En mi opinión..."
- Incorrecto: "Vamos a analizar...", "Hemos determinado..."

Tono:
- Académico, preciso, sin artificialidad ni lenguaje coloquial.
- Evitar muletillas: "cabe destacar que", "es importante mencionar que", "en este sentido".
- Evitar adjetivos valorativos sin sustento: "excelente", "muy bueno", "indudablemente".
- Cada afirmación debe estar respaldada por una fuente o por datos propios.

Estructura de párrafos:
- Cada párrafo desarrolla UNA idea central.
- Inicia con oración temática, desarrolla con evidencia/argumentos, cierra con conexión al siguiente párrafo.
- Mínimo 3 oraciones por párrafo, máximo ~8.

Objetivos:
- UN SOLO verbo en infinitivo por objetivo (Analizar, Diseñar, Evaluar). NUNCA dos verbos.
- Objetivo general: abarca toda la investigación.
- Objetivos específicos: se derivan del general, cada uno aborda un aspecto concreto y medible.

Hipótesis:
- Afirmación verificable con variables identificables.
- Principal: afirma la relación causal/correlacional esperada.
- Nula (Ho): niega la relación.
- Alternativa (H1): plantea dirección específica.

Coherencia interna:
- Objetivo general → se desglosa en objetivos específicos.
- Objetivos específicos → se vinculan con hipótesis.
- Hipótesis → contienen las variables (VI y VD).
- Variables → se desagregan en dimensiones.
- Dimensiones → se operacionalizan en indicadores medibles.
- Todo debe estar alineado: si un objetivo no tiene dimensiones/indicadores que lo respalden, hay incoherencia.

Densidad esperada por capítulo:
- Cap. 1 (Proyección): 15-25 páginas. Planteamiento claro, justificación sólida.
- Cap. 2 (Fundamentos): 40-70 páginas. Estado del arte extenso, marco teórico con mínimo 30 fuentes.
- Cap. 3 (Metodología): 20-35 páginas. Operacionalización detallada, diseño riguroso.
- Cap. 4 (Propuesta): 25-40 páginas. Propuesta fundamentada con fases claras.`;

export const REGLAS_POR_SECCION: Record<string, string> = {
	introduccion: `INTRODUCCIÓN:
Contenido: Presentación general del tema, contexto del problema, importancia, breve descripción de la estructura de la tesis. NO incluir resultados ni conclusiones.
Errores comunes: Ser demasiado extenso, adelantar resultados, usar primera persona, no contextualizar el problema.
Nivel doctoral: Debe evidenciar dominio del tema desde la primera página. Contextualización global → regional → local.`,

	cap1_planteamiento: `PLANTEAMIENTO DEL PROBLEMA (Cap. 1):
Contenido: Descripción detallada del problema, evidencias de su existencia (datos, estadísticas, estudios previos), delimitación del problema, brechas en el conocimiento.
Errores comunes: Plantear soluciones en vez del problema, no aportar evidencias cuantitativas, confundir síntomas con causas.
Nivel doctoral: Sustentar con datos empíricos y fuentes recientes (<5 años). Articular claramente la brecha de conocimiento.`,

	cap1_hipotesis: `HIPÓTESIS (Cap. 1):
Contenido: Hipótesis principal, nula y alternativa. Deben ser verificables, contener las variables y ser coherentes con los objetivos.
Errores comunes: Hipótesis no verificable, variables no identificables, incoherencia con objetivos, redacción como pregunta en vez de afirmación.
Nivel doctoral: Las hipótesis deben derivarse lógicamente del marco teórico y del planteamiento del problema.`,

	cap2_estado_arte: `ESTADO DEL ARTE (Cap. 2):
Contenido: Revisión de investigaciones previas (últimos 5-10 años) nacionales e internacionales relacionadas con el tema. Análisis crítico, no solo descripción.
Errores comunes: Listar estudios sin analizar, no relacionar con la propia investigación, fuentes desactualizadas, solo fuentes nacionales.
Nivel doctoral: Mínimo 15-20 antecedentes. Análisis comparativo de metodologías, resultados y limitaciones. Identificar qué aporta cada estudio y qué vacío deja.`,

	cap2_marco_teorico: `MARCO TEÓRICO (Cap. 2):
Contenido: Teorías y modelos que fundamentan la investigación. Desarrollo de las variables con sus dimensiones. Base teórica de cada concepto clave.
Errores comunes: Copiar definiciones sin analizar, no relacionar teorías entre sí, no vincular con las variables de estudio, exceso de citas textuales sin paráfrasis.
Nivel doctoral: Construcción argumentativa propia a partir de múltiples autores. Posicionamiento teórico claro. Mínimo 30 fuentes.`,

	cap2_marco_conceptual: `MARCO CONCEPTUAL (Cap. 2):
Contenido: Definiciones operacionales de los términos clave de la investigación. Cómo se entiende cada concepto en el contexto de esta tesis.
Errores comunes: Definiciones de diccionario genéricas, no contextualizar al ámbito de estudio, confundir con marco teórico.
Nivel doctoral: Definiciones operacionales construidas a partir de la revisión teórica, no genéricas.`,

	cap2_marco_contextual: `MARCO CONTEXTUAL (Cap. 2):
Contenido: Contexto institucional, geográfico, temporal y social donde se desarrolla la investigación.
Errores comunes: Información irrelevante, datos desactualizados, no vincular el contexto con el problema de investigación.
Nivel doctoral: Datos recientes y verificables. Conexión clara entre el contexto y la relevancia del estudio.`,

	cap2_marco_legal: `MARCO LEGAL (Cap. 2):
Contenido: Normativas, leyes, reglamentos y políticas que regulan o fundamentan el objeto de estudio.
Errores comunes: Listar leyes sin analizar su relación con la investigación, incluir normativa derogada.
Nivel doctoral: Análisis de cómo cada normativa sustenta o delimita la investigación. Jerarquía normativa: constitución → leyes orgánicas → reglamentos → acuerdos.`,

	cap3_operacionalizacion: `OPERACIONALIZACIÓN DE VARIABLES (Cap. 3):
Contenido: Tabla que desglosa: Variable → Dimensiones → Indicadores → Ítems/Técnica/Instrumento.
Errores comunes: Indicadores no medibles, dimensiones que se solapan, incoherencia con las hipótesis, falta de técnica o instrumento para cada indicador.
Nivel doctoral: Cada indicador debe tener un instrumento de medición asignado. Coherencia total con el marco teórico y los objetivos.`,

	cap3_diseno: `DISEÑO DE LA INVESTIGACIÓN (Cap. 3):
Contenido: Enfoque (cuantitativo/cualitativo/mixto), tipo de investigación, diseño, población, muestra, técnicas e instrumentos, procedimiento, validez y confiabilidad.
Errores comunes: No justificar la elección del diseño, muestra no representativa, no describir validación de instrumentos.
Nivel doctoral: Justificación epistemológica del enfoque. Cálculo estadístico de la muestra. Validación por expertos y prueba piloto del instrumento.`,

	cap3_trabajo_campo: `TRABAJO DE CAMPO (Cap. 3):
Contenido: Descripción detallada de cómo se aplicaron los instrumentos, cronograma, dificultades encontradas, consideraciones éticas.
Errores comunes: Descripción vaga del proceso, omitir consideraciones éticas, no mencionar consentimiento informado.
Nivel doctoral: Rigor metodológico demostrable. Protocolo de aplicación detallado. Consideraciones éticas explícitas.`,

	cap3_resultados_discusion: `RESULTADOS Y DISCUSIÓN (Cap. 3):
Contenido: Presentación de resultados por objetivo/hipótesis, tablas y gráficos, análisis estadístico, discusión contrastando con antecedentes y marco teórico.
Errores comunes: Presentar datos sin interpretar, no contrastar con estudios previos, conclusiones que no se derivan de los datos.
Nivel doctoral: Triangulación de resultados. Discusión profunda con el estado del arte. Análisis por cada hipótesis con decisión estadística.`,

	cap4_fundamentacion: `FUNDAMENTACIÓN DE LA PROPUESTA (Cap. 4):
Contenido: Justificación teórica y empírica de la propuesta. Por qué esta propuesta resuelve el problema identificado.
Errores comunes: No vincular con los resultados del Cap. 3, propuesta desconectada de los objetivos.
Nivel doctoral: La propuesta debe emerger lógicamente de los hallazgos. Fundamentación teórica y práctica.`,

	cap4_descripcion: `DESCRIPCIÓN DE LA PROPUESTA (Cap. 4):
Contenido: Qué es la propuesta, a quién va dirigida, componentes, estructura detallada, recursos necesarios.
Errores comunes: Descripción superficial, no incluir componentes operativos, falta de recursos o cronograma.
Nivel doctoral: Nivel de detalle suficiente para que un tercero pueda replicar la propuesta.`,

	cap4_validacion: `VALIDACIÓN (Cap. 4):
Contenido: Método de validación (juicio de expertos, prueba piloto, simulación), resultados de la validación, ajustes realizados.
Errores comunes: Validación solo por un experto, no reportar criterios de evaluación, no mostrar instrumentos de validación.
Nivel doctoral: Mínimo 3-5 expertos. Instrumento de validación con criterios claros. Análisis cuantitativo de resultados (coeficiente de concordancia o similar).`,

	conclusiones: `CONCLUSIONES:
Contenido: Una conclusión por cada objetivo específico. Respuesta a la pregunta de investigación. Decisión sobre las hipótesis. Aportes de la investigación.
Errores comunes: Repetir resultados en vez de concluir, conclusiones que no se derivan de los objetivos, introducir información nueva.
Nivel doctoral: Cada conclusión debe rastrearse hasta un objetivo específico. Incluir aporte al conocimiento científico.`,

	recomendaciones: `RECOMENDACIONES:
Contenido: Sugerencias prácticas derivadas de las conclusiones. Líneas de investigación futuras. Recomendaciones para la institución, para investigadores, para la práctica.
Errores comunes: Recomendaciones genéricas no vinculadas a conclusiones, repetir las conclusiones, no proponer investigación futura.
Nivel doctoral: Cada recomendación debe derivarse de una conclusión específica. Proponer al menos 2-3 líneas de investigación futura.`
};

export const CONTEXTO_TESIS = {
	tema: 'Modelo Didáctico basado en un syllabus interactivo para favorecer el Desempeño Académico del Estudiante en Informática Aplicada a la Educación en la Universidad Estatal del Sur de Manabí, periodo 2023-2026.',
	pregunta_investigacion: '¿De qué manera un modelo didáctico basado en un syllabus interactivo favorece el desempeño académico de los estudiantes en la asignatura de Informática Aplicada a la Educación?',
	objetivo_general: 'Proponer un modelo didáctico basado en un syllabus interactivo valorado favorablemente por los estudiantes respecto al desempeño académico en la asignatura de Informática Aplicada a la Educación de la Universidad Estatal del Sur de Manabí, Ecuador.',
	objetivos_especificos: [
		'Caracterizar el estado actual del proceso de enseñanza-aprendizaje en la asignatura de Informática Aplicada a la Educación en la Universidad Estatal del Sur de Manabí.',
		'Fundamentar teóricamente el desarrollo de un syllabus interactivo como estrategia didáctica para mejorar el desempeño académico de los estudiantes.',
		'Diseñar un modelo didáctico que integre un syllabus interactivo con elementos multimedia y actividades participativas para la asignatura de Informática Aplicada a la Educación.',
		'Validar el prototipo del modelo didáctico mediante una prueba de simulación con estudiantes.'
	],
	hipotesis: {
		principal: 'Si se implementa un modelo didáctico basado en un syllabus interactivo, entonces se favorecerá significativamente el desempeño académico de los estudiantes en la asignatura de Informática Aplicada a la Educación, en comparación con el syllabus tradicional, según la valoración obtenida en la prueba de simulación.',
		nula: 'No existe diferencia significativa en el desempeño académico de los estudiantes entre el modelo didáctico basado en un syllabus interactivo y el syllabus tradicional, según la valoración obtenida en la prueba de simulación.',
		alternativa: 'Existe diferencia significativa en el desempeño académico de los estudiantes a favor del modelo didáctico basado en un syllabus interactivo respecto al syllabus tradicional, según la valoración obtenida en la prueba de simulación.'
	},
	variables: {
		independiente: {
			nombre: 'Modelo Didáctico basado en un syllabus interactivo',
			conceptualizacion: 'Propuesta pedagógica que integra un syllabus digital con elementos multimedia, actividades interactivas y recursos tecnológicos para facilitar el proceso de enseñanza-aprendizaje.',
			dimensiones: [
				'Diseño Instruccional y Estrategias Didácticas',
				'Interactividad, Multimedia y Evaluación Formativa',
				'Usabilidad y Accesibilidad Tecnológica'
			],
			indicadores: [
				{ texto: 'Grado de coherencia percibida entre los objetivos de aprendizaje, los contenidos y las actividades de evaluación.', dimension: 0 },
				{ texto: 'Nivel de claridad percibida en la organización y secuenciación de los contenidos.', dimension: 0 },
				{ texto: 'Grado de utilidad percibida de los cuestionarios de autoevaluación interactivos para el aprendizaje.', dimension: 1 },
				{ texto: 'Nivel de contribución percibida de las actividades participativas al aprendizaje activo.', dimension: 1 },
				{ texto: 'Grado de claridad y accesibilidad percibida de las rúbricas de evaluación.', dimension: 1 },
				{ texto: 'Nivel de facilidad percibida en la navegación e interacción con la interfaz del syllabus interactivo.', dimension: 2 }
			]
		},
		dependiente: {
			nombre: 'Desempeño Académico',
			conceptualizacion: 'Valoración subjetiva que realizan los estudiantes sobre la contribución del syllabus interactivo a su proceso de aprendizaje y rendimiento académico en la asignatura.',
			dimensiones: [
				'Claridad Pedagógica',
				'Compromiso y Motivación',
				'Autonomía y Autoeficacia'
			],
			indicadores: [
				{ texto: 'Nivel de claridad percibida de los objetivos de aprendizaje.', dimension: 0 },
				{ texto: 'Nivel de interés generado por el formato interactivo.', dimension: 1 },
				{ texto: 'Nivel de confianza percibida para completar las tareas (autoeficacia).', dimension: 2 }
			]
		}
	},
	metodologia: {
		enfoque: 'Cuantitativo',
		tipo: 'Proyectiva (propuesta de modelo)',
		diseño: 'No experimental, transversal',
		validacion: 'Prueba de simulación con estudiantes. Los indicadores miden percepciones estudiantiles mediante un cuestionario con escala Likert de 5 puntos (1=Totalmente en desacuerdo a 5=Totalmente de acuerdo). Los indicadores de percepción son medibles a través de esta escala y se analizan estadísticamente (media, desviación estándar, prueba t o Wilcoxon según normalidad). Este diseño es coherente con investigaciones proyectivas donde se valora la propuesta antes de su implementación completa.',
		instrumento: 'Cuestionario estructurado con ítems tipo Likert, validado por juicio de expertos y confiabilidad por Alfa de Cronbach.'
	},
	universidad: 'Universidad Estatal del Sur de Manabí (UNESUM)',
	estructura: 'UIIX (Introducción, Cap. 1 Proyección, Cap. 2 Fundamentos Teóricos, Cap. 3 Metodología, Cap. 4 Propuesta de Transformación, Conclusiones, Recomendaciones)'
};

// Helper para generar resumen compacto del contexto (para prompts que no necesitan todo)
export function resumenContexto(): string {
	const c = CONTEXTO_TESIS;
	return `CONTEXTO DE LA TESIS:
Tema: ${c.tema}
Objetivo general: ${c.objetivo_general}
V.I.: ${c.variables.independiente.nombre}
V.D.: ${c.variables.dependiente.nombre}
Estructura: ${c.estructura}`;
}

// Helper para contexto completo (para verificación de congruencia)
export function contextoCompleto(): string {
	const c = CONTEXTO_TESIS;
	const indVI = c.variables.independiente.indicadores
		.map((ind, i) => `  Ind.VI.${i + 1}: ${ind.texto} (→ ${c.variables.independiente.dimensiones[ind.dimension]})`)
		.join('\n');
	const indVD = c.variables.dependiente.indicadores
		.map((ind, i) => `  Ind.VD.${i + 1}: ${ind.texto} (→ ${c.variables.dependiente.dimensiones[ind.dimension]})`)
		.join('\n');
	return `CONTEXTO COMPLETO DE LA TESIS:
Tema: ${c.tema}
Pregunta: ${c.pregunta_investigacion}
Objetivo general: ${c.objetivo_general}
OE1: ${c.objetivos_especificos[0]}
OE2: ${c.objetivos_especificos[1]}
OE3: ${c.objetivos_especificos[2]}
OE4: ${c.objetivos_especificos[3]}
Hipótesis principal: ${c.hipotesis.principal}
Hipótesis nula: ${c.hipotesis.nula}
Hipótesis alternativa: ${c.hipotesis.alternativa}
V.I.: ${c.variables.independiente.nombre} — ${c.variables.independiente.conceptualizacion}
  Dimensiones VI: ${c.variables.independiente.dimensiones.join('; ')}
  Indicadores VI:
${indVI}
V.D.: ${c.variables.dependiente.nombre} — ${c.variables.dependiente.conceptualizacion}
  Dimensiones VD: ${c.variables.dependiente.dimensiones.join('; ')}
  Indicadores VD:
${indVD}
Metodología: ${c.metodologia.enfoque}, ${c.metodologia.tipo}, ${c.metodologia.diseño}
Validación: ${c.metodologia.validacion}
Instrumento: ${c.metodologia.instrumento}
Universidad: ${c.universidad}`;
}
