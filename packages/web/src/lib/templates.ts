export type TemplateId = 'tech-report' | 'neurips' | 'iclr'

export type Template = {
  id: TemplateId
  name: string
  description: string
  content: string
}

export const templates: Template[] = [
  {
    id: 'tech-report',
    name: 'Tech Report',
    description: 'LMMs-Lab style technical report with metadata links',
    content: `\\documentclass{article}

\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\title{Your Technical Report Title}
\\author{Author One \\and Author Two \\and Author Three}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. Provide a concise summary of your work, including the problem statement, methodology, key results, and conclusions.
\\end{abstract}

\\section{Introduction}
\\label{sec:intro}

Your introduction goes here. Describe the problem you are addressing, why it is important, and provide an overview of your approach.

\\section{Related Work}
\\label{sec:related}

Discuss prior work relevant to your research.

\\section{Method}
\\label{sec:method}

Describe your methodology in detail.

\\begin{equation}
    \\mathcal{L} = \\sum_{i=1}^{N} \\ell(f(x_i), y_i)
\\end{equation}

\\section{Experiments}
\\label{sec:experiments}

\\subsection{Experimental Setup}

Describe your experimental setup, datasets, baselines, and evaluation metrics.

\\subsection{Main Results}

Present your main results.

\\begin{table}[h]
\\centering
\\caption{Main results on benchmark datasets.}
\\label{tab:main}
\\begin{tabular}{lcc}
\\toprule
Method & Dataset A & Dataset B \\\\
\\midrule
Baseline 1 & 75.2 & 82.1 \\\\
Baseline 2 & 78.4 & 84.3 \\\\
\\textbf{Ours} & \\textbf{82.1} & \\textbf{87.5} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Conclusion}
\\label{sec:conclusion}

Summarize your contributions and discuss limitations and future work.

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
  },
  {
    id: 'neurips',
    name: 'NeurIPS 2024',
    description: 'Neural Information Processing Systems conference format',
    content: `\\documentclass{article}

\\usepackage{neurips_2024}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{url}
\\usepackage{booktabs}
\\usepackage{amsfonts}
\\usepackage{nicefrac}
\\usepackage{microtype}
\\usepackage{xcolor}

\\title{Your Paper Title for NeurIPS 2024}

\\author{
  Author One\\thanks{Equal contribution.} \\\\
  Affiliation \\\\
  \\texttt{author1@email.com} \\\\
  \\And
  Author Two\\footnotemark[1] \\\\
  Affiliation \\\\
  \\texttt{author2@email.com} \\\\
}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. The abstract should provide a concise summary of your work. Keep it to approximately 150-250 words and limit to one paragraph.
\\end{abstract}

\\section{Introduction}

Your introduction goes here. Describe the problem, motivation, and your contributions.

\\section{Related Work}

Discuss related work and how your approach differs.

\\section{Method}

Describe your proposed method in detail.

\\subsection{Problem Formulation}

Define the problem formally.

\\subsection{Our Approach}

Describe your approach.

\\section{Experiments}

\\subsection{Setup}

Describe your experimental setup.

\\subsection{Results}

Present your results.

\\begin{table}[h]
  \\caption{Main results comparison.}
  \\label{tab:results}
  \\centering
  \\begin{tabular}{lcc}
    \\toprule
    Method & Metric 1 & Metric 2 \\\\
    \\midrule
    Baseline & 80.0 & 75.0 \\\\
    Ours & \\textbf{85.0} & \\textbf{80.0} \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

\\section{Conclusion}

Summarize your contributions and discuss future work.

\\begin{ack}
Acknowledgments go here (optional, remove for submission).
\\end{ack}

\\bibliographystyle{plain}
\\bibliography{references}

\\end{document}
`,
  },
  {
    id: 'iclr',
    name: 'ICLR 2025',
    description: 'International Conference on Learning Representations format',
    content: `\\documentclass{article}
\\usepackage{iclr2025_conference,times}

\\usepackage{hyperref}
\\usepackage{url}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{booktabs}

\\title{Your Paper Title for ICLR 2025}

\\author{
  Author One \\& Author Two \\& Author Three \\\\
  Affiliation \\\\
  \\texttt{\\{author1,author2,author3\\}@email.com}
}

\\newcommand{\\fix}{\\marginpar{FIX}}
\\newcommand{\\new}{\\marginpar{NEW}}

\\begin{document}

\\maketitle

\\begin{abstract}
Your abstract goes here. The abstract should be limited to one paragraph and provide a concise summary of your work.
\\end{abstract}

\\section{Introduction}

Your introduction goes here. Describe the problem, motivation, and your contributions.

\\section{Related Work}

Discuss related work and position your contribution.

\\section{Method}

Describe your proposed method.

\\subsection{Problem Setup}

Define the problem formally.

\\subsection{Our Approach}

Describe your approach in detail.

\\section{Experiments}

\\subsection{Setup}

Describe datasets, baselines, and evaluation metrics.

\\subsection{Results}

Present your main results.

\\begin{table}[h]
\\caption{Main results.}
\\label{tab:main}
\\centering
\\begin{tabular}{lcc}
\\toprule
Method & Accuracy & F1 \\\\
\\midrule
Baseline & 80.0 & 78.5 \\\\
Ours & \\textbf{85.0} & \\textbf{83.2} \\\\
\\bottomrule
\\end{tabular}
\\end{table}

\\section{Conclusion}

Summarize your contributions and discuss limitations and future work.

\\subsubsection*{Acknowledgments}

Acknowledgments go here (remove for anonymous submission).

\\bibliography{iclr2025_conference}
\\bibliographystyle{iclr2025_conference}

\\end{document}
`,
  },
]

export function getTemplate(id: TemplateId): Template | undefined {
  return templates.find((t) => t.id === id)
}
