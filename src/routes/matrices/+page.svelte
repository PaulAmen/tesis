<script lang="ts">
	import { onMount } from 'svelte';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { obtenerCamposPorTipo, guardarCampo } from '$lib/services/matrices';
	import { completarCampoMatriz, verificarCongruencia } from '$lib/services/ia';
	import { MATRICES } from '$lib/types';
	import type { TipoMatriz, CampoMatriz, Cita } from '$lib/types';

	let tipoActual = $state<TipoMatriz>('congruencia');
	let cargando = $state(false);

	function camposVacios(tipo: TipoMatriz): Record<string, { contenido: string; citas_usadas: string[] }> {
		const obj: Record<string, { contenido: string; citas_usadas: string[] }> = {};
		for (const c of MATRICES[tipo].campos) {
			obj[c.key] = { contenido: '', citas_usadas: [] };
		}
		return obj;
	}

	let campos = $state(camposVacios('congruencia'));

	// Cita selector
	let selectorCampo = $state<string | null>(null);
	let citaBusqueda = $state('');

	// IA
	let iaCampo = $state<string | null>(null);
	let iaResult = $state('');
	let iaLoading = $state(false);

	// Congruencia
	let congruenciaLoading = $state(false);
	let congruenciaResult = $state('');
	let congruenciaWarnings = $state<string[]>([]);

	let matrizInfo = $derived(MATRICES[tipoActual]);

	let citasFiltradas = $derived.by(() => {
		const q = citaBusqueda.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autor.toLowerCase().includes(q) ||
			c.titulo.toLowerCase().includes(q)
		);
	});

	async function cargarCampos() {
		cargando = true;
		try {
			const docs = await obtenerCamposPorTipo(tipoActual);
			const obj: Record<string, { contenido: string; citas_usadas: string[] }> = {};
			for (const d of docs) {
				obj[d.campo] = { contenido: d.contenido, citas_usadas: d.citas_usadas };
			}
			for (const c of MATRICES[tipoActual].campos) {
				if (!obj[c.key]) {
					obj[c.key] = { contenido: '', citas_usadas: [] };
				}
			}
			campos = obj;
		} catch (e) {
			console.error('Error cargando campos matriz:', e);
			showToast('Error al cargar campos', 'error');
		} finally {
			cargando = false;
		}
	}

	function handleTipoChange() {
		selectorCampo = null;
		iaCampo = null;
		iaResult = '';
		campos = camposVacios(tipoActual);
		cargarCampos();
	}

	onMount(() => {
		cargarCampos();
	});

	async function handleBlur(key: string) {
		const data = campos[key];
		if (!data) return;
		try {
			await guardarCampo(tipoActual, key, data.contenido, data.citas_usadas);
			showToast('Guardado');
		} catch {
			showToast('Error al guardar', 'error');
		}
	}

	function vincularCita(key: string, citaId: string) {
		const current = campos[key];
		if (!current || current.citas_usadas.includes(citaId)) return;
		campos[key] = { ...current, citas_usadas: [...current.citas_usadas, citaId] };
		selectorCampo = null;
		citaBusqueda = '';
		guardarCampo(tipoActual, key, campos[key].contenido, campos[key].citas_usadas)
			.then(() => showToast('Cita vinculada'))
			.catch(() => showToast('Error al vincular', 'error'));
	}

	function desvincularCita(key: string, citaId: string) {
		const current = campos[key];
		if (!current) return;
		campos[key] = { ...current, citas_usadas: current.citas_usadas.filter(id => id !== citaId) };
		guardarCampo(tipoActual, key, campos[key].contenido, campos[key].citas_usadas)
			.catch(() => showToast('Error al guardar', 'error'));
	}

	function getCitaById(id: string): Cita | undefined {
		return $citasStore.find((c: Cita) => c.id === id);
	}

	async function handleIA(key: string, label: string) {
		iaCampo = key;
		iaLoading = true;
		iaResult = '';
		try {
			const data = campos[key];
			const citas = (data?.citas_usadas ?? [])
				.map(id => getCitaById(id))
				.filter((c): c is Cita => !!c)
				.map(c => ({ autor: c.autor, año: c.año, cita_textual: c.cita_textual }));
			iaResult = await completarCampoMatriz(matrizInfo.nombre, label, data?.contenido ?? '', citas);
		} catch (e: any) {
			iaResult = `Error: ${e.message}`;
		} finally {
			iaLoading = false;
		}
	}

	function insertarIA(key: string) {
		const current = campos[key];
		if (!current) return;
		const nuevo = current.contenido ? current.contenido + '\n\n' + iaResult : iaResult;
		campos[key] = { ...current, contenido: nuevo };
		iaResult = '';
		iaCampo = null;
		guardarCampo(tipoActual, key, nuevo, current.citas_usadas)
			.then(() => showToast('Texto insertado y guardado'))
			.catch(() => showToast('Error al guardar', 'error'));
	}

	const CAMPOS_CONGRUENCIA = [
		'objetivo_general', 'objetivos_especificos', 'hipotesis',
		'variable_independiente', 'variable_dependiente',
		'dimensiones_vi', 'dimensiones_vd',
		'indicadores_vi', 'indicadores_vd'
	];

	const LABELS_CONGRUENCIA: Record<string, string> = {
		objetivo_general: 'Objetivo general',
		objetivos_especificos: 'Objetivos específicos',
		hipotesis: 'Hipótesis',
		variable_independiente: 'Variable independiente',
		variable_dependiente: 'Variable dependiente',
		dimensiones_vi: 'Dimensiones V.I.',
		dimensiones_vd: 'Dimensiones V.D.',
		indicadores_vi: 'Indicadores V.I.',
		indicadores_vd: 'Indicadores V.D.'
	};

	async function handleVerificarCongruencia() {
		const vacios = CAMPOS_CONGRUENCIA.filter(k => !campos[k]?.contenido?.trim());
		congruenciaWarnings = vacios.map(k => LABELS_CONGRUENCIA[k]);

		congruenciaLoading = true;
		congruenciaResult = '';
		try {
			const data: Record<string, string> = {};
			for (const k of CAMPOS_CONGRUENCIA) {
				data[k] = campos[k]?.contenido ?? '';
			}
			congruenciaResult = await verificarCongruencia(data);
		} catch (e: any) {
			congruenciaResult = `Error: ${e.message}`;
		} finally {
			congruenciaLoading = false;
		}
	}
