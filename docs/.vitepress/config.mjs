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
						{ text: 'GDB', link: '/guides/resources/gdb' },
						{ text: 'TCP Socket Programming', link: '/guides/resources/tcp-socket-programming' },
						{ text: 'UDP Socket Programming', link: '/guides/resources/udp-socket-programming' },
						{ text: 'Process and Threads', link: '/guides/resources/process-and-threads' },
						{ text: 'System Calls', link: '/guides/resources/system-calls' },
						{
							text: 'Introduction to Linux epoll',
							link: '/guides/resources/introduction-to-linux-epoll',
						},
						
						{
							text: 'Linux epoll',
							link: '/guides/resources/linux-epoll',
						},
						{
							text: 'Blocking & Non-Blocking Sockets',
							link: '/guides/resources/blocking-and-non-blocking-sockets',
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
						{ text: 'xps_logger', link: '/guides/references/xps_logger' },
						{ text: 'xps_buffer', link: '/guides/references/xps_buffer' },
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
									text: 'Stage 3: UDP Multi-threading',
									link: '/roadmap/phase-0/stage-3',
								},
								{
									text: 'Stage 4: Linux epoll',
									link: '/roadmap/phase-0/stage-4',

								},
								{
									text: 'Stage 5 a): TCP Proxy',
									link: '/roadmap/phase-0/stage-5-a',
								},
								{
									text: 'Stage 5 b): File Transfer using TCP',
									link: '/roadmap/phase-0/stage-5-b',
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
									text: 'Stage 8: Non-Blocking Sockets',
									link: '/roadmap/phase-1/stage-8',
								},
								{
									text: 'Stage 9: epoll Edge Triggered',
									link: '/roadmap/phase-1/stage-9',
								},
								{
									text: 'Stage 10: Pipe Module',
									link: '/roadmap/phase-1/stage-10',
								},
								{
									text: 'Stage 11: Upstream Module',
									link: '/roadmap/phase-1/stage-11',
								},
								{
									text: 'Stage 12: File module',
									link: '/roadmap/phase-1/stage-12',
								},
								{
									text: 'Stage 13: Session Module',
									link: '/roadmap/phase-1/stage-13',
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
									text: 'Stage 14: HTTP Request Module',
									link: '/roadmap/phase-2/stage-14',
								},
								{
									text: 'Stage 15: HTTP Response Module',
									link: '/roadmap/phase-2/stage-15',
								},
								{
									text: 'Stage 16: Config Module',
									link: '/roadmap/phase-2/stage-16',
								},
								{
									text: 'Stage 17: Directory Browsing',
									link: '/roadmap/phase-2/stage-17',
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
									text: 'Stage 18: IP Whitelist/Blacklist',
									link: '/roadmap/phase-3/stage-18',
								},
								{
									text: 'Stage 19: Gzip Compression',
									link: '/roadmap/phase-3/stage-19',
								},
								{
									text: 'Stage 20: Load Balancing',
									link: '/roadmap/phase-3/stage-20',
								},
								{
									text: 'Stage 21: Request timeouts',
									link: '/roadmap/phase-3/stage-21',
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
									text: 'Stage 22: Metrics',
									link: '/roadmap/phase-4/stage-22',
								},
								{
									text: 'Stage 23: Multiprocess',
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
