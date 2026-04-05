<script lang="ts">
	import { citasStore, loadingStore } from '$lib/stores/data';
	import { base } from '$app/paths';
	import { crearCita, obtenerCitas } from '$lib/services/citas';
	import { showToast } from '$lib/stores/toast';
	import { parseBibTeX } from '$lib/utils/bibtex';
	import type { Cita } from '$lib/types';
	import { formatAutores } from '$lib/types';
	import { fade, fly } from 'svelte/transition';

	let search = $state('');
	let importing = $state(false);

	let filtradas = $derived.by(() => {
		const q = search.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autores.some(a => a.toLowerCase().includes(q)) ||
			c.titulo.toLowerCase().includes(q) ||
			c.temas.some(t => t.toLowerCase().includes(q)) ||
			c.cita_textual.toLowerCase().includes(q)
		);
	});

	async function handleBibImport(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;
		const file = input.files[0];
		const text = await file.text();
		
		importing = true;
		try {
			const parsed = parseBibTeX(text);
			if (parsed.length === 0) {
				showToast('No se encontraron entradas válidas en el archivo .bib', 'error');
				return;
			}
			
			let count = 0;
			for (const entry of parsed) {
				await crearCita(entry);
				count++;
			}
			
			citasStore.set(await obtenerCitas());
			showToast(`Se importaron ${count} citas correctamente`);
		} catch (err) {
			console.error('Error importando BibTeX:', err);
			showToast('Error al procesar el archivo .bib', 'error');
		} finally {
			importing = false;
			input.value = '';
		}
	}
</script>

<div class="page-header" in:fade={{ duration: 400 }}>
	<h1>Biblioteca <span class="text-accent">Académica</span></h1>
	<div class="header-actions">
		<label class="btn-import-bib" title="Importar desde BibTeX (.bib)">
			<input type="file" accept=".bib" onchange={handleBibImport} disabled={importing} />
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="17 8 12 3 7 8"></polyline>
				<line x1="12" y1="3" x2="12" y2="15"></line>
			</svg>
			<span>{importing ? 'Importando...' : 'BibTeX'}</span>
		</label>
		<a href="{base}/nueva" class="fab" title="Nueva cita">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</a>
	</div>
</div>

<div class="search-container" in:fade={{ delay: 150, duration: 400 }}>
	<div class="search-box">
		<svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="8"></circle>
			<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
		</svg>
		<input type="text" placeholder="Buscar autores, temas o conceptos..." bind:value={search} />
	</div>
</div>

{#if $loadingStore}
	<div class="status-box" in:fade>
		<div class="spinner"></div>
		<p>Sincronizando biblioteca...</p>
	</div>
{:else if filtradas.length === 0}
	<div class="status-box empty" in:fly={{ y: 30, duration: 500 }}>
		<div class="empty-icon">
			<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
				<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
			</svg>
		</div>
		<p>
			{search ? 'No se encontraron resultados para esta búsqueda.' : 'Tu biblioteca está lista para recibir sus primeras fuentes científicas.'}
		</p>
	</div>
{:else}
	<div class="citas-grid">
		{#each filtradas as cita, i (cita.id)}
			<div in:fly={{ y: 30, delay: i * 40, duration: 500 }}>
				<a href="{base}/citas/{cita.id}" class="cita-card">
					<div class="cita-header">
						<span class="cita-autor">{formatAutores(cita.autores)} <span class="separator">/</span> {cita.año}</span>
						<span class="badge badge-{cita.tipo}">{cita.tipo}</span>
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
		gap: 12px;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.04em;
		color: var(--text-primary);
	}
	@media (min-width: 480px) {
		h1 {
			font-size: 2.2rem;
		}
		.page-header {
			margin-bottom: 32px;
		}
	}
	.text-accent {
		color: var(--accent);
	}
	.btn-import-bib {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		transition: all 0.2s;
	}
	@media (max-width: 480px) {
		.btn-import-bib span {
			display: none;
		}
	}
	.btn-import-bib:hover {
		border-color: var(--accent-dim);
		color: var(--accent);
		background: var(--bg-hover);
	}
	.btn-import-bib input {
		display: none;
	}
	.fab {
		width: 48px;
		height: 48px;
		border-radius: var(--radius-lg);
		background: var(--accent);
		color: #121212;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		box-shadow: var(--shadow-md);
		transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		flex-shrink: 0;
	}
	@media (min-width: 480px) {
		.fab {
			width: 60px;
			height: 60px;
		}
	}
	.fab:hover {
		transform: scale(1.1) translateY(-4px) rotate(90deg);
		background: #fff;
		box-shadow: var(--shadow-lg);
	}

	.search-container {
		margin-bottom: 40px;
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
	@media (min-width: 480px) {
		.search-icon {
			left: 20px;
		}
	}
	.search-box input {
		padding-left: 48px;
		height: 52px;
		font-size: 0.95rem;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-sm);
	}
	@media (min-width: 480px) {
		.search-box input {
			padding-left: 56px;
			height: 64px;
			font-size: 1.05rem;
		}
	}
	.search-box input:focus {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
		box-shadow: 0 0 0 4px var(--accent-glow), var(--shadow-md);
	}

	.citas-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
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
	@media (min-width: 1600px) {
		.citas-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.cita-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--bg-surface);
		border: 1.5px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 18px;
		text-decoration: none;
		color: inherit;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	@media (min-width: 480px) {
		.cita-card {
			padding: 28px;
		}
	}
	.cita-card:hover {
		border-color: var(--border-bright);
		background: var(--bg-hover);
		transform: translateY(-8px);
		box-shadow: var(--shadow-md);
	}

	.cita-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
		position: relative;
		z-index: 1;
	}
	.cita-autor {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	@media (min-width: 480px) {
		.cita-autor {
			font-size: 0.85rem;
		}
	}
	.separator {
		color: var(--text-muted);
		margin: 0 4px;
	}
	.cita-titulo {
		font-size: 1rem;
		line-height: 1.45;
		margin-bottom: 16px;
		font-weight: 700;
		color: var(--text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		position: relative;
		z-index: 1;
	}
	@media (min-width: 480px) {
		.cita-titulo {
			font-size: 1.2rem;
			line-height: 1.5;
			margin-bottom: 24px;
		}
	}
	.tags {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		position: relative;
		z-index: 1;
	}
	.tag {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		padding: 4px 10px;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		transition: all 0.2s;
	}
	.tag:hover {
		background: var(--accent-glow);
		color: var(--accent);
		border-color: var(--accent-dim);
	}

	.status-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100px 20px;
		text-align: center;
		color: var(--text-muted);
	}
	.empty-icon {
		margin-bottom: 24px;
		color: var(--accent-dim);
		opacity: 0.4;
	}
	.status-box p {
		max-width: 400px;
		font-size: 1.1rem;
		line-height: 1.6;
	}
	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid var(--border);
		border-top-color: var(--accent-dim);
		border-radius: 50%;
		animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		margin-bottom: 24px;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
