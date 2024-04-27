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
						{ text: 'Coding Conventions', link: '/guides/resources/coding-conventions' },
						{
							text: 'TCP/IP Model',
							link: '/guides/resources/tcp-ip-model',
						},
						{ text: 'TCP', link: '/guides/resources/tcp' },
						{ text: 'Sockets', link: '/guides/resources/sockets' },
						{
							text: 'Introduction to Linux epoll',
							link: '/guides/resources/introduction-to-linux-epoll',
						},
						{ text: 'HTTP', link: '/guides/resources/http' },
						// { text: 'Internet Protocol (IP)', link: '/guides/resources/ip' },
						// { text: 'File descriptors', link: '/guides/resources/file-descriptors' },

						// { text: 'MIME Types', link: '/guides/resources/mime-types' },
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
									text: 'Stage 1: TCP Server',
									link: '/roadmap/phase-0/stage-1',
								},
								{
									text: 'Stage 2: TCP Client',
									link: '/roadmap/phase-0/stage-2',
								},
								{
									text: 'Stage 3: Linux epoll',
									link: '/roadmap/phase-0/stage-3',
								},
								{
									text: 'Stage 4: UDP Multi-threading',
									link: '/roadmap/phase-0/stage-4',
								},
								{
									text: 'Stage 5: TCP Proxy',
									link: '/roadmap/phase-0/stage-5',
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
									text: 'Stage 6: Listener & Connection Modules',
									link: '/roadmap/phase-1/stage-6',
								},
								{
									text: 'Stage 7: Core & Loop Modules',
									link: '/roadmap/phase-1/stage-7',
								},
								{
									text: 'Stage 8: Pipe Module',
									link: '/roadmap/phase-1/stage-8',
								},
								{
									text: 'Stage 9: Upstream Module',
									link: '/roadmap/phase-1/stage-9',
								},
								{
									text: 'Stage 10: File module',
									link: '/roadmap/phase-1/stage-10',
								},
								{
									text: 'Stage 11: Session Module',
									link: '/roadmap/phase-1/stage-11',
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
									text: 'Stage 12: HTTP Request Module',
									link: '/roadmap/phase-2/stage-12',
								},
								{
									text: 'Stage 13: HTTP Response Module',
									link: '/roadmap/phase-2/stage-13',
								},
								{
									text: 'Stage 14: Config Module',
									link: '/roadmap/phase-2/stage-14',
								},
								{
									text: 'Stage 15: HTTP Specification',
									link: '/roadmap/phase-2/stage-15',
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
									text: 'Stage 16: Directory Browsing',
									link: '/roadmap/phase-3/stage-16',
								},
								{
									text: 'Stage 17: IP Whitelist/Blacklist',
									link: '/roadmap/phase-3/stage-17',
								},
								{
									text: 'Stage 18: Gzip Compression',
									link: '/roadmap/phase-3/stage-18',
								},
								{
									text: 'Stage 19: Load Balancing',
									link: '/roadmap/phase-3/stage-19',
								},
								{
									text: 'Stage 20: Request timeouts',
									link: '/roadmap/phase-3/stage-20',
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
									text: 'Stage 21: Metrics',
									link: '/roadmap/phase-4/stage-21',
								},
								{
									text: 'Stage 22: Multiprocess',
									link: '/roadmap/phase-4/stage-22',
								},
								{
									text: 'Stage 23: Transport Layer Security (TLS)',
									link: '/roadmap/phase-4/stage-23',
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
