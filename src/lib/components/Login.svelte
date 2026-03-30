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
		<div class="header-group">
			<h1>Tesis</h1>
			<p class="subtitle">Asistente de Tesis Doctoral</p>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button class="btn-google" onclick={handleGoogleLogin} disabled={loading}>
			{#if loading}
				<div class="spinner-sm"></div>
			{:else}
				<svg width="20" height="20" viewBox="0 0 48 48">
					<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
					<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
					<path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/>
					<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
				</svg>
			{/if}
			<span>{loading ? 'Ingresando...' : 'Continuar con Google'}</span>
		</button>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background-image: 
			radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.1) 0%, transparent 70%);
	}
	.login-card {
		width: 100%;
		max-width: 440px;
		text-align: center;
		padding: 56px 40px;
		background: var(--bg-surface);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--border-bright);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg), 0 0 60px rgba(0, 0, 0, 0.5);
		animation: cardEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}
	@keyframes cardEntry {
		from { opacity: 0; transform: translateY(20px) scale(0.98); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
	.header-group {
		margin-bottom: 48px;
	}
	h1 {
		font-size: 3.5rem;
		font-weight: 900;
		margin-bottom: 12px;
		letter-spacing: -0.05em;
		background: linear-gradient(135deg, #fff 0%, var(--accent-dim) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.subtitle {
		color: var(--text-secondary);
		font-size: 1.15rem;
		font-weight: 500;
		letter-spacing: 0.02em;
	}
	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		width: 100%;
		background: #fff;
		color: #000;
		font-weight: 700;
		padding: 18px;
		border-radius: var(--radius-md);
		font-size: 1.1rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.btn-google:hover {
		background: #f8f8ff;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
	}
	.btn-google:active {
		transform: scale(0.98);
	}
	.btn-google:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.spinner-sm {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(0, 0, 0, 0.1);
		border-top-color: #000;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.error {
		color: var(--error);
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 32px;
		background: rgba(251, 113, 133, 0.1);
		padding: 14px;
		border-radius: var(--radius-md);
		border: 1px solid rgba(251, 113, 133, 0.2);
	}
</style>
