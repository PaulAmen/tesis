<script lang="ts">
	import { base } from '$app/paths';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import {
		obtenerBorradoresPorSeccion, crearBorrador, actualizarBorrador, eliminarBorrador
	} from '$lib/services/borradores';
	import { redactarParrafo } from '$lib/services/ia';
	import { SECCIONES_UIIX, GRUPOS_SECCIONES } from '$lib/types';
	import type { Borrador, SeccionUIIX, Cita } from '$lib/types';

	let seccionActual = $state<SeccionUIIX | ''>('');
	let borradores = $state<Borrador[]>([]);
	let borradorActual = $state<Borrador | null>(null);
	let cargando = $state(false);

	// Editor fields
	let editorTitulo = $state('');
	let editorContenido = $state('');
	let editorCitasUsadas = $state<string[]>([]);
	let guardando = $state(false);

	// Cita selector
	let showCitaSelector = $state(false);
	let citaBusqueda = $state('');
	let textareaEl = $state<HTMLTextAreaElement>();

	// IA
	let iaLoading = $state(false);
	let iaResult = $state('');

	let citasFiltradas = $derived.by(() => {
		const q = citaBusqueda.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autor.toLowerCase().includes(q) ||
			c.titulo.toLowerCase().includes(q)
		);
	});

	async function cargarBorradores() {
		if (!seccionActual) return;
		cargando = true;
		borradorActual = null;
		try {
			borradores = await obtenerBorradoresPorSeccion(seccionActual);
		} catch {
			showToast('Error al cargar borradores', 'error');
		} finally {
			cargando = false;
		}
	}

	function handleSeccionChange() {
		borradorActual = null;
		iaResult = '';
		cargarBorradores();
	}

	function nuevoEditor() {
		borradorActual = null;
		editorTitulo = '';
		editorContenido = '';
		editorCitasUsadas = [];
		iaResult = '';
		// Use a sentinel to indicate "new"
		borradorActual = {
			id: '__new__',
			seccion: seccionActual as SeccionUIIX,
			subseccion: '',
			titulo: '',
			contenido: '',
			citas_usadas: [],
			creado_en: new Date(),
			actualizado_en: new Date()
		};
	}

	function abrirBorrador(b: Borrador) {
		borradorActual = b;
		editorTitulo = b.titulo;
		editorContenido = b.contenido;
		editorCitasUsadas = [...b.citas_usadas];
		iaResult = '';
	}

	async function guardar() {
		if (!seccionActual) return;
		guardando = true;
		try {
			const data = {
				seccion: seccionActual as SeccionUIIX,
				subseccion: editorTitulo,
				titulo: editorTitulo,
				contenido: editorContenido,
				citas_usadas: editorCitasUsadas
			};
			if (borradorActual?.id === '__new__') {
				const id = await crearBorrador(data);
				borradorActual = { ...borradorActual, id };
			} else if (borradorActual) {
				await actualizarBorrador(borradorActual.id, data);
			}
			await cargarBorradores();
			showToast('Borrador guardado');
		} catch {
			showToast('Error al guardar', 'error');
		} finally {
			guardando = false;
		}
	}

	async function handleEliminar() {
		if (!borradorActual || borradorActual.id === '__new__') return;
		if (!confirm('¿Eliminar este borrador?')) return;
		await eliminarBorrador(borradorActual.id);
		borradorActual = null;
		await cargarBorradores();
		showToast('Borrador eliminado');
	}

	function insertarCita(cita: Cita) {
		const insercion = `(${cita.autor}, ${cita.año})`;
		if (textareaEl) {
			const start = textareaEl.selectionStart;
			const end = textareaEl.selectionEnd;
			editorContenido = editorContenido.substring(0, start) + insercion + editorContenido.substring(end);
			// Move cursor after insertion
			setTimeout(() => {
				textareaEl.focus();
				textareaEl.selectionStart = textareaEl.selectionEnd = start + insercion.length;
			}, 0);
		} else {
			editorContenido += insercion;
		}
		if (!editorCitasUsadas.includes(cita.id)) {
			editorCitasUsadas = [...editorCitasUsadas, cita.id];
		}
		showCitaSelector = false;
		citaBusqueda = '';
	}

	function removerCitaUsada(citaId: string) {
		editorCitasUsadas = editorCitasUsadas.filter(id => id !== citaId);
	}

	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}

	async function handleIARedactar() {
		if (!seccionActual) return;
		iaLoading = true;
		iaResult = '';
		try {
			const citasParaIA = editorCitasUsadas
				.map(id => getCitaById(id))
				.filter((c): c is Cita => !!c)
				.map(c => ({ autor: c.autor, año: c.año, cita_textual: c.cita_textual }));
			const seccionNombre = SECCIONES_UIIX[seccionActual as SeccionUIIX];
			iaResult = await redactarParrafo(seccionNombre, editorContenido, citasParaIA);
		} catch (e: any) {
			iaResult = `Error: ${e.message}`;
		} finally {
			iaLoading = false;
		}
	}

	function insertarResultadoIA() {
		editorContenido += (editorContenido ? '\n\n' : '') + iaResult;
		iaResult = '';
		showToast('Párrafo insertado');
	}
