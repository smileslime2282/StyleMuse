# StyleMuse — public AI hair stylist MVP

A responsive Next.js starter for a public, multilingual, freemium hairstyle-advice website.

## Included
- Responsive editorial-style landing page and hair profile form
- Photo upload preview (JPEG, PNG, WebP; 8 MB server limit)
- Real image analysis through the OpenAI Responses API (server-side only)
- Structured hairstyle recommendation, home styling steps, tool list and salon request
- 15 UI languages: English, German, Serbian, Spanish, French, Italian, Portuguese, Dutch, Polish, Turkish, Arabic, Hindi, Japanese, Korean and Chinese
- No photo storage in the app; API route sends the uploaded image to the configured AI provider for analysis and returns `Cache-Control: no-store`

## Run locally
1. Install Node.js 20+.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Put your API key in `.env.local` as `OPENAI_API_KEY=...`.
5. Run `npm run dev` and open http://localhost:3000.

Never put an API key in browser code or commit `.env.local`.

## Deploy publicly
Deploy the project to Vercel or another Node.js host:
1. Push this folder to a private Git repository.
2. Import it into your hosting provider.
3. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as server environment variables.
4. Deploy and test uploads, mobile layout, and error handling.
5. Add a custom domain, privacy notice, terms, cookie/analytics consent if analytics are added, and a support contact before public launch.

## Before taking payments
This is a prototype, not a production-ready paid service. Add authentication, a database for accounts and saved plans (only if users opt in), subscription checkout and webhook verification, rate limiting, abuse prevention, monitoring, accessibility review, and a clear retention/deletion process. Keep face photos out of logs and storage by default. Obtain explicit consent before sending photos to an AI provider and publish an accurate privacy policy describing the provider and processing.

## Important product limitation
The AI route analyzes one uploaded photo and returns styling advice. It does **not** yet render a realistic hairstyle onto the user's own face, detect hair strand density with clinical accuracy, or provide video tutorials. Those are separate future features and need dedicated image-editing/video generation workflows and user consent. The starter includes UI translations in 15 languages. AI-generated recommendations are requested in the selected language; review translations with native speakers before commercial launch.
