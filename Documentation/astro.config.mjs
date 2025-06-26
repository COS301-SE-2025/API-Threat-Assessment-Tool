// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	image:{
		service: passthroughImageService(),
	},
	integrations: [
		starlight({
			title: 'AT-AT',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/COS301-SE-2025/API-Threat-Assessment-Tool' }],
			sidebar: [
			//	{
				//	label: 'Guides',
					//items: [
						// Each item here is one entry in the navigation menu.
					//	{ label: 'Setup Guide', slug: 'guides/example' },
					//],
				//},
				//first build, pnpm build
				//pnpx wrangler pages deploy dist
				{
					label: 'Requirements',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
