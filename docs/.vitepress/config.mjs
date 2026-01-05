/**
 * VitePress Configuration for AMYGA Governance Documentation
 * @license Apache-2.0
 */

export default {
  // Site Configuration
  title: 'AMYGA Governance',
  description: 'Agentic Monitoring, Yielding Governance & Assurance',
  lang: 'en-US',
  base: '/',

  // Theme Configuration
  themeConfig: {
    nav: nav(),
    sidebar: sidebar(),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jscraik/amyga-governance' }
    ],
    footer: {
      message: 'Released under the Apache-2.0 License.',
      copyright: 'Copyright © 2025-present AMYGA'
    },
    editLink: {
      pattern: 'https://github.com/jscraik/amyga-governance/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },
    search: {
      provider: 'local'
    }
  },

  // Markdown Configuration
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // Add any markdown-it plugins here
    }
  },

  // Build Configuration
  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true
        }
      }
    }
  }
};

/**
 * Navigation menu
 */
function nav() {
  return [
    { text: 'Quickstart', link: '/QUICKSTART-5min' },
    { text: 'Tiers', link: '/TIERED-OFFERING-STRUCTURE' },
    { text: 'Guide', link: '/guide/' },
    {
      text: 'Blog',
      items: [
        { text: 'Why brAInwav?', link: '/blog/why-brainwav-2026-01-04' }
      ]
    }
  ];
}

/**
 * Sidebar menu
 */
function sidebar() {
  return {
    '/guide/': [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: '5-Minute Quickstart', link: '/QUICKSTART-5min' },
          { text: 'Installation', link: '/guide/installation' }
        ]
      },
      {
        text: 'Core Concepts',
        collapsed: false,
        items: [
          { text: 'Governance Tiers', link: '/TIERED-OFFERING-STRUCTURE' },
          { text: 'ArcTDD Workflow', link: '/guide/arctdd' },
          { text: 'Evidence Triplet', link: '/guide/evidence-triplet' },
          { text: 'Step Budget', link: '/guide/step-budget' }
        ]
      },
      {
        text: 'Configuration',
        collapsed: false,
        items: [
          { text: 'Profiles & Modes', link: '/guide/profiles' },
          { text: 'Packs System', link: '/guide/packs' },
          { text: 'CI/CD Integration', link: '/guide/cicd' }
        ]
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'CLI Commands', link: '/guide/cli-reference' },
          { text: 'Configuration File', link: '/guide/configuration' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' }
        ]
      }
    ]
  };
}
