import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'sans-serif', padding: 40, color: '#b91c1c', background: '#fef2f2', minHeight: '100vh' }}>
          <h2>Erro na aplicação</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fca5a5' }}>
            {this.state.error.toString()}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <p style={{ marginTop: 16, color: '#666' }}>Copia este erro e partilha para diagnóstico.</p>
        </div>
      )
    }
    return this.props.children
  }
}
