<script lang="ts">
	import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase/config';

	const allowedEmails = (import.meta.env.VITE_ALLOWED_EMAILS ?? '')
		.split(',')
		.map((e: string) => e.trim().toLowerCase())
		.filter(Boolean);

	let error = $state('');
	let loading = $state(false);

	async function handleGoogleLogin() {
		error = '';
		loading = true;
		try {
			const cred = await signInWithPopup(auth, new GoogleAuthProvider());
			if (!allowedEmails.includes(cred.user.email?.toLowerCase() ?? '')) {
				await signOut(auth);
				error = 'No tienes acceso a esta aplicación.';
			}
		} catch (e: any) {
			if (e.code !== 'auth/popup-closed-by-user') {
				error = 'Error al iniciar sesión.';
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h1>Tesis UIIX</h1>
		<p class="subtitle">Gestor de Citas</p>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button class="btn-google" onclick={handleGoogleLogin} disabled={loading}>
			<svg width="18" height="18" viewBox="0 0 48 48">
				<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
				<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
				<path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/>
				<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
			</svg>
			{loading ? 'Ingresando...' : 'Continuar con Google'}
		</button>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
	}
	.login-card {
		width: 100%;
		max-width: 360px;
		text-align: center;
	}
	h1 {
		font-size: 1.75rem;
		font-weight: 600;
		margin-bottom: 4px;
	}
	.subtitle {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin-bottom: 32px;
	}
	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-weight: 500;
		padding: 12px;
		border-radius: 8px;
		font-size: 0.9375rem;
		transition: border-color 0.2s;
	}
	.btn-google:hover {
		border-color: var(--accent);
	}
	.btn-google:disabled {
		opacity: 0.5;
	}
	.error {
		color: var(--error);
		font-size: 0.8125rem;
		margin-bottom: 16px;
	}
</style>
