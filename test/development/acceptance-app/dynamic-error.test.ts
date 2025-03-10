/* eslint-env jest */
import { createSandbox } from 'development-sandbox'
import { FileRef, nextTestSetup } from 'e2e-utils'
import path from 'path'
import { outdent } from 'outdent'

describe('dynamic = "error" in devmode', () => {
  const { next } = nextTestSetup({
    files: new FileRef(path.join(__dirname, 'fixtures', 'default-template')),
  })

  it('should show error overlay when dynamic is forced', async () => {
    await using sandbox = await createSandbox(
      next,
      new Map([
        [
          'app/server/page.js',
          outdent`
          import { cookies } from 'next/headers';

          export default async function Page() {
            await cookies()
            return null
          }

          export const dynamic = "error"
        `,
        ],
      ]),
      '/server'
    )
    const { browser } = sandbox

    await expect(browser).toDisplayRedbox(`
     {
       "count": 1,
       "description": "Error: Route /server with \`dynamic = "error"\` couldn't be rendered statically because it used \`cookies\`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering",
       "environmentLabel": "Server",
       "label": "Unhandled Runtime Error",
       "source": "app/server/page.js (4:16) @ Page
     > 4 |   await cookies()
         |                ^",
       "stack": [
         "Page app/server/page.js (4:16)",
       ],
     }
    `)
  })
})
