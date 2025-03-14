import { CanaryOnlyError, isStableBuild } from './canary-only'

export function getRspackCore() {
  gateCanary()
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    return require('@rspack/core')
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        '@rspack/core is not available. Please make sure `@next/plugin-rspack` is correctly installed.'
      )
    }

    throw e
  }
}

export function getRspackReactRefresh() {
  gateCanary()
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    return require('@rspack/plugin-react-refresh')
  } catch (e) {
    if (e instanceof Error && 'code' in e && e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        '@rspack/plugin-react-refresh is not available. Please make sure `@next/plugin-rspack` is correctly installed.'
      )
    }

    throw e
  }
}

function gateCanary() {
  if (isStableBuild()) {
    throw new CanaryOnlyError(
      'Rspack support is only available in Next.js canary.'
    )
  }
}
