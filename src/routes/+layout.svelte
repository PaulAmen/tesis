<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import Login from '$lib/components/Login.svelte';
	import { citasStore, conexionesStore, loadingStore } from '$lib/stores/data';
	import { userStore, authLoading } from '$lib/stores/auth';
	import { obtenerCitas } from '$lib/services/citas';
	import { obtenerConexiones } from '$lib/services/conexiones';
	import { onMount } from 'svelte';

	let { children } = $props();
	let dataLoaded = $state(false);

	$effect(() => {
		if ($userStore && !dataLoaded) {
			dataLoaded = true;
			loadData();
		}
	});

	async function loadData() {
		loadingStore.set(true);
		try {
			const [citas, conexiones] = await Promise.all([
				obtenerCitas(),
				obtenerConexiones()
			]);
			citasStore.set(citas);
			conexionesStore.set(conexiones);
		} catch (e) {
			console.error('Error cargando datos:', e);
		} finally {
			loadingStore.set(false);
		}
	}
</script>

{#if $authLoading}
	<div class="app-shell">
		<main class="content">
			<p class="loading">Cargando...</p>
		</main>
	</div>
{:else if !$userStore}
	<Login />
{:else}
	<div class="app-shell">
		<main class="content">
			{@render children()}
		</main>
		<BottomNav />
		<Toast />
	</div>
{/if}

<style>
	:global(*) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(:root) {
		--bg-base: #0f0f0f;
		--bg-surface: #1a1a1a;
		--bg-elevated: #252525;
		--bg-hover: #2a2a2a;
		--border: #333;
		--text-primary: #e8e8e8;
		--text-secondary: #a0a0a0;
		--text-muted: #666;
		--accent: #8b9cf7;
		--accent-dim: #5a6abf;
		--success: #6ee7a0;
		--error: #e76e6e;
		--warning: #e7c46e;

		--font-serif: 'Georgia', 'Times New Roman', serif;
		--font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
		--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

		--badge-libro: #6e9be7;
		--badge-articulo: #e7a06e;
		--badge-reporte: #a06ee7;
		--badge-tesis: #6ee7c4;
		--badge-web: #e76ea0;
	}

	:global(html, body) {
		background: var(--bg-base);
		color: var(--text-primary);
		font-family: var(--font-serif);
		font-size: 16px;
		line-height: 1.6;
		-webkit-font-smoothing: antialiased;
		min-height: 100vh;
	}

	:global(a) {
		color: var(--accent);
		text-decoration: none;
	}

	:global(button) {
		font-family: var(--font-sans);
		cursor: pointer;
		border: none;
		background: none;
		color: inherit;
	}

	:global(input, textarea, select) {
		font-family: var(--font-serif);
		background: var(--bg-elevated);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 0.9375rem;
		width: 100%;
		outline: none;
		transition: border-color 0.2s;
	}

	:global(input:focus, textarea:focus, select:focus) {
		border-color: var(--accent);
	}

	:global(textarea) {
		resize: vertical;
		min-height: 120px;
	}

	:global(select) {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 32px;
	}

	.app-shell {
		max-width: 480px;
		margin: 0 auto;
		min-height: 100vh;
	}

	.content {
		padding: 16px;
		padding-bottom: 80px;
	}

	.loading {
		text-align: center;
		color: var(--text-muted);
		padding: 40px 0;
		font-style: italic;
	}
</style>
