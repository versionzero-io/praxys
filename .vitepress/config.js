import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Praxys",
  description: "Documentation for Praxys, a lightweight, plugin-based reactive state management library",
  srcDir: 'docs',
  base: '/praxys/',
  head: [
    ['link', { rel: 'icon', href: '/favicon-light.svg', media: '(prefers-color-scheme: light)' }],
    ['link', { rel: 'icon', href: '/favicon-dark.svg', media: '(prefers-color-scheme: dark)' }]
  ],
  themeConfig: {
    siteTitle: 'Praxys',
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg'
    },
    nav: [
      { text: 'Guides', link: '/guides/get-started' },
      { text: 'API', link: '/api/core/praxys' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Guides',
          collapsed: false,
          items: [
            { text: 'Get Started', link: '/guides/get-started' },
            { text: 'Config Patterns', link: '/guides/config-patterns' },
            { text: 'Creating Plugins', link: '/guides/creating-plugins' },
            { text: 'Understanding Reactivity', link: '/guides/understanding-reactivity' },
            { text: 'Performance Optimization', link: '/guides/performance-optimization' },
          ]
        },
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            {
              text: 'Core',
              collapsed: false,
              items: [
                { text: 'praxys()', link: '/api/core/praxys' },
                { text: 'config()', link: '/api/core/config' },
                { text: 'register()', link: '/api/core/register' },
              ]
            },
            {
              text: 'Reactivity',
              collapsed: false,
              items: [
                { text: 'watch()', link: '/api/reactivity/watch' },
                { text: 'batch()', link: '/api/reactivity/batch' },
                { text: 'ignore()', link: '/api/reactivity/ignore' },
              ]
            },
            {
              text: 'Configuration',
              collapsed: false,
              items: [
                { text: 'extend()', link: '/api/config/extend' },
                { text: 'target()', link: '/api/config/target' },
                { text: 'use()', link: '/api/config/use' },
              ]
            },
            {
              text: 'Plugin System',
              collapsed: false,
              items: [
                { text: 'Plugin Creation', link: '/api/plugins/creation' },
                { text: 'Plugin Registration', link: '/api/plugins/registration' },
                { text: 'Plugin Types', link: '/api/plugins/types' },
              ]
            },
            {
              text: 'Types',
              collapsed: false,
              items: [
                { text: 'Ref<T>', link: '/api/types/ref' },
                { text: 'Core Types', link: '/api/types/core' },
              ]
            }
          ]
        },
        {
          text: 'Cheat Sheet',
          link: '/cheat-sheet'
        }
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/praxys/praxys' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Praxys Team'
    },
    outline: 'deep',
    docFooter: {
      prev: 'Previous Page',
      next: 'Next Page'
    }
  }
}) 