import { createRoot } from 'react-dom/client'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[portfolio] React render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#05060f', color: '#f1f2f8', padding: '48px', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#e8b923', fontSize: '24px', marginBottom: '16px' }}>Portfolio could not render</h1>
          <p style={{ color: '#ff8f8f', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</p>
          <p style={{ color: '#8b90a5', marginTop: '20px' }}>Open the browser console for the component stack, then refresh after fixing the reported issue.</p>
        </div>
      )
    }
    return this.props.children
  }
}

function updateSocialMetadata() {
  if (typeof window === 'undefined') return;

  const configuredSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  const siteUrl = (configuredSiteUrl || window.location.origin).replace(/\/+$/, '');
  const imageUrl = `${siteUrl}/images/hero-portrait.jpg`;
  const profileImageUrl = `${siteUrl}/images/profile-avatar.jpg`;
  const title = 'Nazmus Sakib — ML Engineer · AI Engineer · AI Product Engineer';
  const description = 'Production-minded AI systems, bilingual NLP, LLM workflows, retrieval, full-stack engineering, and intelligent automation.';

  document.title = title;
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `${siteUrl}/`;

  const metaValues: Array<[string, string, string]> = [
    ['property', 'og:url', `${siteUrl}/`],
    ['property', 'og:image', imageUrl],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['name', 'twitter:image', imageUrl],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'description', 'Nazmus Sakib is an ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.'],
  ];

  for (const [attribute, value, content] of metaValues) {
    document.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`)?.setAttribute('content', content);
  }

  const structuredData = document.getElementById('portfolio-structured-data');
  if (structuredData) {
    structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          name: 'Nazmus Sakib',
          jobTitle: 'ML Engineer',
          description: 'ML Engineer and AI product builder working across NLP, LLMs, retrieval, full-stack systems, and intelligent automation.',
          url: `${siteUrl}/`,
          image: profileImageUrl,
          sameAs: [
            'https://github.com/Nazmussakib247',
            'https://www.linkedin.com/in/nazmussakib247/',
            'https://medium.com/@nazmussakib.cse.nubt',
          ],
        },
        {
          '@type': 'WebSite',
          name: 'Nazmus Sakib Portfolio',
          url: `${siteUrl}/`,
          description: 'Portfolio of Nazmus Sakib, an ML Engineer and AI product builder.',
        },
      ],
    });
  }
}

updateSocialMetadata();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <TRPCProvider>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111527',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f1f2f8',
          },
        }}
      />
    </TRPCProvider>
  </BrowserRouter>,
)
