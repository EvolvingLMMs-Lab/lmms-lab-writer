import chalk from 'chalk'
import { writeFileSync, readFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export type TemplateType = 'article' | 'thesis' | 'beamer' | 'neurips' | 'iclr' | 'tech-report'

interface InitOptions {
  template: TemplateType
}

// Get templates directory path
function getTemplatesDir(): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  // Templates are in ../templates relative to dist/ (since tsup bundles to single file)
  return join(__dirname, '..', 'templates')
}

// Copy directory recursively
function copyDir(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }
  
  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const stat = statSync(srcPath)
    
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      // Skip auxiliary files
      if (entry.endsWith('.aux') || entry.endsWith('.log') || entry.endsWith('.pdf') || entry.endsWith('.out') || entry.endsWith('.synctex.gz')) {
        continue
      }
      copyFileSync(srcPath, destPath)
    }
  }
}

// Inline templates for simple cases
const SIMPLE_TEMPLATES = {
  article: `\\documentclass[12pt,a4paper]{article}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\title{Your Title Here}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract here.
\\end{abstract}

\\section{Introduction}
Your introduction here.

\\section{Methods}
Your methods here.

\\section{Results}
Your results here.

\\section{Conclusion}
Your conclusion here.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,

  thesis: `\\documentclass[12pt,a4paper]{report}

\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Your Thesis Title}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract here.
\\end{abstract}

\\tableofcontents

\\chapter{Introduction}
Your introduction here.

\\chapter{Literature Review}
Your literature review here.

\\chapter{Methodology}
Your methodology here.

\\chapter{Results}
Your results here.

\\chapter{Discussion}
Your discussion here.

\\chapter{Conclusion}
Your conclusion here.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,

  beamer: `\\documentclass{beamer}

\\usetheme{Madrid}
\\usecolortheme{default}

\\title{Your Presentation Title}
\\author{Your Name}
\\institute{Your Institution}
\\date{\\today}

\\begin{document}

\\begin{frame}
\\titlepage
\\end{frame}

\\begin{frame}{Outline}
\\tableofcontents
\\end{frame}

\\section{Introduction}

\\begin{frame}{Introduction}
\\begin{itemize}
  \\item First point
  \\item Second point
  \\item Third point
\\end{itemize}
\\end{frame}

\\section{Main Content}

\\begin{frame}{Main Content}
Your main content here.
\\end{frame}

\\section{Conclusion}

\\begin{frame}{Conclusion}
\\begin{itemize}
  \\item Summary point 1
  \\item Summary point 2
\\end{itemize}
\\end{frame}

\\begin{frame}
\\centering
\\Large Thank you!
\\end{frame}

\\end{document}
`,
}

const REFERENCES_BIB = `@article{example2024,
  author  = {Author, First and Author, Second},
  title   = {Example Article Title},
  journal = {Journal Name},
  year    = {2024},
  volume  = {1},
  pages   = {1--10},
}

@book{examplebook2024,
  author    = {Author, First},
  title     = {Example Book Title},
  publisher = {Publisher Name},
  year      = {2024},
}
`

// Conference templates that use file-based templates
const FILE_BASED_TEMPLATES: TemplateType[] = ['neurips', 'iclr', 'tech-report']

export async function init(options: InitOptions): Promise<void> {
  const cwd = process.cwd()
  const mainFile = options.template === 'thesis' ? 'thesis.tex' : 'main.tex'
  const mainPath = join(cwd, mainFile)

  if (existsSync(mainPath)) {
    console.error(chalk.red(`${mainFile} already exists in this directory.`))
    process.exit(1)
  }

  console.log(chalk.blue(`Initializing ${options.template} project...`))

  if (FILE_BASED_TEMPLATES.includes(options.template)) {
    // Use file-based templates for conference formats
    const templatesDir = getTemplatesDir()
    const templateDir = join(templatesDir, options.template)
    
    if (!existsSync(templateDir)) {
      console.error(chalk.red(`Template directory not found: ${templateDir}`))
      console.log(chalk.yellow('Available templates: article, thesis, beamer, neurips, iclr, tech-report'))
      process.exit(1)
    }
    
    // Copy all template files
    copyDir(templateDir, cwd)
    console.log(chalk.green(`  Copied ${options.template} template files`))
  } else {
    // Use inline templates for simple cases
    const template = SIMPLE_TEMPLATES[options.template as keyof typeof SIMPLE_TEMPLATES]
    writeFileSync(mainPath, template)
    console.log(chalk.green(`  Created ${mainFile}`))

    writeFileSync(join(cwd, 'references.bib'), REFERENCES_BIB)
    console.log(chalk.green('  Created references.bib'))
  }

  if (!existsSync(join(cwd, 'figures'))) {
    mkdirSync(join(cwd, 'figures'))
    console.log(chalk.green('  Created figures/'))
  }

  console.log(chalk.blue('\nProject initialized successfully!'))
  console.log(chalk.gray(`\nTo compile, run:\n  latex-writer compile ${mainFile}`))
  console.log(chalk.gray(`\nTo watch for changes:\n  latex-writer watch ${mainFile}`))
  
  if (options.template === 'neurips') {
    console.log(chalk.yellow('\nNeurIPS template options:'))
    console.log(chalk.gray('  [preprint] - for arXiv preprint'))
    console.log(chalk.gray('  [final]    - for camera-ready version'))
  } else if (options.template === 'iclr') {
    console.log(chalk.yellow('\nICLR template options:'))
    console.log(chalk.gray('  [preprint] - for arXiv preprint'))
    console.log(chalk.gray('  [final]    - for camera-ready version'))
  } else if (options.template === 'tech-report') {
    console.log(chalk.yellow('\nTech Report template uses LMMs-Lab style with metadata support.'))
  }
}
