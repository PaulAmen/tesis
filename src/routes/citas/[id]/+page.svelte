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
		font-size: 0.9375rem;
		font-weight: 500;
	}
	.btn-delete {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--error);
		padding: 6px 12px;
		border: 1px solid var(--error);
		border-radius: var(--radius-sm);
		background: rgba(252, 165, 165, 0.05);
	}
	.detail-card {
		background: var(--bg-surface);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		margin-bottom: 32px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}
	.meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		text-transform: uppercase;
		font-weight: 700;
		color: #000;
	}
	.year {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
	h1 {
		font-size: 1.5rem;
		line-height: 1.35;
		margin-bottom: 8px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.autor {
		font-size: 1.125rem;
		color: var(--accent);
		margin-bottom: 16px;
		font-weight: 500;
	}
	.field {
		margin-bottom: 12px;
		font-size: 1rem;
		line-height: 1.5;
	}
	.label {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 4px;
		font-weight: 600;
		letter-spacing: 0.05em;
	}
	blockquote {
		border-left: 4px solid var(--accent);
		padding: 16px 20px;
		margin: 20px 0;
		background: var(--bg-elevated);
		border-radius: var(--radius-sm);
		font-style: italic;
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--text-primary);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin: 12px 0;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.tag-shared {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(165, 180, 252, 0.05);
	}
	.apa-box {
		margin-top: 24px;
		padding-top: 20px;
		border-top: 1px solid var(--border);
	}
	.apa {
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--text-secondary);
		font-style: italic;
	}

	/* Sections */
	.section {
		margin-bottom: 40px;
	}
	h2 {
		font-size: 1.5rem;
		margin-bottom: 16px;
		color: var(--text-primary);
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	h3 {
		font-size: 0.9375rem;
		font-family: var(--font-mono);
		color: var(--text-muted);
		text-transform: uppercase;
		margin: 20px 0 12px;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.conexion-item {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 16px;
		margin-bottom: 12px;
		transition: border-color 0.2s;
	}
	.conexion-item:hover {
		border-color: var(--accent-dim);
	}
	.conexion-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}
	.conexion-header a {
		font-weight: 600;
		font-size: 1rem;
	}
	.conexion-tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--accent);
		font-weight: 600;
	}
	.conexion-comentario {
		font-size: 1rem;
		color: var(--text-secondary);
		margin-top: 8px;
		line-height: 1.5;
	}
	.btn-link {
		font-size: 0.8125rem;
		color: var(--accent);
		margin-top: 8px;
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.comment-edit {
		margin-top: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.comment-actions {
		display: flex;
		gap: 12px;
	}
	.text-muted { color: var(--text-muted); }

	.conexion-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 16px;
		padding: 20px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}
	.form-actions {
		display: flex;
		gap: 12px;
	}

	.btn {
		padding: 12px 20px;
		border-radius: var(--radius-md);
		font-size: 1rem;
		font-weight: 600;
		background: var(--accent);
		color: #000;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: transform 0.1s, opacity 0.2s;
	}
	.btn:active {
		transform: scale(0.97);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-sm {
		padding: 8px 16px;
		font-size: 0.875rem;
	}
	.btn-outline {
		background: transparent;
		color: var(--accent);
		border: 2px solid var(--accent-dim);
	}
	.btn-outline.active {
		background: var(--accent);
		color: #000;
	}
	.btn-ghost {
		background: transparent;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.ia-buttons {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.ia-result {
		background: var(--bg-surface);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
	}
	.ia-result pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--text-primary);
	}
	.loading {
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
		padding: 20px 0;
	}
	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-size: 1.125rem;
	}
</style>
