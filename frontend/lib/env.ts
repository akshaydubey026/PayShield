// On Vercel: set NEXT_PUBLIC_API_URL to your Render backend URL (e.g. https://payshield-api.onrender.com)
// Locally: leave unset — empty string routes through Next.js rewrites to localhost:5000
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
