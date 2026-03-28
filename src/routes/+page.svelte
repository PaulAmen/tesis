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
		font-size: 1.5rem;
		font-weight: 600;
	}
	.fab {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--accent);
		color: var(--bg-base);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 300;
		text-decoration: none;
		line-height: 1;
	}
	.search-box {
		margin-bottom: 16px;
	}
	.citas-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.cita-card {
		display: block;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 14px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.2s;
	}
	.cita-card:hover {
		border-color: var(--accent-dim);
	}
	.cita-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}
	.cita-autor {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		padding: 2px 8px;
		border-radius: 4px;
		color: var(--bg-base);
		text-transform: uppercase;
		font-weight: 600;
	}
	.cita-titulo {
		font-size: 0.9375rem;
		line-height: 1.4;
		margin-bottom: 8px;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
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
	.loading, .empty {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
