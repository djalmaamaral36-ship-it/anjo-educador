import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Anjo Cuidador ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.pathname + '?v=' + Date.now();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black">
              ✨
            </div>
            <h2 className="text-lg font-bold text-slate-100">Ops! Ocorreu um contratempo inesperado</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              O sistema identificou uma falha de exibição temporária. Clique no botão abaixo para recarregar o aplicativo e continuar suas atividades normalmente.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/60 rounded-xl text-left border border-slate-800 font-mono text-[10px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg cursor-pointer"
            >
              🔄 Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
