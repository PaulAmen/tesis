<script lang="ts">
	import { citasStore, loadingStore } from '$lib/stores/data';
	import { base } from '$app/paths';
	import type { Cita } from '$lib/types';

	let search = $state('');

	const badgeColors: Record<string, string> = {
		libro: 'var(--badge-libro)',
		articulo: 'var(--badge-articulo)',
		reporte: 'var(--badge-reporte)',
		tesis: 'var(--badge-tesis)',
		web: 'var(--badge-web)'
	};

	let filtradas = $derived.by(() => {
		const q = search.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autor.toLowerCase().includes(q) ||
			c.titulo.toLowerCase().includes(q) ||
			c.temas.some(t => t.toLowerCase().includes(q)) ||
			c.cita_textual.toLowerCase().includes(q)
		);
	});
</script>

<div class="page-header">
	<h1>Citas</h1>
	<a href="{base}/nueva" class="fab" title="Nueva cita">+</a>
</div>

<div class="search-box">
	<input type="text" placeholder="Buscar por autor, tema o texto..." bind:value={search} />
</div>

{#if $loadingStore}
	<p class="loading">Cargando citas...</p>
{:else if filtradas.length === 0}
	<p class="empty">
		{search ? 'Sin resultados para la búsqueda.' : 'No hay citas aún. Agrega la primera.'}
	</p>
{:else}
	<div class="citas-list">
		{#each filtradas as cita (cita.id)}
			<a href="{base}/citas/{cita.id}" class="cita-card">
				<div class="cita-header">
					<span class="cita-autor">{cita.autor} ({cita.año})</span>
					<span class="badge" style="background: {badgeColors[cita.tipo] ?? 'var(--border)'}">{cita.tipo}</span>
				</div>
				<div class="cita-titulo">{cita.titulo}</div>
				{#if cita.temas.length > 0}
					<div class="tags">
						{#each cita.temas as tema}
							<span class="tag">{tema}</span>
						{/each}
					</div>
				{/if}
			</a>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	h1 {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.fab {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: var(--accent);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.75rem;
		font-weight: 400;
		text-decoration: none;
		line-height: 1;
		box-shadow: 0 4px 12px rgba(165, 180, 252, 0.3);
		transition: transform 0.1s, background-color 0.2s;
	}
	.fab:active {
		transform: scale(0.92);
	}
	.search-box {
		margin-bottom: 24px;
	}
	.citas-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}
	@media (min-width: 768px) {
		.citas-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1024px) {
		.citas-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (min-width: 1440px) {
		.citas-list {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.cita-card {
		display: block;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 18px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.2s, background-color 0.2s, transform 0.1s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	.cita-card:hover {
		border-color: var(--accent);
		background: var(--bg-elevated);
	}
	.cita-card:active {
		transform: scale(0.99);
	}
	.cita-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.cita-autor {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--accent);
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		color: #000;
		text-transform: uppercase;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	.cita-titulo {
		font-size: 1.125rem;
		line-height: 1.45;
		margin-bottom: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 3px 10px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.loading, .empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
