import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'eXpServer',
	description: 'Documentation for eXpServer',
	base: '/',
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
								text: 'Stage 0: Setup',
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
								text: 'Stage 3: Epoll',
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
								link: '/roadmap/phase-1/',
							},
							{
								text: 'Stage 5: Server & Client module',
								link: '/roadmap/phase-1/stage-5',
							},
							{
								text: 'Stage 6: Core & Loop module',
								link: '/roadmap/phase-1/stage-6',
							},
							{
								text: 'Stage 7: TCP module',
								link: '/roadmap/phase-1/stage-7',
							},
							{
								text: 'Stage 8: Upstream module',
								link: '/roadmap/phase-1/stage-8',
							},
							{
								text: 'Stage 9: File module',
								link: '/roadmap/phase-1/stage-9',
							},
						],
					},
					{
						text: 'Phase 2',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/roadmap/phase-2/',
							},
							{
								text: 'Stage 10: HTTP parser',
								link: '/roadmap/phase-2/stage-10',
							},
							{
								text: 'Stage 11: HTTP req & HTTP res',
								link: '/roadmap/phase-2/stage-11',
							},
							{
								text: 'Stage 12: Config & Session module',
								link: '/roadmap/phase-2/stage-12',
							},
							{
								text: 'Stage 13: HTTP Spec',
								link: '/roadmap/phase-2/stage-13',
							},
						],
					},
					{
						text: 'Phase 3',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/roadmap/phase-3/',
							},
							{
								text: 'Stage 14: IP whitelist & blacklist',
								link: '/roadmap/phase-3/stage-14',
							},
							{
								text: 'Stage 15: Directory browsing',
								link: '/roadmap/phase-3/stage-15',
							},
							{
								text: 'Stage 16: Compression',
								link: '/roadmap/phase-3/stage-16',
							},
							{
								text: 'Stage 17: Load balancing',
								link: '/roadmap/phase-3/stage-17',
							},
							{
								text: 'Stage 18: Rate limiting & timeouts',
								link: '/roadmap/phase-3/stage-18',
							},
						],
					},
					{
						text: 'Phase 4',
						collapsed: true,
						items: [
							{
								text: 'Overview',
								link: '/roadmap/phase-4/',
							},
							{
								text: 'Stage 19: TLS',
								link: '/roadmap/phase-4/stage-19',
							},
							{
								text: 'Stage 20: Caching',
								link: '/roadmap/phase-4/stage-20',
							},
							{
								text: 'Stage 21: Multiprocess',
								link: '/roadmap/phase-4/stage-21',
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
