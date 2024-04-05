import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'eXpServer',
	description: 'Documentation for eXpServer',
	head: [['link', { rel: 'icon', href: '/images/icon.png' }]],
	base: '/',
	themeConfig: {
		outline: { level: 'deep' },
		// https://vitepress.dev/reference/default-theme-config
		logo: { light: '/images/logo-light.png', dark: '/images/logo-dark.png', alt: 'eXpServer' },
		siteTitle: false,

		search: {
			provider: 'local',
		},

		footer: {
			copyright: `Copyright © ${new Date().getFullYear()} National Institute of Technology Calicut`,
		},

		nav: [
			// { text: 'Home', link: '/' },
			{ text: 'Roadmap', link: '/roadmap/' },
			{ text: 'Guides', link: '/guides/' },
			{ text: 'About', link: '/about' },
			// { text: 'Feedback', link: '/feedback' },
		],

		sidebar: {
			'/guides/': [
				{
					text: 'Resources',
					collapsed: false,
					items: [
						{ text: 'Architecture', link: '/guides/resources/architecture' },
						{ text: 'File descriptors', link: '/guides/resources/file-descriptors' },
						{ text: 'Linux epoll', link: '/guides/resources/linux-epoll' },
						{ text: 'HTTP', link: '/guides/resources/http' },
						{ text: 'MIME Types', link: '/guides/resources/mime-types' },
						{
							text: 'Network Protocols & Models',
							link: '/guides/resources/network-protocols-models',
						},
						{ text: 'Sockets', link: '/guides/resources/sockets' },
						{ text: 'Internet Protocol (IP)', link: '/guides/resources/ip' },
					],
				},
				{
					text: 'References',
					collapsed: false,
					items: [
						{ text: 'vec', link: '/guides/references/vec' },
						{ text: 'xps_buffer', link: '/guides/references/xps_buffer' },
						{ text: 'xps_logger', link: '/guides/references/xps_logger' },
						{ text: 'xps_utils', link: '/guides/references/xps_utils' },
					],
				},
			],
			'/roadmap/': [
				{
					text: 'Roadmap',
					items: [
						{
							text: 'Phase 0',
							collapsed: true,
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
									text: 'Stage 21: Multiprocess Architecture',
									link: '/roadmap/phase-4/stage-21',
								},
							],
						},
					],
				},
			],
		},

		socialLinks: [{ icon: 'github', link: 'https://github.com/eXpServer' }],
	},
	sitemap: {
		hostname: 'https://expserver.github.io',
	},
})
