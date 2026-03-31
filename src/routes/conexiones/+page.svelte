<script lang="ts">
	import { base } from '$app/paths';
	import { citasStore, conexionesStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { eliminarConexion, obtenerConexiones } from '$lib/services/conexiones';
	import { formatAutores } from '$lib/types';
	import type { Cita, Conexion } from '$lib/types';

	let tab = $state<'temas' | 'manuales'>('temas');

	// Group citas by theme
	let temaGroups = $derived.by(() => {
		const map = new Map<string, Cita[]>();
		for (const cita of $citasStore) {
			for (const tema of cita.temas) {
				if (!map.has(tema)) map.set(tema, []);
				map.get(tema)!.push(cita);
			}
		}
		// Only show themes with 2+ citas
		return Array.from(map.entries())
			.filter(([, citas]) => citas.length >= 2)
			.sort((a, b) => b[1].length - a[1].length);
	});

	let expandedTema = $state<string | null>(null);

	function toggleTema(tema: string) {
		expandedTema = expandedTema === tema ? null : tema;
	}

	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}

	async function handleEliminar(cx: Conexion) {
		if (!confirm('¿Eliminar esta conexión?')) return;
		try {
			await eliminarConexion(cx.id);
			conexionesStore.set(await obtenerConexiones());
			showToast('Conexión eliminada');
		} catch {
			showToast('Error al eliminar', 'error');
		}
	}
</script>

<h1>Conexiones</h1>

<div class="tabs">
	<button class="tab" class:active={tab === 'temas'} onclick={() => tab = 'temas'}>Por tema</button>
	<button class="tab" class:active={tab === 'manuales'} onclick={() => tab = 'manuales'}>Manuales</button>
</div>

{#if tab === 'temas'}
	{#if temaGroups.length === 0}
		<p class="empty">No hay temas compartidos entre citas aún.</p>
	{:else}
		<div class="tema-list">
			{#each temaGroups as [tema, citas]}
				<div class="tema-accordion">
					<button class="tema-header" onclick={() => toggleTema(tema)}>
						<span class="tema-name">{tema}</span>
						<span class="tema-count">{citas.length} citas</span>
						<span class="chevron" class:open={expandedTema === tema}>&#9660;</span>
					</button>
					{#if expandedTema === tema}
						<div class="tema-body">
							{#each citas as cita (cita.id)}
								<a href="{base}/citas/{cita.id}" class="tema-cita">
									<span class="tema-cita-autor">{formatAutores(cita.autores)} ({cita.año})</span>
									<span class="tema-cita-titulo">{cita.titulo}</span>
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{:else}
	{#if $conexionesStore.length === 0}
		<p class="empty">No hay conexiones manuales.</p>
	{:else}
		<div class="conexion-list">
			{#each $conexionesStore as cx (cx.id)}
				{@const origen = getCitaById(cx.cita_origen_id)}
				{@const destino = getCitaById(cx.cita_destino_id)}
				<div class="conexion-card">
					<div class="conexion-pair">
						<a href="{base}/citas/{cx.cita_origen_id}" class="conexion-cita">
							{origen ? `${formatAutores(origen.autores)} (${origen.año})` : '(eliminada)'}
						</a>
						<span class="conexion-arrow">&rarr;</span>
						<a href="{base}/citas/{cx.cita_destino_id}" class="conexion-cita">
							{destino ? `${formatAutores(destino.autores)} (${destino.año})` : '(eliminada)'}
						</a>
					</div>
					{#if cx.etiqueta}
						<span class="conexion-etiqueta">{cx.etiqueta}</span>
					{/if}
					{#if cx.comentario}
						<p class="conexion-comentario">{cx.comentario}</p>
					{/if}
					<button class="btn-delete-sm" onclick={() => handleEliminar(cx)}>Eliminar</button>
				</div>
			{/each}
		</div>
	{/if}
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 16px;
	}
	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: 16px;
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
	}
	.tab {
		flex: 1;
		padding: 10px;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		text-transform: uppercase;
		background: var(--bg-surface);
		color: var(--text-muted);
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}
	.tab.active {
		background: var(--accent);
		color: #121212;
	}

	/* Temas */
	.tema-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 4px;
	}
	@media (min-width: 768px) {
		.tema-list {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
	}
	@media (min-width: 1280px) {
		.tema-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.tema-accordion {
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
	}
	.tema-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 12px 14px;
		background: var(--bg-surface);
		color: inherit;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
	}
	.tema-name {
		flex: 1;
		text-align: left;
		font-weight: 500;
	}
	.tema-count {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.chevron {
		font-size: 0.625rem;
		color: var(--text-muted);
		transition: transform 0.2s;
	}
	.chevron.open {
		transform: rotate(180deg);
	}
	.tema-body {
		padding: 0 14px 12px;
		background: var(--bg-surface);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.tema-cita {
		display: flex;
		flex-direction: column;
		padding: 6px 8px;
		border-radius: 6px;
		text-decoration: none;
		color: inherit;
		transition: background 0.15s;
	}
	.tema-cita:hover {
		background: var(--bg-hover);
	}
	.tema-cita-autor {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--accent);
	}
	.tema-cita-titulo {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	/* Manuales */
	.conexion-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
	}
	@media (min-width: 768px) {
		.conexion-list {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
	}
	@media (min-width: 1280px) {
		.conexion-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.conexion-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 12px 14px;
	}
	.conexion-pair {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.conexion-cita {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	.conexion-arrow {
		color: var(--text-muted);
	}
	.conexion-etiqueta {
		display: inline-block;
		margin-top: 6px;
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
	.btn-delete-sm {
		margin-top: 8px;
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		color: var(--error);
		background: none;
		border: 1px solid var(--error);
		border-radius: 4px;
		padding: 2px 8px;
		cursor: pointer;
	}

	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
