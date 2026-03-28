<script lang="ts">
	import { citasStore } from '$lib/stores/data';
	import { mapaTematicoGlobal, lagunasAnalisis, estructuraCap2 } from '$lib/services/ia';
	import type { Cita } from '$lib/types';

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

<h1>IA Global</h1>
<p class="subtitle">Análisis inteligente de todas tus citas ({$citasStore.length} cargadas)</p>

<div class="consultas">
	<button class="consulta-card" class:active={mode === 'mapa'} onclick={() => handleConsulta('mapa')}>
		<div class="consulta-icon">&#9673;</div>
		<div class="consulta-info">
			<div class="consulta-title">Mapa temático</div>
			<div class="consulta-desc">Temas principales y cómo se conectan</div>
		</div>
	</button>

	<button class="consulta-card" class:active={mode === 'lagunas'} onclick={() => handleConsulta('lagunas')}>
		<div class="consulta-icon">&#9888;</div>
		<div class="consulta-info">
			<div class="consulta-title">Lagunas</div>
			<div class="consulta-desc">Secciones con pocas citas, qué falta buscar</div>
		</div>
	</button>

	<button class="consulta-card" class:active={mode === 'estructura'} onclick={() => handleConsulta('estructura')}>
		<div class="consulta-icon">&#9776;</div>
		<div class="consulta-info">
			<div class="consulta-title">Estructura Cap. 2</div>
			<div class="consulta-desc">Orden sugerido para los Fundamentos Teóricos</div>
		</div>
	</button>
</div>

{#if loading}
	<div class="result-box">
		<p class="loading">Analizando con IA...</p>
	</div>
{:else if result}
	<div class="result-box">
		<pre>{result}</pre>
	</div>
{/if}

<style>
	h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.04em;
	}
	.subtitle {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--text-secondary);
		margin-bottom: 40px;
		font-weight: 500;
	}
	.consultas {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
		margin-bottom: 32px;
	}
	@media (min-width: 768px) {
		.consultas {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.consulta-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
		padding: 24px;
		background: var(--bg-surface);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		color: inherit;
		text-align: left;
		transition: all 0.2s;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	.consulta-card:hover {
		border-color: var(--accent);
		background: var(--bg-elevated);
		transform: translateY(-4px);
	}
	.consulta-card.active {
		border-color: var(--accent);
		background: rgba(165, 180, 252, 0.05);
		box-shadow: 0 0 0 4px rgba(165, 180, 252, 0.1);
	}
	.consulta-icon {
		font-size: 2rem;
		background: var(--bg-elevated);
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}
	.consulta-info {
		flex: 1;
	}
	.consulta-title {
		font-weight: 700;
		font-size: 1.25rem;
		margin-bottom: 6px;
		color: var(--text-primary);
	}
	.consulta-desc {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}
	.result-box {
		background: var(--bg-surface);
		border: 2px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 24px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}
	.result-box pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-primary);
	}
	.loading {
		text-align: center;
		color: var(--accent);
		font-style: italic;
		font-size: 1.125rem;
		padding: 20px 0;
		font-weight: 600;
	}
</style>
