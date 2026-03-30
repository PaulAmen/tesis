<script lang="ts">
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { mapaTematicoGlobal, lagunasAnalisis, estructuraCap2 } from '$lib/services/ia';
	import type { Cita } from '$lib/types';
	import { fade, fly, slide } from 'svelte/transition';

	let mode = $state<'mapa' | 'lagunas' | 'estructura' | null>(null);
	let result = $state('');
	let loading = $state(false);

	async function handleConsulta(m: 'mapa' | 'lagunas' | 'estructura') {
		if ($citasStore.length === 0) {
			result = 'No hay citas cargadas. Agrega citas primero.';
			mode = m;
			return;
		}
		mode = m;
		loading = true;
		result = '';
		try {
			const citas = $citasStore.map((c: Cita) => ({
				autor: c.autor,
				año: c.año,
				titulo: c.titulo,
				temas: c.temas
			}));
			if (m === 'mapa') {
				result = await mapaTematicoGlobal(citas);
			} else if (m === 'lagunas') {
				result = await lagunasAnalisis(citas);
			} else {
				result = await estructuraCap2(citas);
			}
		} catch (e: any) {
			result = `Error: ${e.message}`;
		} finally {
			loading = false;
		}
	}
</script>

<div in:fade>
	<h1>IA Global</h1>
	<p class="subtitle">Análisis inteligente de tu biblioteca ({$citasStore.length} citas)</p>

	<div class="consultas">
		<button class="consulta-card" class:active={mode === 'mapa'} onclick={() => handleConsulta('mapa')}>
			<div class="consulta-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
			</div>
			<div class="consulta-info">
				<div class="consulta-title">Mapa Temático</div>
				<div class="consulta-desc">Conexiones y núcleos conceptuales</div>
			</div>
		</button>

		<button class="consulta-card" class:active={mode === 'lagunas'} onclick={() => handleConsulta('lagunas')}>
			<div class="consulta-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
			</div>
			<div class="consulta-info">
				<div class="consulta-title">Lagunas</div>
				<div class="consulta-desc">Vacíos y áreas que requieren más fuentes</div>
			</div>
		</button>

		<button class="consulta-card" class:active={mode === 'estructura'} onclick={() => handleConsulta('estructura')}>
			<div class="consulta-icon">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
			</div>
			<div class="consulta-info">
				<div class="consulta-title">Estructura Cap. 2</div>
				<div class="consulta-desc">Propuesta de orden narrativo y lógico</div>
			</div>
		</button>
	</div>

	{#if loading}
		<div class="result-box loading-box" in:fade>
			<div class="spinner"></div>
			<p>Procesando con Inteligencia Artificial...</p>
		</div>
	{:else if result}
		<div class="result-box" in:fly={{ y: 20, duration: 400 }}>
			<div class="result-header">
				<span>Resultado del análisis</span>
			</div>
			<div class="result-content">
				<textarea class="ia-textarea" bind:value={result} rows="12"></textarea>
				<div class="ia-buttons">
					<button class="copy-btn" onclick={() => navigator.clipboard.writeText(result).then(() => showToast('Copiado'))}>Copiar</button>
					<button class="discard-btn" onclick={() => { result = ''; mode = null; }}>Descartar</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	h1 {
		font-size: 2.5rem;
		font-weight: 900;
		margin-bottom: 8px;
		letter-spacing: -0.05em;
		background: linear-gradient(135deg, #fff 0%, var(--accent-dim) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.subtitle {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-bottom: 48px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.consultas {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		margin-bottom: 48px;
	}
	@media (min-width: 768px) {
		.consultas {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.consulta-card {
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 32px;
		background: var(--bg-surface);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		color: inherit;
		text-align: left;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		box-shadow: var(--shadow-sm);
	}
	.consulta-card:hover {
		border-color: var(--border-bright);
		background: var(--bg-hover);
		transform: translateY(-8px);
		box-shadow: var(--shadow-lg), 0 0 30px var(--accent-glow);
	}
	.consulta-card.active {
		border-color: var(--accent-dim);
		background: var(--accent-glow);
		box-shadow: 0 0 0 4px var(--accent-glow), var(--shadow-md);
	}
	.consulta-icon {
		background: var(--bg-elevated);
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		color: var(--accent);
		transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.consulta-card:hover .consulta-icon {
		transform: scale(1.1) rotate(5deg);
		background: var(--bg-hover);
		color: #fff;
	}
	.consulta-title {
		font-weight: 800;
		font-size: 1.3rem;
		margin-bottom: 10px;
		color: #fff;
	}
	.consulta-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.result-box {
		background: var(--bg-surface);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-lg);
		padding: 40px;
		box-shadow: var(--shadow-lg), 0 0 60px rgba(0, 0, 0, 0.4);
		position: relative;
	}
	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
		padding-bottom: 20px;
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.15em;
	}
	.copy-btn {
		background: var(--accent-dim);
		color: #000;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 800;
		transition: all 0.2s;
	}
	.copy-btn:hover {
		background: var(--accent);
		transform: scale(1.05);
	}
	.ia-textarea {
		width: 100%;
		min-height: 300px;
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.8;
		color: var(--text-primary);
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		resize: vertical;
	}
	.ia-textarea:focus {
		border-color: var(--accent-dim);
		background: rgba(0, 0, 0, 0.3);
	}
	.ia-buttons {
		display: flex;
		gap: 12px;
		margin-top: 24px;
	}
	.discard-btn {
		background: transparent;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		border: 1px solid var(--border);
		transition: all 0.2s;
		cursor: pointer;
	}
	.discard-btn:hover {
		color: var(--error);
		border-color: var(--error);
		background: rgba(251, 113, 133, 0.05);
	}

	.loading-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
		min-height: 300px;
	}
	.spinner {
		width: 56px;
		height: 56px;
		border: 4px solid var(--border);
		border-top-color: var(--accent-dim);
		border-radius: 50%;
		animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
