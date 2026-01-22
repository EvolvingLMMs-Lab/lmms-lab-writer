% Tech Report Class - Based on fairmeta style
% Simplified version without custom font dependencies
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{techreport}[2024/01/01 LMMs-Lab Tech Report Class]
\LoadClassWithOptions{article}

% Layout
\RequirePackage[top=2.25cm, bottom=2.5cm, left=2.5cm, right=2.5cm]{geometry}
\RequirePackage{microtype}
\RequirePackage{parskip}
\RequirePackage[english]{babel}

% Graphics
\RequirePackage{graphicx}
\RequirePackage{subcaption}

% Tables
\RequirePackage{booktabs}
\RequirePackage{multirow}

% Colors
\RequirePackage[most]{tcolorbox}
\RequirePackage{xcolor}
\definecolor{linkblue}{HTML}{0064E0}
\definecolor{textfg}{HTML}{1C2B33}
\definecolor{boxbg}{HTML}{F1F4F7}

% References
\RequirePackage{hyperref}
\RequirePackage[noabbrev,nameinlink]{cleveref}
\hypersetup{
  colorlinks,
  linkcolor=linkblue,
  citecolor=linkblue,
  urlcolor=linkblue
}

\RequirePackage[round,authoryear]{natbib}
\def\bibfont{\small}

% Section format
\RequirePackage{titlesec}
\titleformat*{\section}{\Large\bfseries}
\titleformat*{\subsection}{\large\bfseries}
\titleformat*{\subsubsection}{\normalsize\bfseries}
\titleformat*{\paragraph}{\itshape}

% Caption format
\RequirePackage{caption}
\captionsetup{font=small,labelfont=bf}

% Fonts - use standard fonts
\RequirePackage[T1]{fontenc}
\RequirePackage{lmodern}

% Authors and metadata
\newcommand\authorlist{}
\newcommand\affiliationlist{}
\newcommand\metadatalist{}

\renewcommand\author[1]{\g@addto@macro\authorlist{#1\\}}
\newcommand\affiliation[1]{\g@addto@macro\affiliationlist{#1\\}}
\newcommand\metadata[2][]{\g@addto@macro\metadatalist{{\small\textbf{#1:} #2\par}}}

\renewcommand{\abstract}[1]{\def\abstracttext{#1}}
\newcommand{\email}[1]{\href{mailto:#1}{\texttt{#1}}}

% Title box
\renewcommand{\maketitle}{%
  \begin{tcolorbox}[
    enhanced,
    frame hidden,
    colback=boxbg,
    arc=8pt,
    left=12pt,
    right=12pt,
    top=12pt,
    bottom=12pt
  ]
    {\LARGE\bfseries\@title\par}
    \vskip 0.5em
    {\large\authorlist}
    \vskip 0.3em
    {\small\affiliationlist}
    \vskip 1em
    {\color{textfg}\abstracttext\par}
    \vskip 0.5em
    \metadatalist
  \end{tcolorbox}
  \vskip 1em
}
