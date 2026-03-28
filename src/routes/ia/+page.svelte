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
		font-size: 1.5rem;
		margin-bottom: 4px;
	}
	.subtitle {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-bottom: 20px;
	}
	.consultas {
		display: grid;
		grid-template-columns: 1fr;
		gap: 10px;
		margin-bottom: 20px;
	}
	@media (min-width: 768px) {
		.consultas {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.consulta-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		cursor: pointer;
		color: inherit;
		text-align: left;
		transition: border-color 0.2s;
		width: 100%;
	}
	.consulta-card:hover {
		border-color: var(--accent-dim);
	}
	.consulta-card.active {
		border-color: var(--accent);
	}
	.consulta-icon {
		font-size: 1.5rem;
		width: 36px;
		text-align: center;
		flex-shrink: 0;
	}
	.consulta-info {
		flex: 1;
	}
	.consulta-title {
		font-weight: 500;
		margin-bottom: 2px;
	}
	.consulta-desc {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}
	.result-box {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 18px;
	}
	.result-box pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		line-height: 1.7;
	}
	.loading {
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
	}
</style>