</script>

<h1>Matrices</h1>

<div class="tipo-selector">
	{#each Object.entries(MATRICES) as [key, info]}
		<button
			class="tipo-btn"
			class:active={tipoActual === key}
			onclick={() => { tipoActual = key as TipoMatriz; handleTipoChange(); }}
		>
			{info.nombre}
		</button>
	{/each}
</div>

{#if cargando}
	<p class="loading">Cargando...</p>
{:else}
	<div class="campos-list">
		{#each matrizInfo.campos as { key, label } (key)}
			<div class="campo-card">
				<label class="campo-label" for="campo-{key}">{label}</label>
				<textarea
					id="campo-{key}"
					bind:value={campos[key].contenido}
					onblur={() => handleBlur(key)}
					rows="3"
					placeholder="Escribe aquí..."
				></textarea>

				<div class="campo-actions">
					<button
						class="btn-action"
						onclick={() => { selectorCampo = selectorCampo === key ? null : key; citaBusqueda = ''; }}
					>
						Vincular cita
					</button>
					<button
						class="btn-action"
						onclick={() => handleIA(key, label)}
						disabled={iaLoading && iaCampo === key}
					>
						{iaLoading && iaCampo === key ? 'Generando...' : 'IA: completar'}
					</button>
				</div>

				{#if selectorCampo === key}
					<div class="cita-selector">
						<input type="text" placeholder="Buscar cita..." bind:value={citaBusqueda} />
						<div class="cita-selector-list">
							{#each citasFiltradas as c (c.id)}
								<button class="cita-selector-item" onclick={() => vincularCita(key, c.id)}>
									<span class="cita-sel-autor">{c.autor} ({c.año})</span>
									<span class="cita-sel-titulo">{c.titulo}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if campos[key].citas_usadas.length > 0}
					<div class="chips">
						{#each campos[key].citas_usadas as citaId}
							{@const c = getCitaById(citaId)}
							{#if c}
								<span class="chip">
									{c.autor} ({c.año})
									<button class="chip-remove" onclick={() => desvincularCita(key, citaId)}>&times;</button>
								</span>
							{/if}
						{/each}
					</div>
				{/if}

				{#if iaCampo === key && (iaLoading || iaResult)}
					<div class="ia-result">
						{#if iaLoading}
							<p class="loading">Analizando con IA...</p>
						{:else}
							<pre>{iaResult}</pre>
							<button class="btn-insert" onclick={() => insertarIA(key)}>Insertar texto</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	{#if tipoActual === 'congruencia'}
		<div class="congruencia-section">
			<button class="btn-congruencia" onclick={handleVerificarCongruencia} disabled={congruenciaLoading}>
				{congruenciaLoading ? 'Verificando...' : 'IA: Verificar congruencia'}
			</button>

			{#if congruenciaWarnings.length > 0}
				<div class="congruencia-warning">
					Campos vacíos: {congruenciaWarnings.join(', ')}
				</div>
			{/if}

			{#if congruenciaLoading}
				<div class="congruencia-result">
					<p class="loading">Analizando congruencia...</p>
				</div>
			{:else if congruenciaResult}
				<div class="congruencia-result">
					<div class="congruencia-header">
						<span class="label">Verificación de Congruencia</span>
						<button class="btn-close" onclick={() => { congruenciaResult = ''; congruenciaWarnings = []; }}>Cerrar</button>
					</div>
					<div class="congruencia-lines">
						{#each congruenciaResult.split('\n') as linea}
							{#if linea.trim()}
								<p class="congruencia-line" class:ok={linea.includes('✓')} class:warn={linea.includes('~')} class:bad={linea.includes('✗')}>{linea}</p>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	h1 {
		font-size: 2.25rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 24px;
	}

	.tipo-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 32px;
		background: var(--bg-surface);
		padding: 12px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
	}
	.tipo-btn {
		padding: 10px 18px;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-family: var(--font-mono);
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 500;
	}
	.tipo-btn:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}
	.tipo-btn.active {
		background: var(--accent);
		color: #000;
		font-weight: 700;
	}

	.campos-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}
	@media (min-width: 1024px) {
		.campos-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.campo-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, border-color 0.2s;
	}
	.campo-card:hover {
		border-color: var(--accent-dim);
	}

	.campo-label {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--accent);
		text-transform: uppercase;
		display: block;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	textarea {
		min-height: 180px;
		font-size: 1.0625rem;
		line-height: 1.65;
		background: var(--bg-base);
		padding: 16px;
		border-radius: var(--radius-sm);
		border: 2px solid var(--border);
	}
	textarea:focus {
		border-color: var(--accent);
	}

	.campo-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.btn-action {
		padding: 8px 16px;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-family: var(--font-mono);
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all 0.2s;
		font-weight: 600;
	}
	.btn-action:hover {
		border-color: var(--accent);
		background: var(--bg-hover);
	}
	.btn-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Cita selector */
	.cita-selector {
		background: var(--bg-surface);
		border: 2px solid var(--accent-dim);
		border-radius: var(--radius-md);
		padding: 16px;
		margin-top: 4px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.cita-selector input {
		margin-bottom: 12px;
	}
	.cita-selector-list {
		max-height: 220px;
		overflow-y: auto;
	}
	.cita-selector-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		padding: 12px;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background 0.2s;
		border-bottom: 1px solid var(--border);
	}
	.cita-selector-item:last-child {
		border-bottom: none;
	}
	.cita-selector-item:hover {
		background: var(--bg-hover);
	}
	.cita-sel-autor {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--accent);
		font-weight: 600;
	}
	.cita-sel-titulo {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	/* Chips */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		padding: 4px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		font-weight: 500;
	}
	.chip-remove {
		background: none;
		border: none;
		color: var(--error);
		cursor: pointer;
		font-size: 1.125rem;
		padding: 0;
		line-height: 1;
		margin-left: 4px;
	}

	/* IA result */
	.ia-result {
		background: var(--bg-base);
		border: 2px solid var(--accent);
		border-radius: var(--radius-md);
		padding: 20px;
		margin-top: 4px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}
	.ia-result pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 1.0625rem;
		line-height: 1.7;
		margin-bottom: 16px;
		color: var(--text-primary);
	}
	.btn-insert {
		padding: 10px 20px;
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		font-weight: 700;
		background: var(--accent);
		color: #000;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: transform 0.1s;
	}
	.btn-insert:active {
		transform: scale(0.96);
	}

	/* Congruencia */
	.congruencia-section {
		margin-top: 32px;
	}
	.btn-congruencia {
		width: 100%;
		padding: 16px;
		border-radius: var(--radius-md);
		font-size: 1.0625rem;
		font-weight: 700;
		font-family: var(--font-sans);
		background: var(--bg-surface);
		color: var(--warning);
		border: 2px solid var(--warning);
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-congruencia:hover {
		background: rgba(253, 224, 71, 0.1);
	}
	.btn-congruencia:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.congruencia-warning {
		margin-top: 12px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		background: rgba(253, 224, 71, 0.1);
		border: 1px solid rgba(253, 224, 71, 0.3);
		color: var(--warning);
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	.congruencia-result {
		margin-top: 16px;
		background: var(--bg-base);
		border: 2px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
	}
	.congruencia-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	.btn-close {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		background: none;
		border: none;
		cursor: pointer;
	}
	.congruencia-lines {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.congruencia-line {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		line-height: 1.5;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border-left: 3px solid var(--border);
	}
	.congruencia-line.ok {
		border-left-color: var(--success);
		color: var(--success);
	}
	.congruencia-line.warn {
		border-left-color: var(--warning);
		color: var(--warning);
	}
	.congruencia-line.bad {
		border-left-color: var(--error);
		color: var(--error);
	}

	.loading {
		text-align: center;
		color: var(--accent);
		padding: 40px 0;
		font-style: italic;
		font-size: 1.125rem;
		font-weight: 600;
	}
</style>
