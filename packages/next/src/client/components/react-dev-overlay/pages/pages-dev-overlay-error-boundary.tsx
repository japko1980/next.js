import React from 'react'

type PagesDevOverlayErrorBoundaryProps = {
  children?: React.ReactNode
  onError: (error: Error, componentStack: string | null) => void
}
type PagesDevOverlayErrorBoundaryState = { error: Error | null }

export class PagesDevOverlayErrorBoundary extends React.PureComponent<
  PagesDevOverlayErrorBoundaryProps,
  PagesDevOverlayErrorBoundaryState
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(
    error: Error,
    // Loosely typed because it depends on the React version and was
    // accidentally excluded in some versions.
    errorInfo?: { componentStack?: string | null }
  ) {
    this.props.onError(error, errorInfo?.componentStack || null)
    this.setState({ error })
  }

  // Explicit type is needed to avoid the generated `.d.ts` having a wide return type that could be specific to the `@types/react` version.
  render(): React.ReactNode {
    // The component has to be unmounted or else it would continue to error
    return this.state.error ? null : this.props.children
  }
}
