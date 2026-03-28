<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { crearCita, obtenerCitas } from '$lib/services/citas';
	import { citasStore } from '$lib/stores/data';
	import { showToast } from '$lib/stores/toast';
	import type { TipoCita } from '$lib/types';

	let autor = $state('');
	let año = $state(new Date().getFullYear());
	let titulo = $state('');
	let fuente = $state('');
	let cita_textual = $state('');
	let paginas = $state('');
	let tipo = $state<TipoCita>('libro');
	let temasInput = $state('');
	let notas = $state('');
	let guardando = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!autor.trim() || !titulo.trim()) {
			showToast('Autor y título son obligatorios', 'error');
			return;
		}
		guardando = true;
		try {
			const temas = temasInput.split(',').map(t => t.trim()).filter(Boolean);
			await crearCita({
				autor: autor.trim(),
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
		<label for="autor">Autor *</label>
		<input id="autor" type="text" placeholder="Apellido, N." bind:value={autor} required />
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
	.btn-primary {
		padding: 12px;
		border-radius: 10px;
		font-size: 1rem;
		font-weight: 600;
		background: var(--accent);
		color: var(--bg-base);
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
ry {
		padding: 14px 28px;
		border-radius: var(--radius-md);
		font-size: 1.0625rem;
		font-weight: 700;
		background: var(--accent);
		color: #000;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		transition: transform 0.1s, opacity 0.2s, background-color 0.2s;
		width: auto; /* Evita que se estire */
		min-width: 160px;
	}
	.btn-primary:active {
		transform: scale(0.97);
	}
	.btn-primary:hover {
		background: #b4c0ff;
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
