# Documentación del Asistente de Tesis Doctoral (Tesis)

Esta aplicación es una herramienta integral diseñada para investigadores y estudiantes de doctorado, facilitando la gestión de fuentes bibliográficas, la redacción de borradores y la validación de la congruencia investigativa mediante Inteligencia Artificial.

## 1. Funcionalidad Principal

La app se organiza en cinco pilares fundamentales que interactúan entre sí:

### A. Gestión de Citas (Citas)
- **Repositorio Central:** Almacena libros, artículos, tesis y reportes.
- **Formato APA 7:** Genera automáticamente la referencia bibliográfica con la estructura de autor, año, título, fuente y páginas.
- **Análisis Individual (IA):** Permite extraer puntos clave de una cita específica o recibir sugerencias sobre cómo integrarla en el discurso académico.
- **Categorización:** Uso de temas (tags) para agrupar ideas por núcleos conceptuales.

### B. Borradores (Drafts) - Detalle de Secciones
El editor de borradores está estrictamente alineado con la estructura académica formal (UIIX). Cada sección permite la redacción independiente con soporte de IA.

#### Estructura Completa de Secciones:
1.  **Introducción:** Planteamiento general y presentación del estudio.
2.  **Capítulo 1 — Proyección de la Investigación:**
    - Línea de investigación, Planteamiento del problema, Formulación, Justificación.
    - Objeto de estudio, Campo de acción, Objetivos (General y Específicos).
    - Hipótesis, Alcance y Delimitación.
3.  **Capítulo 2 — Fundamentos Teóricos:**
    - Estado del arte (antecedentes), Marco Teórico (bases científicas).
    - Marco Conceptual, Marco Contextual y Marco Legal.
4.  **Capítulo 3 — Metodología:**
    - Operacionalización de variables, Diseño de la investigación.
    - Trabajo de campo, Resultados y Discusión.
5.  **Capítulo 4 — Propuesta de Transformación:**
    - Fundamentación y Descripción de la propuesta.
    - Objetivos de la propuesta, Fases de implementación, Recursos.
    - Resultados esperados y Validación.
6.  **Secciones Finales:** Conclusiones y Recomendaciones.

### C. Matrices de Investigación
- **Matriz de Congruencia:** El corazón metodológico. Conecta el Tema -> Pregunta -> Objetivos -> Hipótesis -> Variables.
- **Operacionalización:** Desglose de variables en dimensiones e indicadores.
- **Validación de Lógica (IA):** La IA revisa si existe una relación lógica y "congruente" entre todos los elementos de la matriz.
- **Matrices Complementarias:** Enfoque, Tipo de Investigación, Técnicas/Instrumentos y Unidades (Muestra).

### D. Nexos y Conexiones
- **Relaciones Manuales:** El usuario puede conectar dos citas que se complementan o se contradicen.
- **Agrupación por Temas:** Visualización automática de citas que comparten conceptos, ideal para construir el estado del arte.

### E. IA Global
- **Mapa Temático:** Analiza toda la biblioteca para identificar núcleos conceptuales.
- **Detección de Lagunas:** Identifica áreas del marco teórico que tienen pocas fuentes.
- **Estructura Sugerida:** Propone un orden narrativo para el Capítulo 2 (Marco Teórico) basado en la bibliografía actual.

---

## 2. Arquitectura de Datos e Ideas (Conectividad)

El valor real de la aplicación reside en cómo los datos fluyen entre secciones para mantener el rigor científico:

1.  **Cita -> Temas -> Nexos:** Las etiquetas de las citas alimentan automáticamente la red de conexiones conceptuales.
2.  **Cita -> Borrador -> IA:** Al redactar un párrafo, las citas seleccionadas alimentan el prompt de la IA. Esto garantiza que la IA no invente información, sino que **redacte basándose exclusivamente en la evidencia** cargada.
3.  **Matriz de Congruencia -> IA de Revisión:** La estructura definida en la matriz actúa como el "filtro de verdad". Cuando la IA revisa un borrador, compara si el contenido es coherente con los objetivos y el planteamiento del problema definidos en la matriz.
4.  **Cita -> Matriz:** Las definiciones teóricas se vinculan a la conceptualización de variables, asegurando que cada término de la matriz tenga un respaldo bibliográfico.

---

## 3. Estructura del Proyecto

```text
src/
├── lib/
│   ├── components/    # Interfaz (Navegación, Login, Notificaciones)
│   ├── firebase/      # Persistencia de datos en la nube y autenticación
│   ├── services/      # Lógica de IA, Gestión de Citas y Redacción
│   ├── stores/        # Sincronización de datos en tiempo real
│   └── types.ts       # Modelos de datos y estructura de secciones UIIX
└── routes/            # Páginas de la aplicación
    ├── citas/         # Detalle y análisis de fuentes
    ├── borradores/    # Escritura académica asistida por IA
    ├── matrices/      # Control de congruencia y metodología
    ├── conexiones/    # Red de nexos entre autores
    └── ia/            # Inteligencia estratégica global
```

## 4. Flujo de Trabajo Recomendado

1.  **Ingreso:** Registrar fuentes en **Citas** y analizar sus puntos clave.
2.  **Planeación:** Definir la columna vertebral lógica en la **Matriz de Congruencia**.
3.  **Validación de Fuentes:** Usar **IA Global** para ver si la bibliografía actual cubre todos los objetivos de la matriz.
4.  **Redacción:** Crear **Borradores** por sección, vinculando las citas correspondientes para que la IA genere propuestas de párrafos coherentes.
5.  **Control de Calidad:** Usar la **IA de Revisión** en los borradores para asegurar que no se pierda el hilo conductor definido en la matriz.
