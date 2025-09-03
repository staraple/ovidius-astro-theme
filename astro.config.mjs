import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    output: 'static',
    site: 'https://blog.staraple.com',
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [mdx(), sitemap()],
    adapter: cloudflare({
        platformProxy: { enabled: true }
    }),
});
