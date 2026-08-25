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
