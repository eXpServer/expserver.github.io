import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'eXpServer',
	description: 'Documentation for eXpServer',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		logo: '/assets/icon.png',

		search: {
			provider: 'local',
		},

		footer: {
			copyright: `Copyright © ${new Date().getFullYear()} National Institute of Technology Calicut`,
		},

		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Roadmap', link: '/markdown-examples' },
			{ text: 'References', link: '/markdown-examples' },
			{ text: 'Resources', link: '/markdown-examples' },
			{ text: 'About', link: '/markdown-examples' },
			{ text: 'Feedback', link: '/markdown-examples' },
		],

		sidebar: [
			{
				text: 'Roadmap',
				items: [
					{
						text: 'Phase 0',
						collapsed: false,
						items: [
							{
								text: 'Overview',
								link: '/roadmap/phase-0/',
							},
							{
								text: 'Stage 0: Installation and Setup',
								link: '/roadmap/phase-0/stage-0.md',
							},
							{
								text: 'Stage 1: TCP server',
								link: '/roadmap/phase-0/stage-1',
							},
							{
								text: 'Stage 2: TCP client',
								link: '/roadmap/phase-0/stage-2',
							},
							{
								text: 'Stage 3: epoll',
								link: '/roadmap/phase-0/stage-3',
							},
							{
								text: 'Stage 4: TCP proxy',
								link: '/roadmap/phase-0/stage-4',
							},
						],
					},
					{
						text: 'Phase 1',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/api-examples',
							},
							{
								text: 'Stage 5: Server and Client module',
								link: '/api-examples',
							},
							{
								text: 'Stage 6: Core & Loop module',
								link: '/api-examples',
							},
							{
								text: 'Stage 7: TCP module',
								link: '/api-examples',
							},
							{
								text: 'Stage 8: Upstream module',
								link: '/api-examples',
							},
							{
								text: 'Stage 9: File module',
								link: '/api-examples',
							},
						],
					},
					{
						text: 'Phase 2',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/api-examples',
							},
							{
								text: 'Stage 10: HTTP parser & HTTP req',
								link: '/api-examples',
							},
							{
								text: 'Stage 11: HTTP res',
								link: '/api-examples',
							},
							{
								text: 'Stage 12: Config & Session module',
								link: '/api-examples',
							},
							{
								text: 'Stage 13: HTTP Spec',
								link: '/api-examples',
							},
						],
					},
					{
						text: 'Phase 3',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/api-examples',
							},
							{
								text: 'Stage 14: IP whitelist & blacklist',
								link: '/api-examples',
							},
							{
								text: 'Stage 15: Directory browsing',
								link: '/api-examples',
							},
							{
								text: 'Stage 16: Compression',
								link: '/api-examples',
							},
							{
								text: 'Stage 17: Load balancing',
								link: '/api-examples',
							},
							{
								text: 'Stage 18: Rate limiting & timeouts',
								link: '/api-examples',
							},
						],
					},
					{
						text: 'Phase 4',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/api-examples',
							},
							{
								text: 'Stage 19: TLS',
								link: '/api-examples',
							},
							{
								text: 'Stage 20: Caching',
								link: '/api-examples',
							},
							{
								text: 'Stage 21: Multiprocess',
								link: '/api-examples',
							},
						],
					},
				],
			},
		],

		socialLinks: [{ icon: 'github', link: 'https://github.com/eXpServer' }],
	},
	sitemap: {
		hostname: 'https://expserver.github.io',
	},
})
