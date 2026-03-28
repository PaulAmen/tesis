<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { citasStore, conexionesStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { eliminarCita } from '$lib/services/citas';
	import { crearConexion, actualizarConexion } from '$lib/services/conexiones';
	import { obtenerCitas } from '$lib/services/citas';
	import { obtenerConexiones } from '$lib/services/conexiones';
	import { puntosClavesCita, comoUsarCita, conexionesIACita } from '$lib/services/ia';
	import type { Cita, Conexion } from '$lib/types';

	let citaId = $derived(page.params.id);
	let cita = $derived($citasStore.find((c: Cita) => c.id === citaId));

	// Connections
	let conexionesManuales = $derived(
		$conexionesStore.filter((cx: Conexion) => cx.cita_origen_id === citaId || cx.cita_destino_id === citaId)
	);

	let conexionesPorTema = $derived.by(() => {
		if (!cita) return [];
		return $citasStore.filter((c: Cita) =>
			c.id !== citaId && c.temas.some(t => cita!.temas.includes(t))
		);
	});

	// Manual connection form
	let showConexionForm = $state(false);
	let conexionDestinoId = $state('');
	let conexionEtiqueta = $state('');
	let conexionComentario = $state('');
	let guardandoConexion = $state(false);

	// Comment edit
	let editandoComentarioId = $state('');
	let nuevoComentario = $state('');

	// AI
	let iaMode = $state<'puntos' | 'uso' | 'conexiones' | null>(null);
	let iaResult = $state('');
	let iaLoading = $state(false);

	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}

	function getOtraCitaId(cx: Conexion): string {
		return cx.cita_origen_id === citaId ? cx.cita_destino_id : cx.cita_origen_id;
	}

	async function handleEliminar() {
		if (!confirm('¿Eliminar esta cita?')) return;
		await eliminarCita(citaId);
		citasStore.set(await obtenerCitas());
		showToast('Cita eliminada');
		goto(`${base}/`);
	}

	async function handleCrearConexion() {
		if (!conexionDestinoId) return;
		guardandoConexion = true;
		try {
			await crearConexion({
				cita_origen_id: citaId,
				cita_destino_id: conexionDestinoId,
				tipo_conexion: 'manual',
				etiqueta: conexionEtiqueta,
				comentario: conexionComentario
			});
			conexionesStore.set(await obtenerConexiones());
			showToast('Conexión creada');
			showConexionForm = false;
			conexionDestinoId = '';
			conexionEtiqueta = '';
			conexionComentario = '';
		} catch {
			showToast('Error al crear conexión', 'error');
		} finally {
			guardandoConexion = false;
		}
	}

	async function handleGuardarComentario(cxId: string) {
		try {
			await actualizarConexion(cxId, { comentario: nuevoComentario });
			conexionesStore.set(await obtenerConexiones());
			showToast('Comentario actualizado');
			editandoComentarioId = '';
			nuevoComentario = '';
		} catch {
			showToast('Error al guardar comentario', 'error');
		}
	}

	async function handleIA(mode: 'puntos' | 'uso' | 'conexiones') {
		if (!cita) return;
		iaMode = mode;
		iaLoading = true;
		iaResult = '';
		try {
			if (mode === 'puntos') {
				iaResult = await puntosClavesCita(cita);
			} else if (mode === 'uso') {
				iaResult = await comoUsarCita(cita);
			} else {
				const otras = $citasStore.filter((c: Cita) => c.id !== citaId);
				iaResult = await conexionesIACita(cita, otras);
			}
		} catch (e: any) {
			iaResult = `Error: ${e.message}`;
		} finally {
			iaLoading = false;
		}
	}
</script>

