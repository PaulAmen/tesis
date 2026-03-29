export type TipoCita = 'libro' | 'articulo' | 'reporte' | 'tesis' | 'web';

export interface Cita {
	id: string;
	autor: string;
	año: number;
	titulo: string;
	fuente: string;
	cita_textual: string;
	paginas: string;
	tipo: TipoCita;
	temas: string[];
	notas: string;
	referencia_apa: string;
	creado_en: Date;
}

export type TipoConexion = 'manual' | 'tema';

export interface Conexion {
	id: string;
	cita_origen_id: string;
	cita_destino_id: string;
	tipo_conexion: TipoConexion;
	etiqueta: string;
	comentario: string;
	creado_en: Date;
}

export const SECCIONES_UIIX = {
	introduccion: 'Introducción',
	cap1_proyeccion: 'Cap. 1 — Proyección de la investigación',
	cap1_linea_investigacion: 'Cap. 1 — Línea de investigación',
	cap1_planteamiento: 'Cap. 1 — Planteamiento del problema',
	cap1_formulacion: 'Cap. 1 — Formulación del problema',
	cap1_justificacion: 'Cap. 1 — Justificación',
	cap1_objeto: 'Cap. 1 — Objeto de estudio',
	cap1_campo_accion: 'Cap. 1 — Campo de acción',
	cap1_objetivos: 'Cap. 1 — Objetivos',
	cap1_hipotesis: 'Cap. 1 — Hipótesis',
	cap1_alcance: 'Cap. 1 — Alcance',
	cap1_delimitacion: 'Cap. 1 — Delimitación',
	cap2_fundamentos: 'Cap. 2 — Fundamentos teóricos',
	cap2_estado_arte: 'Cap. 2 — Estado del arte',
	cap2_marco_teorico: 'Cap. 2 — Marco teórico',
	cap2_marco_conceptual: 'Cap. 2 — Marco conceptual',
	cap2_marco_contextual: 'Cap. 2 — Marco contextual',
	cap2_marco_legal: 'Cap. 2 — Marco legal',
	cap3_metodologia: 'Cap. 3 — Metodología',
	cap3_operacionalizacion: 'Cap. 3 — Operacionalización de variables',
	cap3_diseno: 'Cap. 3 — Diseño de la investigación',
	cap3_trabajo_campo: 'Cap. 3 — Trabajo de campo',
	cap3_resultados_discusion: 'Cap. 3 — Resultados y discusión',
	cap4_propuesta: 'Cap. 4 — Propuesta de transformación',
	cap4_fundamentacion: 'Cap. 4 — Fundamentación de la propuesta',
	cap4_descripcion: 'Cap. 4 — Descripción de la propuesta',
	cap4_objetivos_propuesta: 'Cap. 4 — Objetivos de la propuesta',
	cap4_fases: 'Cap. 4 — Fases de implementación',
	cap4_recursos: 'Cap. 4 — Recursos',
	cap4_resultados_esperados: 'Cap. 4 — Resultados esperados',
	cap4_validacion: 'Cap. 4 — Validación',
	conclusiones: 'Conclusiones',
	recomendaciones: 'Recomendaciones'
} as const;

export type SeccionUIIX = keyof typeof SECCIONES_UIIX;

export const GRUPOS_SECCIONES = [
	{ grupo: 'Introducción', secciones: ['introduccion'] },
	{
		grupo: 'Capítulo 1 — Proyección',
		secciones: [
			'cap1_proyeccion', 'cap1_linea_investigacion', 'cap1_planteamiento',
			'cap1_formulacion', 'cap1_justificacion', 'cap1_objeto',
			'cap1_campo_accion', 'cap1_objetivos', 'cap1_hipotesis',
			'cap1_alcance', 'cap1_delimitacion'
		]
	},
	{
		grupo: 'Capítulo 2 — Fundamentos Teóricos',
		secciones: [
			'cap2_fundamentos', 'cap2_estado_arte', 'cap2_marco_teorico',
			'cap2_marco_conceptual', 'cap2_marco_contextual', 'cap2_marco_legal'
		]
	},
	{
		grupo: 'Capítulo 3 — Metodología',
		secciones: [
			'cap3_metodologia', 'cap3_operacionalizacion', 'cap3_diseno',
			'cap3_trabajo_campo', 'cap3_resultados_discusion'
		]
	},
	{
		grupo: 'Capítulo 4 — Propuesta',
		secciones: [
			'cap4_propuesta', 'cap4_fundamentacion', 'cap4_descripcion',
			'cap4_objetivos_propuesta', 'cap4_fases', 'cap4_recursos',
			'cap4_resultados_esperados', 'cap4_validacion'
		]
	},
	{ grupo: 'Finales', secciones: ['conclusiones', 'recomendaciones'] }
] as const;

export interface Borrador {
	id: string;
	seccion: SeccionUIIX;
	subseccion: string;
	titulo: string;
	contenido: string;
	citas_usadas: string[];
	creado_en: Date;
	actualizado_en: Date;
}

export type TipoMatriz = 'congruencia' | 'enfoque' | 'tipo_investigacion' | 'tecnicas' | 'unidades';

export interface CampoMatriz {
	id: string;
	tipo: TipoMatriz;
	campo: string;
	contenido: string;
	citas_usadas: string[];
	actualizado_en: Date;
}

export const MATRICES: Record<TipoMatriz, { nombre: string; campos: { key: string; label: string }[] }> = {
	congruencia: {
		nombre: 'Matriz de Congruencia',
		campos: []
	},
	enfoque: {
		nombre: 'Enfoque',
		campos: [
			{ key: 'enfoque_investigacion', label: 'Enfoque de investigación' },
			{ key: 'paradigma_investigacion', label: 'Paradigma de investigación' }
		]
	},
	tipo_investigacion: {
		nombre: 'Tipo de Investigación',
		campos: [
			{ key: 'tipo', label: 'Tipo' },
			{ key: 'argumentacion', label: 'Argumentación' }
		]
	},
	tecnicas: {
		nombre: 'Técnicas',
		campos: [
			{ key: 'tecnicas_investigacion', label: 'Técnicas de investigación' },
			{ key: 'instrumentos_investigacion', label: 'Instrumentos de investigación' }
		]
	},
	unidades: {
		nombre: 'Unidades',
		campos: [
			{ key: 'universo', label: 'Universo' },
			{ key: 'poblacion', label: 'Población' },
			{ key: 'muestra', label: 'Muestra' }
		]
	}
};
