<script lang="ts">
	import { onMount } from 'svelte';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { obtenerCamposPorTipo, guardarCampo } from '$lib/services/matrices';
	import { completarCampoMatriz } from '$lib/services/ia';
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
{/if}

<style>
	h1 {
		font-size: 1.5rem;
		margin-bottom: 16px;
		font-weight: 700;
	}

	.tipo-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 20px;
	}
	.tipo-btn {
		padding: 8px 14px;
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-family: var(--font-mono);
		background: var(--bg-surface);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all 0.2s;
	}
	.tipo-btn.active {
		background: var(--accent);
		color: #000;
		border-color: var(--accent);
		font-weight: 600;
	}

	.campos-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
	}
	@media (min-width: 768px) {
		.campos-list {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (min-width: 1280px) {
		.campos-list {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.campo-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 16px;
	}

	.campo-label {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 8px;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	textarea {
		min-height: 150px;
		font-size: 1rem;
		line-height: 1.7;
	}

	.campo-actions {
		display: flex;
		gap: 8px;
		margin-top: 10px;
		flex-wrap: wrap;
	}

	.btn-action {
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-family: var(--font-mono);
		background: transparent;
		color: var(--accent);
		border: 1px solid var(--accent-dim);
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-action:hover {
		background: rgba(165, 180, 252, 0.1);
	}
	.btn-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Cita selector */
	.cita-selector {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 10px;
		margin-top: 10px;
	}
	.cita-selector-list {
		max-height: 180px;
		overflow-y: auto;
		margin-top: 8px;
	}
	.cita-selector-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		padding: 8px;
		border: none;
		background: none;
		color: inherit;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: background 0.15s;
	}
	.cita-selector-item:hover {
		background: var(--bg-hover);
	}
	.cita-sel-autor {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--accent);
	}
	.cita-sel-titulo {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	/* Chips */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.chip-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.875rem;
		padding: 0;
		line-height: 1;
	}

	/* IA result */
	.ia-result {
		background: var(--bg-elevated);
		border: 1px solid var(--accent-dim);
		border-radius: var(--radius-sm);
		padding: 14px;
		margin-top: 10px;
	}
	.ia-result pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		font-family: var(--font-serif);
		font-size: 0.9375rem;
		line-height: 1.6;
		margin-bottom: 10px;
	}
	.btn-insert {
		padding: 6px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		background: var(--accent);
		color: #000;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
	}

	.loading {
		text-align: center;
		color: var(--text-muted);
		padding: 24px 0;
		font-style: italic;
	}
</style>
