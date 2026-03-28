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
		<h1>Tesis</h1>
		<p class="subtitle">Asistente de Tesis Doctoral</p>

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
		max-width: 400px;
		text-align: center;
		padding: 40px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
	}
	.logo-wrapper {
		margin-bottom: 24px;
		display: flex;
		justify-content: center;
	}
	h1 {
		font-size: 2.25rem;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}
	.subtitle {
		color: var(--text-secondary);
		font-size: 1.125rem;
		margin-bottom: 40px;
	}
	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		background: #ffffff;
		color: #000000;
		font-weight: 600;
		padding: 16px;
		border-radius: var(--radius-md);
		font-size: 1.125rem;
		transition: transform 0.1s, opacity 0.2s, background-color 0.2s;
	}
	.btn-google:hover {
		background: #f0f0f0;
	}
	.btn-google:active {
		transform: scale(0.97);
	}
	.btn-google:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	.error {
		color: var(--error);
		font-size: 1rem;
		margin-bottom: 24px;
		background: rgba(252, 165, 165, 0.1);
		padding: 12px;
		border-radius: var(--radius-sm);
		border: 1px solid rgba(252, 165, 165, 0.2);
	}
</style>
