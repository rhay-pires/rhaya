import { renameSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const docs = join(process.cwd(), 'docs')
const built = join(docs, 'dev.html')
const index = join(docs, 'index.html')

if (!existsSync(built)) {
  console.error('docs/dev.html não encontrado após o build')
  process.exit(1)
}

renameSync(built, index)
writeFileSync(join(docs, '.nojekyll'), '')
writeFileSync(join(process.cwd(), '.nojekyll'), '')
console.log('docs/index.html pronto para GitHub Pages')
