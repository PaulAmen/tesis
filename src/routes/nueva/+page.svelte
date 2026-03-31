<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { crearCita, obtenerCitas } from '$lib/services/citas';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import type { TipoCita } from '$lib/types';

	let autores = $state<string[]>(['']);
	let año = $state(new Date().getFullYear());
	let titulo = $state('');
	let fuente = $state('');
	let cita_textual = $state('');
	let paginas = $state('');
	let tipo = $state<TipoCita>('libro');
	let temasInput = $state('');
	let notas = $state('');
	let guardando = $state(false);

	function addAutor() { autores = [...autores, '']; }
	function removeAutor(i: number) {
		if (autores.length <= 1) return;
		autores = autores.filter((_, idx) => idx !== i);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const autoresLimpios = autores.map(a => a.trim()).filter(Boolean);
		if (autoresLimpios.length === 0 || !titulo.trim()) {
			showToast('Al menos un autor y título son obligatorios', 'error');
			return;
		}
		guardando = true;
		try {
			const temas = temasInput.split(',').map(t => t.trim()).filter(Boolean);
			await crearCita({
				autores: autoresLimpios,
				año,
				titulo: titulo.trim(),
				fuente: fuente.trim(),
				cita_textual: cita_textual.trim(),
				paginas: paginas.trim(),
				tipo,
				temas,
				notas: notas.trim()
			});
			citasStore.set(await obtenerCitas());
			showToast('Cita guardada');
			goto(`${base}/`);
		} catch {
			showToast('Error al guardar cita', 'error');
		} finally {
			guardando = false;
		}
	}
</script>

<div class="page-header">
	<a href="{base}/" class="back">&larr; Citas</a>
	<h1>Nueva cita</h1>
</div>

<form onsubmit={handleSubmit} class="form">
	<div class="field">
		<label for="tipo">Tipo</label>
		<select id="tipo" bind:value={tipo}>
			<option value="libro">Libro</option>
			<option value="articulo">Artículo</option>
			<option value="reporte">Reporte</option>
			<option value="tesis">Tesis</option>
			<option value="web">Web</option>
		</select>
	</div>

	<div class="field">
		<label>Autores *</label>
		{#each autores as _, i}
			<div class="autor-row">
				<input type="text" placeholder="Apellido, N." bind:value={autores[i]} required />
				{#if autores.length > 1}
					<button type="button" class="btn-autor-remove" onclick={() => removeAutor(i)}>&times;</button>
				{/if}
			</div>
		{/each}
		<button type="button" class="btn-autor-add" onclick={addAutor}>+ Agregar autor</button>
	</div>

	<div class="field">
		<label for="año">Año</label>
		<input id="año" type="number" min="1900" max="2100" bind:value={año} />
	</div>

	<div class="field">
		<label for="titulo">Título *</label>
		<input id="titulo" type="text" placeholder="Título de la obra" bind:value={titulo} required />
	</div>

	<div class="field">
		<label for="fuente">
			{tipo === 'libro' ? 'Editorial' : tipo === 'articulo' ? 'Revista, vol(num)' : tipo === 'tesis' ? 'Universidad' : tipo === 'web' ? 'URL' : 'Institución'}
		</label>
		<input id="fuente" type="text" bind:value={fuente} />
	</div>

	<div class="field">
		<label for="paginas">Páginas</label>
		<input id="paginas" type="text" placeholder="pp. 12-34" bind:value={paginas} />
	</div>

	<div class="field">
		<label for="cita">Cita textual</label>
		<textarea id="cita" placeholder="Texto citado literalmente..." bind:value={cita_textual} rows="4"></textarea>
	</div>

	<div class="field">
		<label for="temas">Temas (separados por coma)</label>
		<input id="temas" type="text" placeholder="metodología, educación, TIC" bind:value={temasInput} />
	</div>

	<div class="field">
		<label for="notas">Notas personales</label>
		<textarea id="notas" placeholder="Anotaciones, ideas..." bind:value={notas} rows="3"></textarea>
	</div>

	<div class="form-actions">
		<button class="btn btn-primary" type="submit" disabled={guardando}>
			{guardando ? 'Guardando...' : 'Guardar cita'}
		</button>
	</div>
</form>

<style>
	.page-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}
	.back {
		font-family: var(--font-mono);
		font-size: 0.875rem;
	}
	h1 {
		font-size: 1.25rem;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	label {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	.autor-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.autor-row input {
		flex: 1;
	}
	.btn-autor-remove {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--error);
		font-size: 1.25rem;
		cursor: pointer;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.btn-autor-remove:hover {
		border-color: var(--error);
	}
	.btn-autor-add {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		color: var(--accent);
		background: none;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		padding: 8px;
		cursor: pointer;
		width: 100%;
		margin-top: 4px;
	}
	.btn-autor-add:hover {
		border-color: var(--accent);
	}
	.btn-primary {
		padding: 12px;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		background: var(--accent);
		color: #121212;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		margin-top: 8px;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
