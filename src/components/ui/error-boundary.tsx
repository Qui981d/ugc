'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * T-OPT2: Error Boundary with retry button
 * Catches rendering errors and displays a user-friendly fallback
 */

interface ErrorBoundaryProps {
    children: ReactNode
    fallbackTitle?: string
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

export class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('DashboardErrorBoundary caught:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-md mx-auto py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-[#18181B] mb-2">
                        {this.props.fallbackTitle || 'Quelque chose s\'est mal passé'}
                    </h2>
                    <p className="text-sm text-[#71717A] mb-6">
                        Une erreur inattendue est survenue. Veuillez réessayer.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#18181B] text-white rounded-xl text-sm font-medium hover:bg-[#27272A] transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Réessayer
                    </button>
                    {this.state.error && (
                        <details className="mt-4 text-left bg-[#F4F3EF] rounded-xl p-4">
                            <summary className="text-xs text-[#71717A] cursor-pointer">Détails techniques</summary>
                            <pre className="text-xs text-[#A1A1AA] mt-2 overflow-auto whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
