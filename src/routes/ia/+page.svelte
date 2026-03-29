<script lang="ts">
	import { citasStore } from '$lib/stores/data';
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
				<button class="copy-btn" onclick={() => navigator.clipboard.writeText(result)}>Copiar</button>
			</div>
			<div class="result-content">
				<pre>{result}</pre>
			</div>
		</div>
	{/if}
</div>

<style>
	h1 {
		font-size: 2.75rem;
		font-weight: 800;
		margin-bottom: 8px;
		letter-spacing: -0.04em;
		background: linear-gradient(to right, var(--accent), #fff);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.subtitle {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 40px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.consultas {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
		margin-bottom: 40px;
	}
	@media (min-width: 768px) {
		.consultas {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.consulta-card {
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: 28px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		color: inherit;
		text-align: left;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.consulta-card:hover {
		border-color: var(--accent-dim);
		background: var(--bg-elevated);
		transform: translateY(-6px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
	}
	.consulta-card.active {
		border-color: var(--accent);
		background: rgba(165, 180, 252, 0.08);
		box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.15);
	}
	.consulta-icon {
		background: var(--bg-elevated);
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		border: 1px solid var(--border);
		color: var(--accent);
	}
	.consulta-title {
		font-weight: 700;
		font-size: 1.25rem;
		margin-bottom: 8px;
		color: var(--text-primary);
	}
	.consulta-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.result-box {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 32px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
		position: relative;
	}
	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.1em;
	}
	.copy-btn {
		background: var(--bg-hover);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		transition: background 0.2s;
	}
	.copy-btn:hover {
		background: var(--accent);
		color: #000;
	}
	.result-content pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 1.15rem;
		line-height: 1.85;
		color: var(--text-primary);
	}

	.loading-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 20px;
		min-height: 200px;
	}
	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(165, 180, 252, 0.1);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
