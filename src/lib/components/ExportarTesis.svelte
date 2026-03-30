<script lang="ts">
	import { obtenerBorradores } from '$lib/services/borradores';
	import { exportarBorradores } from '$lib/services/exportService';
	import { showToast } from '$lib/stores/toast';
	import type { ExportAction } from '$lib/types';

	let abierto = $state(false);
	let accion = $state<ExportAction>('generate_pdf');
	let templateId = $state('');
	let titulo = $state('');
	let cargando = $state(false);
	let urlResultado = $state('');
	let error = $state('');

	function togglePanel() {
		abierto = !abierto;
		urlResultado = '';
		error = '';
	}

	async function handleExportar() {
		if (!templateId.trim()) {
			error = 'Ingresa el ID de la plantilla de Google Docs.';
			return;
		}
		cargando = true;
		urlResultado = '';
		error = '';
		try {
			const borradores = await obtenerBorradores();
			if (borradores.length === 0) {
				error = 'No hay borradores guardados para exportar.';
				return;
			}
			const url = await exportarBorradores(
				borradores,
				accion,
				templateId.trim(),
				titulo.trim() || undefined
			);
			urlResultado = url;
			showToast('Documento generado correctamente');
		} catch (e: any) {
			error = e.message ?? 'Error al exportar.';
			showToast(error, 'error');
		} finally {
			cargando = false;
		}
	}
</script>

<!-- Botón flotante -->
<button class="export-trigger" onclick={togglePanel} title="Exportar tesis">
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
		<polyline points="7 10 12 15 17 10"/>
		<line x1="12" y1="15" x2="12" y2="3"/>
	</svg>
	Exportar
</button>

<!-- Panel de exportación -->
{#if abierto}
	<div class="export-panel">
		<div class="panel-header">
			<h3>Exportar tesis completa</h3>
			<button class="close-btn" onclick={togglePanel}>✕</button>
		</div>

		<p class="panel-desc">
			Se exportarán todos los borradores guardados a un único documento usando tu plantilla de Google Docs.
		</p>

		<!-- Selector de formato -->
		<div class="field">
			<span class="field-label">Formato</span>
			<div class="format-selector">
				<button
					class="format-btn"
					class:active={accion === 'generate_pdf'}
					onclick={() => accion = 'generate_pdf'}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
					</svg>
					PDF
				</button>
				<button
					class="format-btn"
					class:active={accion === 'generate_doc'}
					onclick={() => accion = 'generate_doc'}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
						<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
					</svg>
					Google Doc
				</button>
			</div>
		</div>

		<!-- ID de plantilla -->
		<div class="field">
			<label for="template-id" class="field-label">ID de la plantilla</label>
			<input
				id="template-id"
				type="text"
				placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
				bind:value={templateId}
			/>
			<span class="field-hint">
				Abre tu plantilla en Google Docs y copia el ID de la URL:
				docs.google.com/document/d/<strong>[ID]</strong>/edit
			</span>
		</div>

		<!-- Título del documento -->
		<div class="field">
			<label for="doc-titulo" class="field-label">Título del documento <span class="optional">(opcional)</span></label>
			<input
				id="doc-titulo"
				type="text"
				placeholder="Mi Tesis Doctoral 2026"
				bind:value={titulo}
			/>
		</div>

		{#if error}
			<p class="error-msg">{error}</p>
		{/if}

		{#if urlResultado}
			<div class="result-box">
				<p class="result-label">✓ Documento listo</p>
				<a href={urlResultado} target="_blank" rel="noopener noreferrer" class="result-link">
					Abrir {accion === 'generate_pdf' ? 'PDF' : 'Google Doc'} →
				</a>
			</div>
		{/if}

		<button class="btn-export" onclick={handleExportar} disabled={cargando}>
			{#if cargando}
				<span class="spinner"></span> Generando documento…
			{:else}
				Exportar {accion === 'generate_pdf' ? 'PDF' : 'Google Doc'}
			{/if}
		</button>
	</div>
{/if}

<style>
	/* Botón trigger */
	.export-trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: transparent;
		color: var(--accent);
		border: 2px solid var(--accent-dim);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	.export-trigger:hover {
		background: rgba(165, 180, 252, 0.1);
	}

	/* Panel */
	.export-panel {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 28px;
		margin-top: 16px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
	}
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.125rem;
		cursor: pointer;
		line-height: 1;
		padding: 4px;
		transition: color 0.2s;
	}
	.close-btn:hover { color: var(--text-primary); }

	.panel-desc {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		margin-bottom: 24px;
		line-height: 1.5;
	}

	/* Fields */
	.field {
		margin-bottom: 20px;
	}
	.field-label {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 600;
		display: block;
		margin-bottom: 8px;
	}
	.optional {
		font-weight: 400;
		text-transform: none;
		font-family: var(--font-sans);
		font-size: 0.75rem;
	}
	.field-hint {
		display: block;
		margin-top: 6px;
		font-size: 0.8125rem;
		color: var(--text-muted);
		line-height: 1.5;
	}

	/* Format selector */
	.format-selector {
		display: flex;
		gap: 10px;
	}
	.format-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: var(--radius-md);
		border: 2px solid var(--border);
		background: var(--bg-base);
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	.format-btn.active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(165, 180, 252, 0.08);
	}
	.format-btn:hover:not(.active) {
		border-color: var(--accent-dim);
		color: var(--text-primary);
	}

	/* Result */
	.result-box {
		background: rgba(74, 222, 128, 0.08);
		border: 1px solid rgba(74, 222, 128, 0.3);
		border-radius: var(--radius-md);
		padding: 16px 20px;
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.result-label {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--success);
		font-weight: 600;
	}
	.result-link {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--success);
		text-decoration: none;
		border: 1px solid rgba(74, 222, 128, 0.4);
		padding: 6px 14px;
		border-radius: var(--radius-sm);
		transition: background 0.2s;
	}
	.result-link:hover {
		background: rgba(74, 222, 128, 0.12);
	}

	/* Error */
	.error-msg {
		font-size: 0.9rem;
		color: var(--error);
		background: rgba(252, 165, 165, 0.07);
		border: 1px solid rgba(252, 165, 165, 0.2);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		margin-bottom: 16px;
	}

	/* Export button */
	.btn-export {
		width: 100%;
		padding: 14px;
		background: var(--accent);
		color: #000;
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		transition: opacity 0.2s, transform 0.15s;
	}
	.btn-export:hover:not(:disabled) { opacity: 0.9; }
	.btn-export:active:not(:disabled) { transform: scale(0.98); }
	.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

	/* Spinner */
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
