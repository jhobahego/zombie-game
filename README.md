# Zombie Game (Next.js App Router)

App de historia interactiva con generación de texto, imágenes y audio (Gemini + Google TTS).

## Requisitos

- Node 20+ y pnpm
- Variables de entorno (no se versionan):
  - `GOOGLE_CREDENTIALS` (JSON completo de la cuenta de servicio) **o** `GOOGLE_CREDENTIALS_BASE64` (mismo JSON en base64)
  - `GEMINI_API_KEY`
  - Opcional: `GOOGLE_API_KEY` si usas otros endpoints de Google

Ejemplo de `.env.local` (no lo subas al repo):

```env
GOOGLE_CREDENTIALS='{"type":"service_account",...}'
GEMINI_API_KEY=tu_api_key
```

## Desarrollo local

```bash
pnpm install
pnpm dev
# abre http://localhost:3000
```

## Despliegue en Vercel (CLI)

1) Inicia sesión: `vercel login`
2) Añade la credencial como variable segura (pega el JSON completo o en base64):

```bash
vercel env add GOOGLE_CREDENTIALS production
vercel env add GOOGLE_CREDENTIALS preview
vercel env add GOOGLE_CREDENTIALS development
# si usas base64: vercel env add GOOGLE_CREDENTIALS_BASE64 production
```

3) Despliega:

```bash
vercel --prod
```

Notas de seguridad:

- No comitees el archivo JSON ni `.env*`.
- Si la clave se expuso, rota la llave en IAM y vuelve a subir la nueva a Vercel.

## Rutas y credenciales

- Las rutas API usan runtime Node (`runtime = "nodejs"`).
- Antes de crear el cliente de Google TTS se escribe el JSON de la cuenta de servicio en `/tmp/gcloud-key.json` y se exporta `GOOGLE_APPLICATION_CREDENTIALS` automáticamente (helper `src/lib/ensure-gcloud-key.ts`).

## Scripts útiles

- `pnpm lint` – Biome
- `pnpm build` – build de producción
- `pnpm dev` – modo desarrollo