{#if !cita}
	<p class="empty">Cita no encontrada.</p>
	<a href="{base}/">Volver a citas</a>
{:else}
	<div class="detail-header">
		<a href="{base}/" class="back">&larr; Citas</a>
		<button class="btn-delete" onclick={handleEliminar}>Eliminar</button>
	</div>

	<div class="detail-card">
		<div class="meta-row">
			<span class="badge badge-{cita.tipo}">{cita.tipo}</span>
			<span class="year">{cita.año}</span>
		</div>
		<h1>{cita.titulo}</h1>
		<p class="autor">{cita.autor}</p>

		{#if cita.fuente}
			<div class="field"><span class="label">Fuente</span> {cita.fuente}</div>
		{/if}
		{#if cita.paginas}
			<div class="field"><span class="label">Páginas</span> {cita.paginas}</div>
		{/if}
		{#if cita.cita_textual}
			<blockquote>{cita.cita_textual}</blockquote>
		{/if}
		{#if cita.notas}
			<div class="field"><span class="label">Notas</span> {cita.notas}</div>
		{/if}
		{#if cita.temas.length > 0}
			<div class="tags">
				{#each cita.temas as tema}
					<span class="tag">{tema}</span>
				{/each}
			</div>
		{/if}

		<div class="apa-box">
			<span class="label">Referencia APA 7</span>
			<p class="apa">{cita.referencia_apa}</p>
		</div>
	</div>

	<!-- CONEXIONES -->
	<section class="section">
		<h2>Conexiones</h2>

		{#if conexionesManuales.length > 0}
			<h3>Manuales</h3>
			{#each conexionesManuales as cx (cx.id)}
				{@const otra = getCitaById(getOtraCitaId(cx))}
				<div class="conexion-item">
					<div class="conexion-header">
						{#if otra}
							<a href="{base}/citas/{otra.id}">{otra.autor} ({otra.año})</a>
						{:else}
							<span class="text-muted">(cita eliminada)</span>
						{/if}
						{#if cx.etiqueta}
							<span class="conexion-tag">{cx.etiqueta}</span>
						{/if}
					</div>
					{#if cx.comentario}
						<p class="conexion-comentario">{cx.comentario}</p>
					{/if}
					{#if editandoComentarioId === cx.id}
						<div class="comment-edit">
							<textarea bind:value={nuevoComentario} rows="2" placeholder="Comentario..."></textarea>
							<div class="comment-actions">
								<button class="btn btn-sm" onclick={() => handleGuardarComentario(cx.id)}>Guardar</button>
								<button class="btn btn-sm btn-ghost" onclick={() => editandoComentarioId = ''}>Cancelar</button>
							</div>
						</div>
					{:else}
						<button class="btn-link" onclick={() => { editandoComentarioId = cx.id; nuevoComentario = cx.comentario; }}>
							{cx.comentario ? 'Editar comentario' : 'Agregar comentario'}
						</button>
					{/if}
				</div>
			{/each}
		{/if}

		{#if conexionesPorTema.length > 0}
			<h3>Por tema compartido</h3>
			{#each conexionesPorTema as rel (rel.id)}
				<div class="conexion-item">
					<a href="{base}/citas/{rel.id}">{rel.autor} ({rel.año}) — {rel.titulo}</a>
					<div class="tags" style="margin-top:4px">
						{#each rel.temas.filter(t => cita!.temas.includes(t)) as t}
							<span class="tag tag-shared">{t}</span>
						{/each}
					</div>
				</div>
			{/each}
		{/if}

		{#if !showConexionForm}
			<button class="btn btn-outline" onclick={() => showConexionForm = true}>
				Conectar con otra cita
			</button>
		{:else}
			<div class="conexion-form">
				<select bind:value={conexionDestinoId}>
					<option value="">Seleccionar cita...</option>
					{#each $citasStore.filter(c => c.id !== citaId) as c (c.id)}
						<option value={c.id}>{c.autor} ({c.año}) — {c.titulo}</option>
					{/each}
				</select>
				<input type="text" placeholder="Etiqueta (ej: complementa, contrasta)" bind:value={conexionEtiqueta} />
				<textarea placeholder="Comentario (opcional)" bind:value={conexionComentario} rows="2"></textarea>
				<div class="form-actions">
					<button class="btn" onclick={handleCrearConexion} disabled={guardandoConexion || !conexionDestinoId}>
						{guardandoConexion ? 'Guardando...' : 'Guardar conexión'}
					</button>
					<button class="btn btn-ghost" onclick={() => showConexionForm = false}>Cancelar</button>
				</div>
			</div>
		{/if}
	</section>

	<!-- IA -->
	<section class="section">
		<h2>IA</h2>
		<div class="ia-buttons">
			<button class="btn btn-outline" class:active={iaMode === 'puntos'} onclick={() => handleIA('puntos')}>
				Puntos clave
			</button>
			<button class="btn btn-outline" class:active={iaMode === 'uso'} onclick={() => handleIA('uso')}>
				Cómo usarla
			</button>
			<button class="btn btn-outline" class:active={iaMode === 'conexiones'} onclick={() => handleIA('conexiones')}>
				Conexiones IA
			</button>
		</div>
		{#if iaLoading}
			<div class="ia-result">
				<p class="loading">Analizando con IA...</p>
			</div>
		{:else if iaResult}
			<div class="ia-result">
				<pre>{iaResult}</pre>
			</div>
		{/if}
	</section>
{/if}

<style>
	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}
	.btn-delete {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--error);
		padding: 4px 10px;
		border: 1px solid var(--error);
		border-radius: 6px;
	}
	.detail-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 18px;
		margin-bottom: 24px;
	}
	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 2px 8px;
		border-radius: 4px;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--bg-base);
	}
	.badge-libro { background: var(--badge-libro); }
	.badge-articulo { background: var(--badge-articulo); }
	.badge-reporte { background: var(--badge-reporte); }
	.badge-tesis { background: var(--badge-tesis); }
	.badge-web { background: var(--badge-web); }
	.year {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--text-muted);
	}
	h1 {
		font-size: 1.25rem;
		line-height: 1.4;
		margin-bottom: 4px;
	}
	.autor {
		color: var(--text-secondary);
		margin-bottom: 12px;
	}
	.field {
		margin-bottom: 8px;
		font-size: 0.9375rem;
	}
	.label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 2px;
	}
	blockquote {
		border-left: 3px solid var(--accent-dim);
		padding: 10px 14px;
		margin: 12px 0;
		background: var(--bg-elevated);
		border-radius: 0 8px 8px 0;
		font-style: italic;
		font-size: 0.9375rem;
		line-height: 1.6;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 8px 0;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 2px 8px;
		border-radius: 4px;
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.tag-shared {
		border-color: var(--accent-dim);
		color: var(--accent);
	}
	.apa-box {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}
	.apa {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	/* Sections */
	.section {
		margin-bottom: 24px;
	}
	h2 {
		font-size: 1.125rem;
		margin-bottom: 12px;
		color: var(--text-secondary);
	}
	h3 {
		font-size: 0.875rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
		text-transform: uppercase;
		margin: 12px 0 8px;
	}
	.conexion-item {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 10px 12px;
		margin-bottom: 8px;
	}
	.conexion-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.conexion-tag {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--bg-elevated);
		color: var(--accent);
	}
	.conexion-comentario {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}
	.btn-link {
		font-size: 0.75rem;
		color: var(--accent);
		margin-top: 4px;
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
	}
	.comment-edit {
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.comment-actions {
		display: flex;
		gap: 8px;
	}
	.text-muted { color: var(--text-muted); }

	.conexion-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 10px;
	}
	.form-actions {
		display: flex;
		gap: 8px;
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
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-sm {
		padding: 4px 10px;
		font-size: 0.75rem;
	}
	.btn-outline {
		background: transparent;
		color: var(--accent);
		border: 1px solid var(--accent-dim);
	}
	.btn-outline.active {
		background: var(--accent);
		color: var(--bg-base);
	}
	.btn-ghost {
		background: transparent;
		color: var(--text-secondary);
	}

	.ia-buttons {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 12px;
	}
	.ia-result {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px;
	}
	.ia-result pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		line-height: 1.6;
	}
	.loading {
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
	}
	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
	}
</style>
