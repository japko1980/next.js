import { nextTestSetup } from 'e2e-utils'
import { retry, createMultiDomMatcher } from 'next-test-utils'

describe('app-dir - metadata-streaming', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should delay the metadata render to body', async () => {
    const $ = await next.render$('/')
    expect($('head title').length).toBe(0)
    expect($('body title').length).toBe(1)
  })

  it('should still load viewport meta tags even if metadata is delayed', async () => {
    const $ = await next.render$('/slow')

    expect($('meta[name="viewport"]').attr('content')).toBe(
      'width=device-width, initial-scale=1'
    )
    expect($('meta[charset]').attr('charset')).toBe('utf-8')
  })

  it('should render the metadata in the browser', async () => {
    const browser = await next.browser('/')
    await retry(async () => {
      expect(await browser.elementByCss('title').text()).toBe('index page')
    })
  })

  it('should load the initial html without slow metadata during navigation', async () => {
    // navigate from / to /slow, the metadata should be empty first, e.g. no title.
    // then the metadata should be loaded after few seconds.
    const browser = await next.browser('/')
    await browser.elementByCss('#to-slow').click()

    await retry(async () => {
      expect(await browser.elementByCss('title').text()).toBe('slow page')
      const matchMultiDom = createMultiDomMatcher(browser)

      await matchMultiDom('meta', 'name', 'content', {
        description: 'slow page description',
        generator: 'next.js',
        'application-name': 'test',
        referrer: 'origin-when-cross-origin',
        keywords: 'next.js,react,javascript',
        author: ['huozhi'],
        viewport: 'width=device-width, initial-scale=1',
        creator: 'huozhi',
        publisher: 'vercel',
        robots: 'index, follow',
      })
    })
  })

  it('should send the blocking response for html limited bots', async () => {
    const $ = await next.render$(
      '/',
      undefined, // no query
      {
        headers: {
          'user-agent': 'Twitterbot',
        },
      }
    )
    expect(await $('title').text()).toBe('index page')
  })

  it('should send streaming response for headless browser bots', async () => {
    const browser = await next.browser('/')
    await retry(async () => {
      expect(await browser.elementByCss('title').text()).toBe('index page')
    })
  })

  it('should only insert metadata once into head or body', async () => {
    const browser = await next.browser('/slow')

    // each metadata should be inserted only once

    expect(await browser.hasElementByCssSelector('head title')).toBe(false)

    // only charset and viewport are rendered in head
    expect((await browser.elementsByCss('head meta')).length).toBe(2)
    expect((await browser.elementsByCss('body title')).length).toBe(1)

    // all metadata should be rendered in body
    expect((await browser.elementsByCss('body meta')).length).toBe(9)
  })

  it('should only insert metadata once for parallel routes when slots match', async () => {
    const browser = await next.browser('/parallel-routes')

    expect((await browser.elementsByCss('head title')).length).toBe(1)
    expect((await browser.elementsByCss('body title')).length).toBe(0)
    expect(await browser.elementByCss('title').text()).toBe('parallel title')

    const $ = await next.render$('/parallel-routes')
    expect($('title').length).toBe(1)
    expect($('head title').text()).toBe('parallel title')

    // validate behavior remains the same on client navigations
    await browser.elementByCss('[href="/parallel-routes/test-page"]').click()

    await retry(async () => {
      expect(await browser.elementByCss('title').text()).toContain(
        'Dynamic api'
      )
    })

    expect((await browser.elementsByCss('title')).length).toBe(1)
  })

  it('should only insert metadata once for parallel routes when there is a missing slot', async () => {
    const browser = await next.browser('/parallel-routes')
    await browser.elementByCss('[href="/parallel-routes/no-bar"]').click()

    // Wait for navigation is finished and metadata is updated
    await retry(async () => {
      expect(await browser.elementByCss('title').text()).toContain(
        'Dynamic api'
      )
    })

    await retry(async () => {
      expect((await browser.elementsByCss('title')).length).toBe(1)
    })
  })

  it('should still render metadata if children is not rendered in parallel routes layout', async () => {
    const browser = await next.browser('/parallel-routes-default')

    expect((await browser.elementsByCss('title')).length).toBe(1)
    expect(await browser.elementByCss('body title').text()).toBe(
      'parallel-routes-default layout title'
    )

    const $ = await next.render$('/parallel-routes-default')
    expect($('title').length).toBe(1)
    expect($('body title').text()).toBe('parallel-routes-default layout title')
  })

  describe('dynamic api', () => {
    it('should render metadata to body', async () => {
      const $ = await next.render$('/dynamic-api')
      expect($('head title').length).toBe(0)
      expect($('body title').length).toBe(1)
    })

    it('should load the metadata in browser', async () => {
      const browser = await next.browser('/dynamic-api')
      await retry(async () => {
        expect(await browser.elementByCss('body title').text()).toMatch(
          /Dynamic api \d+/
        )
      })
    })
  })

  describe('navigation API', () => {
    it('should trigger not-found boundary when call notFound', async () => {
      const browser = await next.browser('/notfound')

      // Show 404 page
      await retry(async () => {
        expect(await browser.elementByCss('h1').text()).toBe('404')
      })
    })

    it('should trigger redirection when call redirect', async () => {
      const browser = await next.browser('/redirect')
      // Redirect to home page
      expect(await browser.elementByCss('p').text()).toBe('index page')
    })

    it('should trigger custom not-found in the boundary', async () => {
      const browser = await next.browser('/notfound/boundary')

      expect(await browser.elementByCss('h1').text()).toBe('Custom Not Found')
    })

    it('should not duplicate metadata with navigation API', async () => {
      const browser = await next.browser('/notfound/boundary')

      const titleTags = await browser.elementsByCss('title')
      expect(titleTags.length).toBe(1)
    })

    it('should render blocking 404 response status when html limited bots access notFound', async () => {
      const { status } = await next.fetch('/notfound', {
        headers: {
          'user-agent': 'Twitterbot',
        },
      })
      expect(status).toBe(404)
    })

    it('should render blocking 307 response status when html limited bots access redirect', async () => {
      const { status } = await next.fetch('/redirect', {
        headers: {
          'user-agent': 'Twitterbot',
        },
        redirect: 'manual',
      })
      expect(status).toBe(307)
    })
  })
})