</script>

<h1>Borradores</h1>

<div class="seccion-selector">
	<label for="seccion-select">Sección UIIX</label>
	<select id="seccion-select" bind:value={seccionActual} onchange={handleSeccionChange}>
		<option value="">Seleccionar sección...</option>
		{#each GRUPOS_SECCIONES as grupo}
			<optgroup label={grupo.grupo}>
				{#each grupo.secciones as sec}
					<option value={sec}>{SECCIONES_UIIX[sec as SeccionUIIX]}</option>
				{/each}
			</optgroup>
		{/each}
	</select>
</div>

{#if seccionActual && !borradorActual}
	<div class="borradores-section">
		<div class="section-header">
			<h2>{SECCIONES_UIIX[seccionActual as SeccionUIIX]}</h2>
			<button class="btn btn-outline" onclick={nuevoEditor}>Nuevo borrador</button>
		</div>
		{#if cargando}
			<p class="loading">Cargando...</p>
		{:else if borradores.length === 0}
			<p class="empty">No hay borradores en esta sección.</p>
		{:else}
			<div class="borrador-list">
				{#each borradores as b (b.id)}
					<button class="borrador-card" onclick={() => abrirBorrador(b)}>
						<div class="borrador-title">{b.titulo || 'Sin título'}</div>
						<div class="borrador-preview">{b.contenido.substring(0, 100)}{b.contenido.length > 100 ? '...' : ''}</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}

{#if borradorActual}
	<div class="editor">
		<div class="editor-header">
			<button class="btn-link" onclick={() => { borradorActual = null; iaResult = ''; }}>&larr; Volver</button>
			{#if borradorActual.id !== '__new__'}
				<button class="btn-delete" onclick={handleEliminar}>Eliminar</button>
			{/if}
		</div>

		<div class="field">
			<label for="editor-titulo">Subsección / Título</label>
			<input id="editor-titulo" type="text" placeholder="Ej: 2.2 Marco Teórico" bind:value={editorTitulo} />
		</div>

		<div class="field">
			<label for="editor-contenido">Contenido</label>
			<textarea
				id="editor-contenido"
				bind:value={editorContenido}
				bind:this={textareaEl}
				rows="12"
				placeholder="Escribe tu borrador aquí..."
				class="editor-textarea"
			></textarea>
		</div>

		<div class="editor-actions">
			<button class="btn btn-outline" onclick={() => { showCitaSelector = !showCitaSelector; citaBusqueda = ''; }}>
				Insertar cita
			</button>
			<button class="btn btn-outline" onclick={handleIARedactar} disabled={iaLoading}>
				{iaLoading ? 'Generando...' : 'IA: Redactar párrafo'}
			</button>
			<button class="btn" onclick={guardar} disabled={guardando}>
				{guardando ? 'Guardando...' : 'Guardar'}
			</button>
		</div>

		{#if showCitaSelector}
			<div class="cita-selector">
				<input type="text" placeholder="Buscar cita..." bind:value={citaBusqueda} />
				<div class="cita-selector-list">
					{#each citasFiltradas as c (c.id)}
						<button class="cita-selector-item" onclick={() => insertarCita(c)}>
							<span class="cita-sel-autor">{c.autor} ({c.año})</span>
							<span class="cita-sel-titulo">{c.titulo}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if editorCitasUsadas.length > 0}
			<div class="citas-usadas">
				<span class="label">Citas usadas:</span>
				<div class="chips">
					{#each editorCitasUsadas as citaId}
						{@const c = getCitaById(citaId)}
						{#if c}
							<span class="chip">
								{c.autor} ({c.año})
								<button class="chip-remove" onclick={() => removerCitaUsada(citaId)}>&times;</button>
							</span>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		{#if iaResult}
			<div class="ia-result">
				<div class="ia-result-header">
					<span class="label">Párrafo sugerido por IA</span>
					<button class="btn btn-sm" onclick={insertarResultadoIA}>Insertar</button>
				</div>
				<pre>{iaResult}</pre>
			</div>
		{/if}
	</div>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 16px;
	}
	.seccion-selector {
		margin-bottom: 16px;
	}
	.seccion-selector label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 4px;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	h2 {
		font-size: 1.125rem;
		color: var(--text-secondary);
	}
	.borrador-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.borrador-card {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px 14px;
		cursor: pointer;
		transition: border-color 0.2s;
		color: inherit;
	}
	.borrador-card:hover {
		border-color: var(--accent-dim);
	}
	.borrador-title {
		font-weight: 500;
		margin-bottom: 4px;
	}
	.borrador-preview {
		font-size: 0.8125rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Editor */
	.editor {
		margin-top: 8px;
	}
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.field {
		margin-bottom: 12px;
	}
	.field label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 4px;
	}
	.editor-textarea {
		min-height: 250px;
		padding: 16px;
		font-size: 1rem;
		line-height: 1.7;
	}
	.editor-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.btn {
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		background: var(--accent);
		color: var(--bg-base);
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
	}
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-sm { padding: 4px 10px; font-size: 0.75rem; }
	.btn-outline {
		background: transparent;
		color: var(--accent);
		border: 1px solid var(--accent-dim);
	}
	.btn-link {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--accent);
		background: none;
		border: none;
		cursor: pointer;
	}
	.btn-delete {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--error);
		padding: 4px 10px;
		border: 1px solid var(--error);
		border-radius: 6px;
	}

	/* Cita selector */
	.cita-selector {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px;
		margin-bottom: 12px;
	}
	.cita-selector-list {
		max-height: 200px;
		overflow-y: auto;
		margin-top: 8px;
	}
	.cita-selector-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		padding: 8px;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		border-radius: 6px;
		transition: background 0.15s;
	}
	.cita-selector-item:hover {
		background: var(--bg-hover);
	}
	.cita-sel-autor {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--accent);
	}
	.cita-sel-titulo {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	/* Citas usadas chips */
	.citas-usadas {
		margin-bottom: 12px;
	}
	.label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 6px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 3px 8px;
		border-radius: 6px;
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.chip-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
		line-height: 1;
	}

	/* IA result */
	.ia-result {
		background: var(--bg-surface);
		border: 1px solid var(--accent-dim);
		border-radius: 10px;
		padding: 14px;
		margin-top: 12px;
	}
	.ia-result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.ia-result pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		line-height: 1.6;
	}

	.loading, .empty {
		text-align: center;
		color: var(--text-muted);
		padding: 24px 0;
		font-style: italic;
	}
</style>
