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
		gap: 10px;
		padding: 12px 24px;
		background: var(--bg-surface);
		color: var(--accent);
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
		margin-bottom: 24px;
	}
	.export-trigger:hover {
		background: var(--bg-hover);
		transform: translateY(-2px);
		border-color: var(--accent-dim);
		box-shadow: var(--shadow-md);
		color: var(--text-primary);
	}

	/* Panel */
	.export-panel {
		background: var(--bg-surface);
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-lg);
		padding: 32px;
		margin-top: 8px;
		margin-bottom: 32px;
		box-shadow: var(--shadow-lg);
		animation: panelEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes panelEntry {
		from { opacity: 0; transform: translateY(-10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	h3 {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}
	.close-btn {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-muted);
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.close-btn:hover { 
		color: var(--error);
		border-color: var(--error);
		background: rgba(224, 108, 117, 0.1);
	}

	.panel-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-bottom: 32px;
		line-height: 1.6;
	}

	/* Fields */
	.field {
		margin-bottom: 24px;
	}
	.field-label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		font-weight: 700;
		display: block;
		margin-bottom: 10px;
		letter-spacing: 0.1em;
	}
	.optional {
		font-weight: 400;
		text-transform: none;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		opacity: 0.7;
	}
	.field-hint {
		display: block;
		margin-top: 10px;
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.5;
		font-style: italic;
	}

	/* Format selector */
	.format-selector {
		display: flex;
		gap: 12px;
	}
	.format-btn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 14px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-secondary);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.format-btn.active {
		border-color: var(--accent-dim);
		color: var(--accent);
		background: var(--accent-glow);
	}
	.format-btn:hover:not(.active) {
		border-color: var(--text-muted);
		color: var(--text-primary);
		background: rgba(255, 255, 255, 0.05);
	}

	/* Result */
	.result-box {
		background: rgba(152, 195, 121, 0.05);
		border: 1px solid rgba(152, 195, 121, 0.2);
		border-radius: var(--radius-md);
		padding: 20px;
		margin-bottom: 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		animation: resultEntry 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes resultEntry {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}
	.result-label {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--success);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.result-link {
		font-size: 0.9rem;
		font-weight: 800;
		color: #fff;
		text-decoration: none;
		background: var(--success);
		color: #121212;
		padding: 8px 16px;
		border-radius: 6px;
		transition: all 0.2s;
	}
	.result-link:hover {
		transform: scale(1.05);
		filter: brightness(1.1);
	}

	/* Error */
	.error-msg {
		font-size: 0.85rem;
		color: var(--error);
		background: rgba(224, 108, 117, 0.05);
		border: 1px solid rgba(224, 108, 117, 0.2);
		border-radius: var(--radius-sm);
		padding: 12px 16px;
		margin-bottom: 24px;
		font-weight: 600;
	}

	/* Export button */
	.btn-export {
		width: 100%;
		padding: 16px;
		background: var(--accent);
		color: #121212;
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-md);
	}
	.btn-export:hover:not(:disabled) { 
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		filter: brightness(1.05);
	}
	.btn-export:active:not(:disabled) { transform: scale(0.98); }
	.btn-export:disabled { 
		opacity: 0.4; 
		cursor: not-allowed; 
		box-shadow: none;
		filter: grayscale(1);
	}

	/* Spinner */
	.spinner {
		width: 18px;
		height: 18px;
		border: 3px solid rgba(0, 0, 0, 0.2);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
