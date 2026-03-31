<script lang="ts">
	import { onMount } from 'svelte';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import { obtenerCamposPorTipo, guardarCampo, eliminarCampo, obtenerMetaCongruencia, guardarMetaCongruencia } from '$lib/services/matrices';
	import { completarCampoMatriz, verificarCongruencia } from '$lib/services/ia';
	import { MATRICES, formatAutores } from '$lib/types';
	import type { TipoMatriz, Cita } from '$lib/types';

	let tipoActual = $state<TipoMatriz>('congruencia');
	let cargando = $state(false);

	let campos = $state<Record<string, { contenido: string; citas_usadas: string[] }>>({});

	let selectorCampo = $state<string | null>(null);
	let citaBusqueda = $state('');

	let iaCampo = $state<string | null>(null);
	let iaResult = $state('');
	let iaLoading = $state(false);

	let congruenciaLoading = $state(false);
	let congruenciaResult = $state('');
	let congruenciaWarnings = $state<string[]>([]);

	let matrizInfo = $derived(MATRICES[tipoActual]);

	// --- Congruencia dynamic state ---
	let metaCounts = $state<Record<string, number>>({
		oe: 4, hipotesis: 3,
		dimension_vi: 3, dimension_vd: 3,
		indicador_vi: 6, indicador_vd: 3,
		tema_mt: 3
	});
	let conexiones = $state<Record<string, string>>({});

	// --- Selection for copy ---
	let selected = $state<Record<string, boolean>>({});
	let selectedCount = $derived(Object.values(selected).filter(Boolean).length);

	function toggleSelect(key: string) {
		selected = { ...selected, [key]: !selected[key] };
	}

	function clearSelection() {
		selected = {};
	}

	function getLabelForKey(key: string): string {
		if (tipoActual === 'congruencia') {
			const found = allCongruenciaKeys().find(c => c.key === key);
			return found?.label ?? key;
		}
		const found = matrizInfo.campos.find((c: { key: string; label: string }) => c.key === key);
		return found?.label ?? key;
	}

	function copiarTexto() {
		const keys = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
		const lines = keys.map(key => {
			const label = getLabelForKey(key);
			const contenido = campos[key]?.contenido || '(vacío)';
			const conn = conexiones[key] ? ` (-> ${getLabelForKey(conexiones[key])})` : '';
			return `${label}${conn}:\n${contenido}`;
		});
		navigator.clipboard.writeText(lines.join('\n\n'));
		showToast(`${keys.length} elementos copiados`);
	}

	function copiarCSV() {
		const keys = Object.entries(selected).filter(([_, v]) => v).map(([k]) => k);
		const header = 'Campo,Contenido,Conexión';
		const rows = keys.map(key => {
			const label = getLabelForKey(key);
			const contenido = (campos[key]?.contenido || '').replace(/"/g, '""').replace(/\n/g, ' ');
			const conn = conexiones[key] ? getLabelForKey(conexiones[key]) : '';
			return `"${label}","${contenido}","${conn}"`;
		});
		navigator.clipboard.writeText([header, ...rows].join('\n'));
		showToast(`${keys.length} elementos copiados como CSV`);
	}

	function hipotesisLabel(i: number): string {
		if (i === 1) return 'Hipótesis principal';
		if (i === 2) return 'Hipótesis nula';
		if (i === 3) return 'Hipótesis alternativa';
		return `Hipótesis ${i}`;
	}

	function allCongruenciaKeys(): { key: string; label: string }[] {
		const r: { key: string; label: string }[] = [
			{ key: 'tema', label: 'Tema' },
			{ key: 'pregunta_investigacion', label: 'Pregunta de investigación' },
			{ key: 'objetivo_general', label: 'Objetivo general' }
		];
		for (let i = 1; i <= metaCounts.oe; i++) r.push({ key: `oe_${i}`, label: `Objetivo específico ${i}` });
		for (let i = 1; i <= metaCounts.hipotesis; i++) r.push({ key: `hipotesis_${i}`, label: hipotesisLabel(i) });
		r.push({ key: 'variable_independiente', label: 'Variable independiente' });
		r.push({ key: 'variable_dependiente', label: 'Variable dependiente' });
		r.push({ key: 'conceptualizacion_vi', label: 'Conceptualización V.I.' });
		r.push({ key: 'conceptualizacion_vd', label: 'Conceptualización V.D.' });
		for (let i = 1; i <= metaCounts.dimension_vi; i++) r.push({ key: `dimension_vi_${i}`, label: `Dimensión V.I. ${i}` });
		for (let i = 1; i <= metaCounts.dimension_vd; i++) r.push({ key: `dimension_vd_${i}`, label: `Dimensión V.D. ${i}` });
		for (let i = 1; i <= metaCounts.indicador_vi; i++) r.push({ key: `indicador_vi_${i}`, label: `Indicador V.I. ${i}` });
		for (let i = 1; i <= metaCounts.indicador_vd; i++) r.push({ key: `indicador_vd_${i}`, label: `Indicador V.D. ${i}` });
		for (let i = 1; i <= metaCounts.tema_mt; i++) r.push({ key: `tema_mt_${i}`, label: `Tema marco teórico ${i}` });
		r.push({ key: 'marco_metodologico', label: 'Marco metodológico' });
		return r;
	}

	function oeOptions() {
		const opts: { value: string; label: string }[] = [];
		for (let i = 1; i <= metaCounts.oe; i++) {
			const key = `oe_${i}`;
			const preview = campos[key]?.contenido?.slice(0, 50) || `OE ${i}`;
			opts.push({ value: key, label: `OE${i}: ${preview}` });
		}
		return opts;
	}

	function dimOptions(variable: 'vi' | 'vd') {
		const opts: { value: string; label: string }[] = [];
		const count = metaCounts[`dimension_${variable}`] ?? 0;
		for (let i = 1; i <= count; i++) {
			const key = `dimension_${variable}_${i}`;
			const preview = campos[key]?.contenido?.slice(0, 50) || `Dim ${i}`;
			opts.push({ value: key, label: `Dim ${i}: ${preview}` });
		}
		return opts;
	}

	// --- Generic helpers ---
	function camposVacios(tipo: TipoMatriz): Record<string, { contenido: string; citas_usadas: string[] }> {
		const obj: Record<string, { contenido: string; citas_usadas: string[] }> = {};
		for (const c of MATRICES[tipo].campos) {
			obj[c.key] = { contenido: '', citas_usadas: [] };
		}
		return obj;
	}

	let citasFiltradas = $derived.by(() => {
		const q = citaBusqueda.toLowerCase().trim();
		if (!q) return $citasStore;
		return $citasStore.filter((c: Cita) =>
			c.autores.some(a => a.toLowerCase().includes(q)) ||
			c.titulo.toLowerCase().includes(q)
		);
	});

	// --- Load ---
	async function cargarCongruencia() {
		cargando = true;
		try {
			const meta = await obtenerMetaCongruencia();
			metaCounts = meta.counts;
			conexiones = meta.conexiones;

			const docs = await obtenerCamposPorTipo('congruencia');
			const obj: Record<string, { contenido: string; citas_usadas: string[] }> = {};
			for (const d of docs) {
				obj[d.campo] = { contenido: d.contenido, citas_usadas: d.citas_usadas };
			}
			for (const { key } of allCongruenciaKeys()) {
				if (!obj[key]) {
					obj[key] = { contenido: '', citas_usadas: [] };
				}
			}
			campos = obj;
		} catch (e) {
			console.error('Error cargando congruencia:', e);
			showToast('Error al cargar', 'error');
		} finally {
			cargando = false;
		}
	}

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
		congruenciaResult = '';
		congruenciaWarnings = [];
		selected = {};
		if (tipoActual === 'congruencia') {
			cargarCongruencia();
		} else {
			campos = camposVacios(tipoActual);
			cargarCampos();
		}
	}

	onMount(() => {
		cargarCongruencia();
	});

	// --- Save ---
	async function handleBlur(key: string) {
		const data = campos[key];
		if (!data) return;
		const tipo = tipoActual;
		try {
			await guardarCampo(tipo, key, data.contenido, data.citas_usadas);
			showToast('Guardado');
		} catch {
			showToast('Error al guardar', 'error');
		}
	}

	// --- Citas ---
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

	// --- IA ---
	async function handleIA(key: string, label: string) {
		iaCampo = key;
		iaLoading = true;
		iaResult = '';
		try {
			const data = campos[key];
			const citas = (data?.citas_usadas ?? [])
				.map(id => getCitaById(id))
				.filter((c): c is Cita => !!c)
				.map(c => ({ autor: formatAutores(c.autores), año: c.año, cita_textual: c.cita_textual }));
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

	// --- Dynamic add/remove ---
	function addField(group: string) {
		const newCount = (metaCounts[group] ?? 0) + 1;
		metaCounts = { ...metaCounts, [group]: newCount };
		const newKey = `${group}_${newCount}`;
		campos = { ...campos, [newKey]: { contenido: '', citas_usadas: [] } };
		guardarMetaCongruencia(metaCounts, conexiones);
	}

	function removeField(group: string) {
		const count = metaCounts[group] ?? 0;
		if (count <= 1) return;
		const oldKey = `${group}_${count}`;
		const newCampos = { ...campos };
		delete newCampos[oldKey];
		campos = newCampos;

		const newConexiones = { ...conexiones };
		delete newConexiones[oldKey];
		for (const [k, v] of Object.entries(newConexiones)) {
			if (v === oldKey) delete newConexiones[k];
		}
		conexiones = newConexiones;
		metaCounts = { ...metaCounts, [group]: count - 1 };

		guardarMetaCongruencia(metaCounts, conexiones);
		eliminarCampo('congruencia', oldKey).catch(() => {});
	}

	// --- Connections ---
	function setConexion(from: string, to: string) {
		if (to) {
			conexiones = { ...conexiones, [from]: to };
		} else {
			const newConexiones = { ...conexiones };
			delete newConexiones[from];
			conexiones = newConexiones;
		}
		guardarMetaCongruencia(metaCounts, conexiones);
	}

	function getConexionLabel(key: string): string {
		const target = conexiones[key];
		if (!target) return '';
		const preview = campos[target]?.contenido?.slice(0, 40);
		if (preview) return preview + '...';
		return target;
	}

	// --- Verificar congruencia ---
	async function handleVerificarCongruencia() {
		const allKeys = allCongruenciaKeys();
		const vacios = allKeys
			.filter(({ key }) => !['tema', 'pregunta_investigacion'].includes(key) && !key.startsWith('tema_mt_'))
			.filter(({ key }) => !campos[key]?.contenido?.trim());
		congruenciaWarnings = vacios.map(({ label }) => label);

		congruenciaLoading = true;
		congruenciaResult = '';
		try {
			const data: Record<string, string> = {};
			for (const { key, label } of allKeys) {
				if (!['tema', 'pregunta_investigacion'].includes(key) && !key.startsWith('tema_mt_')) {
					data[label] = campos[key]?.contenido ?? '';
				}
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

<!-- Reusable campo card snippet -->
{#snippet renderCampo(key: string, label: string, connOpts: {value: string, label: string}[] | null)}
	{#if campos[key]}
		<div class="campo-card">
			<div class="campo-top">
				<div class="campo-label-row">
					<input
						type="checkbox"
						class="campo-check"
						checked={!!selected[key]}
						onchange={() => toggleSelect(key)}
					/>
					<label class="campo-label" for="campo-{key}">{label}</label>
				</div>
				{#if connOpts}
					<select
						class="conn-select"
						value={conexiones[key] || ''}
						onchange={(e) => setConexion(key, (e.target as HTMLSelectElement).value)}
					>
						<option value="">Conectar a...</option>
						{#each connOpts as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				{/if}
			</div>

			{#if conexiones[key]}
				<div class="conn-badge">{getConexionLabel(key)}</div>
			{/if}

			<textarea
				id="campo-{key}"
				bind:value={campos[key].contenido}
				onblur={() => handleBlur(key)}
				rows="3"
				placeholder="Escribe aquí..."
			></textarea>

			<div class="campo-actions">
				<button class="btn-action" onclick={() => { selectorCampo = selectorCampo === key ? null : key; citaBusqueda = ''; }}>
					Vincular cita
				</button>
				<button class="btn-action" onclick={() => handleIA(key, label)} disabled={iaLoading && iaCampo === key}>
					{iaLoading && iaCampo === key ? 'Generando...' : 'IA: completar'}
				</button>
			</div>

			{#if selectorCampo === key}
				<div class="cita-selector">
					<input type="text" placeholder="Buscar cita..." bind:value={citaBusqueda} />
					<div class="cita-selector-list">
						{#each citasFiltradas as c (c.id)}
							<button class="cita-selector-item" onclick={() => vincularCita(key, c.id)}>
								<span class="cita-sel-autor">{formatAutores(c.autores)} ({c.año})</span>
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
								{formatAutores(c.autores)} ({c.año})
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
						<textarea class="ia-textarea" bind:value={iaResult} rows="8"></textarea>
						<div class="ia-buttons">
							<button class="btn-insert" onclick={() => insertarIA(key)}>Insertar texto</button>
							<button class="btn-discard" onclick={() => { iaResult = ''; iaCampo = null; }}>Descartar</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#if cargando}
	<p class="loading">Cargando...</p>
{:else if tipoActual === 'congruencia'}
	<!-- Custom congruencia view -->

	<div class="section-group group-general">
		<div class="group-title">Datos Generales</div>
		<div class="campos-list">
			{@render renderCampo('tema', 'Tema', null)}
			{@render renderCampo('pregunta_investigacion', 'Pregunta de investigación', null)}
		</div>
	</div>

	<div class="section-group group-general">
		<div class="campos-list single">
			{@render renderCampo('objetivo_general', 'Objetivo general', null)}
		</div>
	</div>

	<div class="section-group group-metodologico">
		<div class="group-title">
			Objetivos Específicos
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('oe')} disabled={metaCounts.oe <= 1}>−</button>
				<span class="count-badge">{metaCounts.oe}</span>
				<button class="btn-count" onclick={() => addField('oe')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.oe}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`oe_${i}`, `Objetivo específico ${i}`, null)}
			{/each}
		</div>
	</div>

	<div class="section-group group-metodologico">
		<div class="group-title">
			Hipótesis
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('hipotesis')} disabled={metaCounts.hipotesis <= 1}>−</button>
				<span class="count-badge">{metaCounts.hipotesis}</span>
				<button class="btn-count" onclick={() => addField('hipotesis')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.hipotesis}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`hipotesis_${i}`, hipotesisLabel(i), null)}
			{/each}
		</div>
	</div>

	<div class="section-group group-variables">
		<div class="group-title">Variables</div>
		<div class="campos-list">
			{@render renderCampo('variable_independiente', 'Variable independiente', null)}
			{@render renderCampo('variable_dependiente', 'Variable dependiente', null)}
		</div>
	</div>

	<div class="section-group group-variables">
		<div class="group-title">Conceptualización</div>
		<div class="campos-list">
			{@render renderCampo('conceptualizacion_vi', 'Conceptualización V.I.', null)}
			{@render renderCampo('conceptualizacion_vd', 'Conceptualización V.D.', null)}
		</div>
	</div>

	<div class="section-group group-operacional">
		<div class="group-title">
			Dimensiones — Variable Independiente
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('dimension_vi')} disabled={metaCounts.dimension_vi <= 1}>−</button>
				<span class="count-badge">{metaCounts.dimension_vi}</span>
				<button class="btn-count" onclick={() => addField('dimension_vi')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.dimension_vi}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`dimension_vi_${i}`, `Dimensión V.I. ${i}`, oeOptions())}
			{/each}
		</div>
	</div>

	<div class="section-group group-operacional">
		<div class="group-title">
			Dimensiones — Variable Dependiente
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('dimension_vd')} disabled={metaCounts.dimension_vd <= 1}>−</button>
				<span class="count-badge">{metaCounts.dimension_vd}</span>
				<button class="btn-count" onclick={() => addField('dimension_vd')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.dimension_vd}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`dimension_vd_${i}`, `Dimensión V.D. ${i}`, oeOptions())}
			{/each}
		</div>
	</div>

	<div class="section-group group-operacional">
		<div class="group-title">
			Indicadores — Variable Independiente
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('indicador_vi')} disabled={metaCounts.indicador_vi <= 1}>−</button>
				<span class="count-badge">{metaCounts.indicador_vi}</span>
				<button class="btn-count" onclick={() => addField('indicador_vi')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.indicador_vi}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`indicador_vi_${i}`, `Indicador V.I. ${i}`, dimOptions('vi'))}
			{/each}
		</div>
	</div>

	<div class="section-group group-operacional">
		<div class="group-title">
			Indicadores — Variable Dependiente
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('indicador_vd')} disabled={metaCounts.indicador_vd <= 1}>−</button>
				<span class="count-badge">{metaCounts.indicador_vd}</span>
				<button class="btn-count" onclick={() => addField('indicador_vd')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.indicador_vd}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`indicador_vd_${i}`, `Indicador V.D. ${i}`, dimOptions('vd'))}
			{/each}
		</div>
	</div>

	<div class="section-group group-marco">
		<div class="group-title">
			Temas del Marco Teórico
			<div class="group-controls">
				<button class="btn-count" onclick={() => removeField('tema_mt')} disabled={metaCounts.tema_mt <= 1}>−</button>
				<span class="count-badge">{metaCounts.tema_mt}</span>
				<button class="btn-count" onclick={() => addField('tema_mt')}>+</button>
			</div>
		</div>
		<div class="campos-list">
			{#each Array.from({length: metaCounts.tema_mt}, (_, i) => i + 1) as i (i)}
				{@render renderCampo(`tema_mt_${i}`, `Tema ${i}`, null)}
			{/each}
		</div>
	</div>

	<div class="section-group group-metodo">
		<div class="group-title">Marco Metodológico</div>
		<div class="campos-list single">
			{@render renderCampo('marco_metodologico', 'Marco metodológico', null)}
		</div>
	</div>

	<!-- Verificar congruencia -->
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
							<p class="congruencia-line" class:ok={linea.includes('✓')} class:warn={linea.includes('~')} class:bad={linea.includes('✗')}>
								{#if linea.includes('✓')}
									<span class="status-indicator">[CONGRUENTE]</span>
								{:else if linea.includes('~')}
									<span class="status-indicator">[ATENCIÓN]</span>
								{:else if linea.includes('✗')}
									<span class="status-indicator">[INCONGRUENTE]</span>
								{/if}
								{linea.replace(/[✓~✗]/g, '').trim()}
							</p>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

{:else}
	<!-- Generic view for other matrices -->
	<div class="campos-list">
		{#each matrizInfo.campos as { key, label } (key)}
			{@render renderCampo(key, label, null)}
		{/each}
	</div>
{/if}

{#if selectedCount > 0}
	<div class="selection-bar">
		<span class="sel-count">{selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}</span>
		<div class="sel-actions">
			<button class="sel-btn" onclick={copiarTexto}>Copiar texto</button>
			<button class="sel-btn" onclick={copiarCSV}>Copiar CSV</button>
			<button class="sel-btn sel-clear" onclick={clearSelection}>Limpiar</button>
		</div>
	</div>
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

	/* Section groups with subtle color differentiation */
	.section-group {
		margin-bottom: 32px;
		padding: 24px;
		background: var(--bg-surface);
		border-radius: var(--radius-lg);
		border: 1.5px solid var(--border);
		position: relative;
		overflow: hidden;
	}
	.section-group::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		background: var(--border);
	}

	/* Specific group colors - Subtle and professional pastel/desaturated */
	.group-general { border-color: rgba(142, 164, 200, 0.2); }
	.group-general::before { background: var(--accent); }
	.group-general .group-title { color: var(--accent); }

	.group-metodologico { border-color: rgba(97, 175, 239, 0.2); }
	.group-metodologico::before { background: #61afef; }
	.group-metodologico .group-title { color: #61afef; }

	.group-variables { border-color: rgba(198, 120, 221, 0.2); }
	.group-variables::before { background: #c678dd; }
	.group-variables .group-title { color: #c678dd; }

	.group-operacional { border-color: rgba(229, 192, 123, 0.2); }
	.group-operacional::before { background: var(--warning); }
	.group-operacional .group-title { color: var(--warning); }

	.group-marco { border-color: rgba(224, 108, 117, 0.2); }
	.group-marco::before { background: var(--error); }
	.group-marco .group-title { color: var(--error); }

	.group-metodo { border-color: rgba(86, 182, 194, 0.2); }
	.group-metodo::before { background: #56b6c2; }
	.group-metodo .group-title { color: #56b6c2; }

	.group-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: 1rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: 24px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}
	
	.group-controls {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	/* Campos grid */
	.campos-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}
	.campos-list.single {
		grid-template-columns: 1fr;
	}
	@media (min-width: 1024px) {
		.campos-list {
			grid-template-columns: repeat(2, 1fr);
		}
		.campos-list.single {
			grid-template-columns: 1fr;
		}
	}
	@media (min-width: 1600px) {
		.campos-list {
			grid-template-columns: repeat(3, 1fr);
		}
		.campos-list.single {
			grid-template-columns: 1fr;
		}
	}

	.campo-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
	}
	.campo-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.campo-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.campo-label {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		display: block;
		font-weight: 700;
		letter-spacing: 0.05em;
	}

	/* Connection */
	.conn-select {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 6px 28px 6px 10px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		min-width: 0;
		max-width: 220px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.conn-select:focus {
		border-color: var(--accent);
	}
	.conn-badge {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		background: rgba(165, 180, 252, 0.1);
		border: 1px solid rgba(165, 180, 252, 0.25);
		color: var(--accent);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	textarea {
		min-height: 320px;
		font-size: 1.1rem;
		line-height: 1.7;
		background: var(--bg-base);
		padding: 20px;
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
	.ia-textarea {
		width: 100%;
		min-height: 160px;
		font-family: var(--font-serif);
		font-size: 1.0625rem;
		line-height: 1.7;
		color: var(--text-primary);
		background: var(--bg-base);
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 16px;
		resize: vertical;
	}
	.ia-textarea:focus {
		border-color: var(--accent);
	}
	.ia-buttons {
		display: flex;
		gap: 10px;
		margin-top: 12px;
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
	.btn-discard {
		padding: 10px 20px;
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		font-weight: 600;
		background: transparent;
		color: var(--text-muted);
		border: 1px solid var(--border);
		cursor: pointer;
		font-family: var(--font-sans);
		transition: all 0.2s;
	}
	.btn-discard:hover {
		color: var(--error);
		border-color: var(--error);
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
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border-left: 4px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.status-indicator {
		font-weight: 800;
		font-size: 0.7rem;
		letter-spacing: 0.05em;
	}
	.congruencia-line.ok {
		border-left-color: var(--success);
	}
	.congruencia-line.ok .status-indicator {
		color: var(--success);
	}
	.congruencia-line.warn {
		border-left-color: var(--warning);
	}
	.congruencia-line.warn .status-indicator {
		color: var(--warning);
	}
	.congruencia-line.bad {
		border-left-color: var(--error);
	}
	.congruencia-line.bad .status-indicator {
		color: var(--error);
	}

	/* Checkbox & label row */
	.campo-label-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.campo-check {
		width: 24px;
		height: 24px;
		accent-color: var(--accent);
		cursor: pointer;
		flex-shrink: 0;
	}

	/* Selection floating bar */
	.selection-bar {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 16px 32px;
		background: var(--bg-surface);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--accent-dim);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg), 0 0 40px rgba(0, 0, 0, 0.6);
		z-index: 1100;
		max-width: calc(100vw - 40px);
		flex-wrap: wrap;
		justify-content: center;
	}
	.sel-count {
		font-family: var(--font-mono);
		font-size: 0.875rem;
		color: var(--accent);
		font-weight: 700;
		white-space: nowrap;
	}
	.sel-actions {
		display: flex;
		gap: 8px;
	}
	.sel-btn {
		padding: 12px 24px;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-family: var(--font-mono);
		font-weight: 800;
		background: var(--accent);
		color: #000;
		border: none;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		white-space: nowrap;
	}
	.sel-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.1);
		box-shadow: 0 4px 12px var(--accent-glow);
	}
	.sel-btn:active {
		transform: scale(0.96);
	}
	.sel-btn.sel-clear {
		background: transparent;
		color: var(--text-muted);
		border: 1px solid var(--border);
	}
	.sel-btn.sel-clear:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
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
