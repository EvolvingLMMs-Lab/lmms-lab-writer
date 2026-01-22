import chalk from 'chalk'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

interface InitOptions {
  template: 'article' | 'thesis' | 'beamer'
}

const TEMPLATES = {
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

export async function init(options: InitOptions): Promise<void> {
  const cwd = process.cwd()
  const mainFile = options.template === 'thesis' ? 'thesis.tex' : 'main.tex'
  const mainPath = join(cwd, mainFile)

  if (existsSync(mainPath)) {
    console.error(chalk.red(`${mainFile} already exists in this directory.`))
    process.exit(1)
  }

  console.log(chalk.blue(`Initializing ${options.template} project...`))

  writeFileSync(mainPath, TEMPLATES[options.template])
  console.log(chalk.green(`  Created ${mainFile}`))

  writeFileSync(join(cwd, 'references.bib'), REFERENCES_BIB)
  console.log(chalk.green('  Created references.bib'))

  if (!existsSync(join(cwd, 'figures'))) {
    mkdirSync(join(cwd, 'figures'))
    console.log(chalk.green('  Created figures/'))
  }

  console.log(chalk.blue('\nProject initialized successfully!'))
  console.log(chalk.gray(`\nTo compile, run:\n  latex-writer ${mainFile}`))
  console.log(chalk.gray(`\nTo watch for changes:\n  latex-writer ${mainFile} --watch`))
}
