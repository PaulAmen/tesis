/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Amplía los tipos de las variables de entorno públicas de SvelteKit.
// Ejecuta `svelte-kit sync` después de añadir PUBLIC_GAS_WEB_APP_URL a tu .env
// para que este módulo se regenere automáticamente.
declare module '$env/static/public' {
	/** URL de despliegue del Web App de Google Apps Script. */
	const PUBLIC_GAS_WEB_APP_URL: string;
	export { PUBLIC_GAS_WEB_APP_URL };
}

export {};
