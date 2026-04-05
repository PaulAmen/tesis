<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import {
		obtenerBorradoresPorSeccion, crearBorrador, actualizarBorrador, eliminarBorrador
	} from '$lib/services/borradores';
	import {
		obtenerSeccionesPersonalizadas, crearSeccionPersonalizada, eliminarSeccionPersonalizada
	} from '$lib/services/secciones';
	import {
		obtenerImagenesPorSeccion, subirImagen, actualizarImagen, eliminarImagen
	} from '$lib/services/imagenes';
	import { redactarParrafo, revisarBorrador } from '$lib/services/ia';
	import { SECCIONES_UIIX, GRUPOS_SECCIONES, formatAutores, formatAutoresCorto } from '$lib/types';
	import type { Borrador, SeccionUIIX, SeccionPersonalizada, Cita, ImagenTesis } from '$lib/types';
	import ExportarTesis from '$lib/components/ExportarTesis.svelte';

	let seccionActual = $state<string>('');
	let borradores = $state<Borrador[]>([]);
	let borradorActual = $state<Borrador | null>(null);
	let cargando = $state(false);

	// Custom sections
	let seccionesPersonalizadas = $state<SeccionPersonalizada[]>([]);
	let mostrarFormSeccion = $state(false);
	let nuevaSeccionNombre = $state('');
	let creandoSeccion = $state(false);

	// Editor fields
	let editorTitulo = $state('');
	let editorContenido = $state('');
	let editorCitasUsadas = $state<string[]>([]);
	let guardando = $state(false);

	// Cita selector
	let showCitaSelector = $state(false);
	let citaBusqueda = $state('');
	let textareaEl = $state<HTMLTextAreaElement>();

	// Citation Options
	let showCitaOptions = $state(false);
	let selectedCitaForOptions = $state<Cita | null>(null);
	let citaPaginas = $state('');
	let fuenteSecundaria = $state(''); // For "cita de cita"

	// IA
	let iaLoading = $state(false);
	let iaResult = $state('');
	let revisionLoading = $state(false);
	let revisionResult = $state('');

	// Imágenes
	let imagenesSeccion = $state<ImagenTesis[]>([]);
	let showImagePanel = $state(false);
	let subiendoImagen = $state(false);
	let imgCaption = $state('');
	let fileInputEl = $state<HTMLInputElement>();

	onMount(() => {
		cargarSeccionesPersonalizadas();
	});

	async function cargarSeccionesPersonalizadas() {
		try {
			seccionesPersonalizadas = await obtenerSeccionesPersonalizadas();
		} catch {
			// silently fail — custom sections are optional
		}
	}

	async function handleCrearSeccion() {
		const nombre = nuevaSeccionNombre.trim();
		if (!nombre) return;
		creandoSeccion = true;
		try {
			const orden = seccionesPersonalizadas.length;
			await crearSeccionPersonalizada(nombre, orden);
			await cargarSeccionesPersonalizadas();
			nuevaSeccionNombre = '';
			mostrarFormSeccion = false;
			showToast('Sección creada');
		} catch {
			showToast('Error al crear sección', 'error');
		} finally {
			creandoSeccion = false;
		}
	}

	async function handleEliminarSeccion(sec: SeccionPersonalizada) {
		if (!confirm(`¿Eliminar la sección "${sec.nombre}"? Los borradores asociados no se eliminarán.`)) return;
		try {
			await eliminarSeccionPersonalizada(sec.id);
			if (seccionActual === `custom_${sec.id}`) {
				seccionActual = '';
				borradorActual = null;
			}
			await cargarSeccionesPersonalizadas();
			showToast('Sección eliminada');
		} catch {
			showToast('Error al eliminar sección', 'error');
		}
	}

	function getNombreSeccion(key: string): string {
		if (key in SECCIONES_UIIX) return SECCIONES_UIIX[key as SeccionUIIX];
		if (key.startsWith('custom_')) {
			const customId = key.slice(7);
			const sec = seccionesPersonalizadas.find(s => s.id === customId);
			return sec?.nombre ?? key;
		}
		return key;
	}

	function esSeccionPersonalizada(key: string): boolean {
		return key.startsWith('custom_');
	}

	let citasFiltradas = $derived.by(() => {
		const q = citaBusqueda.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autores.some(a => a.toLowerCase().includes(q)) ||
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
		revisionResult = '';
		showImagePanel = false;
		cargarBorradores();
		cargarImagenes();
	}

	function nuevoEditor() {
		borradorActual = null;
		editorTitulo = '';
		editorContenido = '';
		editorCitasUsadas = [];
		iaResult = '';
		revisionResult = '';
		borradorActual = {
			id: '__new__',
			seccion: seccionActual,
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
				seccion: seccionActual,
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

	function seleccionarCita(cita: Cita) {
		selectedCitaForOptions = cita;
		showCitaOptions = true;
		showCitaSelector = false;
		citaBusqueda = '';
		citaPaginas = cita.paginas || '';
	}

	function confirmarInsercionCita(tipo: 'parentetica' | 'narrativa' | 'directa_corta' | 'directa_larga' | 'cita_de_cita') {
		if (!selectedCitaForOptions) return;
		
		const c = selectedCitaForOptions;
		const autores = formatAutoresCorto(c.autores);
		let insercion = '';

		switch (tipo) {
			case 'parentetica':
				insercion = `(${autores}, ${c.año}${citaPaginas ? `, p. ${citaPaginas}` : ''})`;
				break;
			case 'narrativa':
				insercion = `${autores} (${c.año}${citaPaginas ? `, p. ${citaPaginas}` : ''})`;
				break;
			case 'directa_corta':
				const textoCita = c.cita_textual || '...';
				insercion = `"${textoCita}" (${autores}, ${c.año}, p. ${citaPaginas || '?'})`;
				break;
			case 'directa_larga':
				insercion = `\n\n\\begin{quote}\n\\singlespacing\n${c.cita_textual || '...'}\n\\end{quote} (${autores}, ${c.año}, p. ${citaPaginas || '?'})\n\n`;
				break;
			case 'cita_de_cita':
				insercion = `${fuenteSecundaria || '[Autor Original]'} (citado en ${autores}, ${c.año})`;
				break;
		}

		if (textareaEl) {
			const start = textareaEl.selectionStart;
			const end = textareaEl.selectionEnd;
			editorContenido = editorContenido.substring(0, start) + insercion + editorContenido.substring(end);
			setTimeout(() => {
				textareaEl!.focus();
				textareaEl!.selectionStart = textareaEl!.selectionEnd = start + insercion.length;
			}, 0);
		} else {
			editorContenido += insercion;
		}

		if (!editorCitasUsadas.includes(c.id)) {
			editorCitasUsadas = [...editorCitasUsadas, c.id];
		}

		showCitaOptions = false;
		selectedCitaForOptions = null;
		citaPaginas = '';
		fuenteSecundaria = '';
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
				.map(c => ({ autor: formatAutores(c.autores), año: c.año, cita_textual: c.cita_textual }));
			const seccionNombre = getNombreSeccion(seccionActual);
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

	async function handleIARevisar() {
		if (!seccionActual || !editorContenido.trim()) {
			showToast('Escribe algo antes de revisar', 'error');
			return;
		}
		revisionLoading = true;
		revisionResult = '';
		try {
			const seccionNombre = getNombreSeccion(seccionActual);
			revisionResult = await revisarBorrador({
				seccion: seccionNombre,
				titulo: editorTitulo,
				contenido: editorContenido
			});
		} catch (e: any) {
			revisionResult = `Error: ${e.message}`;
		} finally {
			revisionLoading = false;
		}
	}

	// ── Imágenes ──

	async function cargarImagenes() {
		if (!seccionActual) return;
		try {
			imagenesSeccion = await obtenerImagenesPorSeccion(seccionActual);
		} catch {
			// silent
		}
	}

	async function handleSubirImagen() {
		const archivos = fileInputEl?.files;
		if (!archivos || archivos.length === 0 || !seccionActual) return;
		subiendoImagen = true;
		try {
			for (const archivo of archivos) {
				await subirImagen(archivo, seccionActual, imgCaption.trim());
			}
			await cargarImagenes();
			imgCaption = '';
			if (fileInputEl) fileInputEl.value = '';
			showToast('Imagen subida');
		} catch (e: any) {
			showToast(e.message ?? 'Error al subir imagen', 'error');
		} finally {
			subiendoImagen = false;
		}
	}

	async function handleEliminarImagen(img: ImagenTesis) {
		if (!confirm(`¿Eliminar "${img.nombre}"?`)) return;
		try {
			await eliminarImagen(img);
			await cargarImagenes();
			showToast('Imagen eliminada');
		} catch {
			showToast('Error al eliminar imagen', 'error');
		}
	}

	async function handleCaptionChange(img: ImagenTesis, nuevoCaption: string) {
		await actualizarImagen(img.id, { caption: nuevoCaption });
	}

	function insertarFigura(img: ImagenTesis) {
		const tag = `[fig:${img.id}]`;
		if (textareaEl) {
			const start = textareaEl.selectionStart;
			const end = textareaEl.selectionEnd;
			editorContenido = editorContenido.substring(0, start) + tag + editorContenido.substring(end);
			setTimeout(() => {
				textareaEl!.focus();
				textareaEl!.selectionStart = textareaEl!.selectionEnd = start + tag.length;
			}, 0);
		} else {
			editorContenido += tag;
		}
		showToast('Referencia de figura insertada');
	}
</script>

<h1>Borradores</h1>

<ExportarTesis />

<div class="seccion-selector">
	<label for="seccion-select">Sección</label>
	<div class="seccion-selector-row">
		<select id="seccion-select" bind:value={seccionActual} onchange={handleSeccionChange}>
			<option value="">Seleccionar sección...</option>
			{#each GRUPOS_SECCIONES as grupo}
				<optgroup label={grupo.grupo}>
					{#each grupo.secciones as sec}
						<option value={sec}>{SECCIONES_UIIX[sec as SeccionUIIX]}</option>
					{/each}
				</optgroup>
			{/each}
			{#if seccionesPersonalizadas.length > 0}
				<optgroup label="Secciones personalizadas">
					{#each seccionesPersonalizadas as sec}
						<option value={`custom_${sec.id}`}>{sec.nombre}</option>
					{/each}
				</optgroup>
			{/if}
		</select>
		<button class="btn-add-seccion" onclick={() => { mostrarFormSeccion = !mostrarFormSeccion; }} title="Agregar sección">
			{mostrarFormSeccion ? '−' : '+'}
		</button>
	</div>

	{#if mostrarFormSeccion}
		<div class="nueva-seccion-form">
			<input
				type="text"
				placeholder="Nombre de la nueva sección..."
				bind:value={nuevaSeccionNombre}
				onkeydown={(e) => { if (e.key === 'Enter') handleCrearSeccion(); }}
			/>
			<button class="btn btn-sm" onclick={handleCrearSeccion} disabled={creandoSeccion || !nuevaSeccionNombre.trim()}>
				{creandoSeccion ? 'Creando...' : 'Crear'}
			</button>
		</div>
	{/if}
</div>

{#if seccionActual && !borradorActual}
	<div class="borradores-section">
		<div class="section-header">
			<h2>{getNombreSeccion(seccionActual)}</h2>
			<div class="section-header-actions">
				{#if esSeccionPersonalizada(seccionActual)}
					{@const customId = seccionActual.slice(7)}
					{@const sec = seccionesPersonalizadas.find(s => s.id === customId)}
					{#if sec}
						<button class="btn-delete-seccion" onclick={() => handleEliminarSeccion(sec)} title="Eliminar sección">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="3 6 5 6 21 6"/>
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
							</svg>
						</button>
					{/if}
				{/if}
				<button class="btn btn-outline" onclick={nuevoEditor}>Nuevo borrador</button>
			</div>
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
			<button class="btn btn-outline btn-img" onclick={() => { showImagePanel = !showImagePanel; }}>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					<circle cx="8.5" cy="8.5" r="1.5"/>
					<polyline points="21 15 16 10 5 21"/>
				</svg>
				Imágenes
			</button>
			<button class="btn btn-outline" onclick={handleIARedactar} disabled={iaLoading}>
				{iaLoading ? 'Generando...' : 'IA: Redactar'}
			</button>
			<button class="btn btn-outline btn-revisar" onclick={handleIARevisar} disabled={revisionLoading}>
				{revisionLoading ? 'Revisando...' : 'IA: Revisar'}
			</button>
			<button class="btn" onclick={guardar} disabled={guardando}>
				{guardando ? 'Guardando...' : 'Guardar'}
			</button>
		</div>

		{#if showImagePanel}
			<div class="img-panel">
				<div class="img-panel-header">
					<span class="label">Imágenes de esta sección</span>
				</div>

				<!-- Upload -->
				<div class="img-upload-row">
					<input
						type="file"
						accept="image/*"
						multiple
						bind:this={fileInputEl}
						class="img-file-input"
					/>
					<input
						type="text"
						placeholder="Caption (opcional)"
						bind:value={imgCaption}
						class="img-caption-input"
					/>
					<button class="btn btn-sm" onclick={handleSubirImagen} disabled={subiendoImagen}>
						{subiendoImagen ? 'Subiendo...' : 'Subir'}
					</button>
				</div>

				<!-- Gallery -->
				{#if imagenesSeccion.length === 0}
					<p class="img-empty">No hay imágenes en esta sección.</p>
				{:else}
					<div class="img-gallery">
						{#each imagenesSeccion as img (img.id)}
							<div class="img-card">
								<img src={img.url} alt={img.caption || img.nombre} class="img-thumb" />
								<div class="img-card-body">
									<input
										type="text"
										class="img-caption-edit"
										value={img.caption}
										placeholder="Caption..."
										onblur={(e) => handleCaptionChange(img, (e.target as HTMLInputElement).value)}
									/>
									<span class="img-tag">[fig:{img.id}]</span>
									<div class="img-card-actions">
										<button class="btn btn-sm btn-outline" onclick={() => insertarFigura(img)} title="Insertar referencia en el texto">
											Insertar
										</button>
										<button class="btn btn-sm btn-discard" onclick={() => handleEliminarImagen(img)} title="Eliminar imagen">
											Eliminar
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if showCitaSelector}
			<div class="cita-selector">
				<input type="text" placeholder="Buscar cita..." bind:value={citaBusqueda} />
				<div class="cita-selector-list">
					{#each citasFiltradas as c (c.id)}
						<button class="cita-selector-item" onclick={() => seleccionarCita(c)}>
							<span class="cita-sel-autor">{formatAutores(c.autores)} ({c.año})</span>
							<span class="cita-sel-titulo">{c.titulo}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if showCitaOptions && selectedCitaForOptions}
			<div class="cita-options-panel">
				<div class="cita-options-header">
					<h3>Opciones de Cita: {formatAutoresCorto(selectedCitaForOptions.autores)} ({selectedCitaForOptions.año})</h3>
					<button class="btn-close" onclick={() => { showCitaOptions = false; selectedCitaForOptions = null; }}>&times;</button>
				</div>
				
				<div class="cita-options-form">
					<div class="field-row">
						<div class="field">
							<label for="cita-paginas">Página(s)</label>
							<input id="cita-paginas" type="text" placeholder="Ej: 45 o 45-47" bind:value={citaPaginas} />
						</div>
						<div class="field">
							<label for="fuente-sec">Autor Original (Cita de cita)</label>
							<input id="fuente-sec" type="text" placeholder="Ej: Piaget" bind:value={fuenteSecundaria} />
						</div>
					</div>

					<div class="cita-types-grid">
						<button class="btn-option" onclick={() => confirmarInsercionCita('parentetica')}>
							<strong>Parentética</strong>
							<span>({formatAutoresCorto(selectedCitaForOptions.autores)}, {selectedCitaForOptions.año})</span>
						</button>
						<button class="btn-option" onclick={() => confirmarInsercionCita('narrativa')}>
							<strong>Narrativa</strong>
							<span>{formatAutoresCorto(selectedCitaForOptions.autores)} ({selectedCitaForOptions.año})</span>
						</button>
						<button class="btn-option" onclick={() => confirmarInsercionCita('directa_corta')}>
							<strong>Directa Corta</strong>
							<span>"..." ({formatAutoresCorto(selectedCitaForOptions.autores)}, {selectedCitaForOptions.año}, p. {citaPaginas || 'X'})</span>
						</button>
						<button class="btn-option" onclick={() => confirmarInsercionCita('directa_larga')}>
							<strong>Directa Larga</strong>
							<span>Bloque quote</span>
						</button>
						<button class="btn-option" onclick={() => confirmarInsercionCita('cita_de_cita')}>
							<strong>Cita de Cita</strong>
							<span>{fuenteSecundaria || 'Autor'} (citado en {formatAutoresCorto(selectedCitaForOptions.autores)}...)</span>
						</button>
					</div>
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
								{formatAutores(c.autores)} ({c.año})
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
				</div>
				<textarea class="ia-textarea" bind:value={iaResult} rows="8"></textarea>
				<div class="ia-buttons">
					<button class="btn btn-sm" onclick={insertarResultadoIA}>Insertar texto</button>
					<button class="btn btn-sm btn-discard" onclick={() => { iaResult = ''; }}>Descartar</button>
				</div>
			</div>
		{/if}

		{#if revisionLoading}
			<div class="revision-result">
				<p class="loading">Revisando borrador...</p>
			</div>
		{:else if revisionResult}
			<div class="revision-result">
				<div class="revision-header">
					<span class="label">Revisión IA</span>
				</div>
				<textarea class="ia-textarea" bind:value={revisionResult} rows="10"></textarea>
				<div class="ia-buttons">
					<button class="btn btn-sm" onclick={() => navigator.clipboard.writeText(revisionResult).then(() => showToast('Copiado'))}>Copiar</button>
					<button class="btn btn-sm btn-discard" onclick={() => revisionResult = ''}>Descartar</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 20px;
	}
	@media (min-width: 480px) {
		h1 {
			font-size: 2.25rem;
			margin-bottom: 24px;
		}
	}
	.seccion-selector {
		margin-bottom: 32px;
		background: var(--bg-surface);
		padding: 20px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.seccion-selector label {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
	}
	.seccion-selector-row {
		display: flex;
		gap: 8px;
		align-items: stretch;
	}
	.seccion-selector-row select {
		flex: 1;
	}
	.btn-add-seccion {
		width: 44px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--accent);
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-add-seccion:hover {
		background: var(--accent-glow);
		border-color: var(--accent-dim);
	}
	.nueva-seccion-form {
		display: flex;
		gap: 8px;
		margin-top: 12px;
		animation: panelEntry 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes panelEntry {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.nueva-seccion-form input {
		flex: 1;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 2px solid var(--border);
		flex-wrap: wrap;
	}
	.section-header-actions {
		display: flex;
		gap: 10px;
		align-items: center;
	}
	.btn-delete-seccion {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-muted);
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-delete-seccion:hover {
		color: var(--error);
		border-color: var(--error);
		background: rgba(224, 108, 117, 0.1);
	}
	h2 {
		font-size: 1.5rem;
		color: var(--text-primary);
		font-weight: 700;
	}
	.borrador-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}
	@media (min-width: 768px) {
		.borrador-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1200px) {
		.borrador-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.borrador-card {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		cursor: pointer;
		transition: all 0.2s;
		color: inherit;
		box-shadow: var(--shadow-sm);
	}
	.borrador-card:hover {
		border-color: var(--accent);
		background: var(--bg-hover);
		transform: translateY(-2px);
	}
	.borrador-title {
		font-weight: 700;
		font-size: 1.125rem;
		margin-bottom: 8px;
		color: var(--accent);
	}
	.borrador-preview {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	/* Editor */
	.editor {
		margin-top: 16px;
		background: var(--bg-surface);
		padding: 16px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
	}
	@media (min-width: 480px) {
		.editor {
			padding: 24px;
			border-radius: var(--radius-lg);
		}
	}
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}
	.field {
		margin-bottom: 20px;
	}
	.field label {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
	}
	.editor-textarea {
		min-height: 300px;
		padding: 16px;
		font-size: 1rem;
		line-height: 1.7;
		background: var(--bg-base);
		border: 1.5px solid var(--border);
	}
	@media (min-width: 480px) {
		.editor-textarea {
			min-height: 600px;
			padding: 28px;
			font-size: 1.15rem;
			line-height: 1.8;
		}
	}
	.editor-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}
	@media (min-width: 480px) {
		.editor-actions {
			gap: 12px;
			justify-content: flex-end;
		}
	}
	@media (max-width: 480px) {
		.editor-actions .btn,
		.editor-actions .btn-outline {
			flex: 1 1 calc(50% - 4px);
			min-width: 0;
			padding: 10px 8px;
			font-size: 0.8rem;
			text-align: center;
			justify-content: center;
		}
	}
	.btn {
		padding: 12px 24px;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		background: var(--accent);
		color: #121212;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: all 0.2s;
		width: auto;
	}
	.btn:active { transform: scale(0.97); }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-sm { padding: 8px 16px; font-size: 0.875rem; }
	.btn-outline {
		background: transparent;
		color: var(--accent);
		border: 1px solid var(--accent-dim);
	}
	.btn-outline:hover {
		background: var(--accent-glow);
	}
	.btn-link {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--accent);
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.btn-delete {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--error);
		padding: 8px 16px;
		border: 1px solid var(--error);
		border-radius: var(--radius-sm);
		background: rgba(252, 165, 165, 0.05);
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

	/* Cita options panel */
	.cita-options-panel {
		background: var(--bg-surface);
		border: 1px solid var(--accent);
		border-radius: var(--radius-md);
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.3);
		animation: panelEntry 0.2s ease-out;
	}
	.cita-options-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	.cita-options-header h3 {
		font-size: 1rem;
		margin: 0;
		color: var(--accent);
	}
	.btn-close {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.5rem;
		cursor: pointer;
		line-height: 1;
	}
	.cita-options-form .field-row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}
	@media (min-width: 480px) {
		.cita-options-form .field-row {
			flex-direction: row;
			gap: 16px;
		}
	}
	.cita-types-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
	}
	@media (min-width: 480px) {
		.cita-types-grid {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 10px;
		}
	}
	.btn-option {
		display: flex;
		flex-direction: column;
		text-align: left;
		padding: 12px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 0.2s;
		color: var(--text-primary);
	}
	.btn-option:hover {
		border-color: var(--accent);
		background: var(--accent-glow);
	}
	.btn-option strong {
		display: block;
		font-size: 0.875rem;
		color: var(--accent);
		margin-bottom: 4px;
	}
	.btn-option span {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-family: var(--font-mono);
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
	.ia-textarea {
		width: 100%;
		min-height: 160px;
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--text-primary);
		background: var(--bg-base);
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 14px;
		resize: vertical;
	}
	.ia-textarea:focus {
		border-color: var(--accent);
	}
	.ia-buttons {
		display: flex;
		gap: 10px;
		margin-top: 10px;
	}
	.btn-discard {
		background: transparent !important;
		color: var(--text-muted) !important;
		border: 1px solid var(--border) !important;
	}
	.btn-discard:hover {
		color: var(--error) !important;
		border-color: var(--error) !important;
	}

	/* Revision */
	.btn-revisar {
		border-color: var(--warning);
		color: var(--warning);
	}
	.revision-result {
		background: var(--bg-base);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		margin-top: 12px;
	}
	.revision-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.loading, .empty {
		text-align: center;
		color: var(--text-muted);
		padding: 24px 0;
		font-style: italic;
	}

	/* Images */
	.btn-img {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.img-panel {
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 16px;
		margin-bottom: 16px;
		animation: panelEntry 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.img-panel-header {
		margin-bottom: 12px;
	}
	.img-upload-row {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.img-file-input {
		flex: 1;
		min-width: 160px;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
	.img-caption-input {
		flex: 1;
		min-width: 140px;
	}
	.img-empty {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		text-align: center;
		padding: 12px 0;
	}
	.img-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}
	.img-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		transition: border-color 0.2s;
	}
	.img-card:hover {
		border-color: var(--accent-dim);
	}
	.img-thumb {
		width: 100%;
		height: 140px;
		object-fit: cover;
		display: block;
	}
	.img-card-body {
		padding: 10px;
	}
	.img-caption-edit {
		width: 100%;
		font-size: 0.8rem;
		padding: 4px 6px;
		margin-bottom: 6px;
		background: var(--bg-base);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-primary);
	}
	.img-tag {
		display: block;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-bottom: 8px;
		word-break: break-all;
	}
	.img-card-actions {
		display: flex;
		gap: 6px;
	}
</style>
