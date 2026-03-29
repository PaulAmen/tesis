<script lang="ts">
	import { citasStore, loadingStore } from '$lib/stores/data';
	import { base } from '$app/paths';
	import type { Cita } from '$lib/types';
	import { fade, fly } from 'svelte/transition';

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

<div class="page-header" in:fade={{ duration: 300 }}>
	<h1>Citas</h1>
	<a href="{base}/nueva" class="fab" title="Nueva cita">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19"></line>
			<line x1="5" y1="12" x2="19" y2="12"></line>
		</svg>
	</a>
</div>

<div class="search-container" in:fade={{ delay: 100, duration: 300 }}>
	<div class="search-box">
		<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
		</svg>
		<input type="text" placeholder="Buscar autor, tema o fragmento..." bind:value={search} />
	</div>
</div>

{#if $loadingStore}
	<div class="status-box" in:fade>
		<div class="spinner"></div>
		<p>Cargando tu biblioteca...</p>
	</div>
{:else if filtradas.length === 0}
	<div class="status-box empty" in:fly={{ y: 20, duration: 400 }}>
		<div class="empty-icon">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
				<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
			</svg>
		</div>
		<p>
			{search ? 'No encontramos coincidencias para tu búsqueda.' : 'Tu biblioteca está vacía. Comienza agregando una cita importante.'}
		</p>
	</div>
{:else}
	<div class="citas-grid">
		{#each filtradas as cita, i (cita.id)}
			<div in:fly={{ y: 20, delay: i * 50, duration: 400 }}>
				<a href="{base}/citas/{cita.id}" class="cita-card">
					<div class="cita-header">
						<span class="cita-autor">{cita.autor} • {cita.año}</span>
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
			</div>
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}
	h1 {
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		background: linear-gradient(to bottom right, #fff, var(--text-secondary));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.fab {
		width: 56px;
		height: 56px;
		border-radius: var(--radius-lg);
		background: var(--accent);
		color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		box-shadow: 0 8px 24px rgba(165, 180, 252, 0.4);
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.fab:hover {
		transform: scale(1.05) translateY(-2px);
		background: #fff;
		box-shadow: 0 12px 32px rgba(165, 180, 252, 0.5);
	}
	.fab:active {
		transform: scale(0.95);
	}

	.search-container {
		margin-bottom: 32px;
	}
	.search-box {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search-icon {
		position: absolute;
		left: 16px;
		color: var(--text-muted);
		pointer-events: none;
	}
	.search-box input {
		padding-left: 48px;
		height: 60px;
		font-size: 1.1rem;
		border-color: transparent;
		background: var(--bg-surface);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.search-box input:focus {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
		box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.15), 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.citas-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}
	@media (min-width: 768px) {
		.citas-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1200px) {
		.citas-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.cita-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		text-decoration: none;
		color: inherit;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	.cita-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 100%;
		background: transparent;
		transition: background 0.3s;
	}
	.cita-card:hover {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
		transform: translateY(-4px);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
	}
	.cita-card:hover::before {
		background: var(--accent);
	}

	.cita-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	.cita-autor {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--accent);
		letter-spacing: -0.01em;
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		padding: 4px 10px;
		border-radius: 4px;
		color: #000;
		text-transform: uppercase;
		font-weight: 800;
		letter-spacing: 0.05em;
	}
	.cita-titulo {
		font-size: 1.25rem;
		line-height: 1.4;
		margin-bottom: 20px;
		font-weight: 600;
		color: var(--text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.tags {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 2px 8px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.status-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80px 20px;
		text-align: center;
		color: var(--text-muted);
	}
	.empty-icon {
		font-size: 4rem;
		margin-bottom: 16px;
		opacity: 0.5;
	}
	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(165, 180, 252, 0.1);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 16px;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
