# Job Application Assistant for Alejandro D'Ambrosio

## Role
This repo is a job application workspace. Claude acts as a career advisor and application assistant for Alejandro D'Ambrosio, helping with:
1. **Job fit evaluation** - Assess job postings against your profile (skills, experience, behavioral traits)
2. **CV tailoring** - Adapt existing CV templates (LaTeX/moderncv) to target specific roles
3. **Cover letter writing** - Draft targeted cover letters using existing templates (LaTeX)
4. **Interview preparation** - Prepare answers, questions, and talking points for interviews
5. **Career strategy** - Advise on positioning and personal branding

## Candidate Profile

### Identity
- **Name:** Alejandro D'Ambrosio
- **Location:** Comuna 1, Ciudad Autónoma de Buenos Aires, Argentina (requires 100% remote; no relocation)
- **Languages:** Spanish (native), English (professional working), French (elementary)
- **Status:** Employed - Solutions Architect at Flux IT
- **LinkedIn headline:** "I help software development teams to build IT excellent solutions"

### Education
- **Engineer's degree in Systems Engineering** (1997-2016) - Universidad Tecnológica Nacional (UTN)
- **Analyst in Information Systems** (1997-2009) - Universidad Tecnológica Nacional (UTN)
- **Ontological Coaching / Leadership** (2019-2020) - CAYZEN Global

### Professional Experience
- **Solutions Architect** (June 2023 - Present) - **Flux IT** (Buenos Aires)
  - Solution architecture across web, backend, and native/hybrid mobile for enterprise clients
  - Architecture, research, innovation, team building, and software quality
- **Technical Leader** (April 2021 - June 2023) - **Flux IT** (Buenos Aires)
  - Led 40+ developers (Java backend, native iOS/Android, React web) for a single client
  - Set quality standards, defined developers' career paths, supported client team leaders
- **Team Technical Leader** (February 2019 - April 2021) - **Flux IT** (Buenos Aires)
  - Led a 4-dev team building microservices (OpenShift, Java, Spring Boot) for Banco Galicia's customer-service channels
- **iOS Tech Lead & Software IT Architect** (August 2016 - January 2019) - **Flux IT** (Buenos Aires)
  - Technical reference for iOS team building Banco Galicia homebanking app (Swift, REST/OData, omnichannel); mobile architecture and delivery guidelines
- **Java Developer** (December 2011 - April 2016) - **Flux IT** (Buenos Aires)
  - Enterprise Java web/BPM for OSDE (Spring, Hibernate, Struts, Drools, DB2)
- Earlier: Globant, OSDE, TIVIT, Synapsis, MRT SA (2006-2011 Java; see 01-candidate-profile.md for full history)

### Technical Skills
- **Primary:** Software/solution architecture, technical leadership, Java (Spring/Spring Boot/Hibernate), Swift/iOS native, Agile (Scrum/Kanban)
- **Secondary:** React, Node.js/Express, Ionic (hybrid mobile), CI/CD, quality tooling
- **Domain:** Fintech/banking (Banco Galicia), healthcare (OSDE), enterprise software delivery
- **Software:** OpenShift, Google Cloud (Cloud Run, Firebase), DB2/relational SQL, MongoDB, JIRA, Git/SVN

### Certifications
- **Scrum: Roles**
- **Develop Serverless Applications on Cloud Run** - Google Cloud Skill Badge
- **Set Up a Google Cloud Network** - Google Cloud Skill Badge
- **Develop Serverless Apps with Firebase** - Google Cloud Skill Badge
- **Solar Energy**

### Publications
- None on record.

### Awards
- None on record.

### Behavioral Profile
<!-- Inferred from LinkedIn About - no formal assessment on record. See 02-behavioral-profile.md. -->
- **Leadership & continuous improvement** - proactive leader focused on making teams and products better
- **Curiosity / lifelong learning** - always learning, researching, and encouraging the team to grow
- **Strengths:** technical leadership, architecture, mentoring, collaboration, problem-solving
- **Growth areas:** [self-assess and add]
- **Thrives in:** collaborative, Agile, autonomous environments with room to research, build PoCs, and automate

### What Excites You
- Designing architecture, researching new technologies, and building PoCs
- Mentoring and solving complex technical problems

### Target Sectors
- Product companies: [add specific targets]
- Service companies (non-consultancy): [add specific targets]
- International remote roles paying in USD

### Deal-breakers
- Not 100% remote (100% remote is non-negotiable)
- Requires relocation
- IT consultancy / staffing employer (prefers working internally at a product or service company)

## Repo Structure
- `cv/` - LaTeX CV variants (moderncv template, banking style)
- `cover_letters/` - LaTeX cover letters (custom cover.cls template)
- `.claude/skills/` - AI skill definitions for the application workflow
- `.agents/skills/` - Job search CLI tools

## Workflow for New Job Applications
1. User provides a job posting (URL or text)
2. **Always evaluate fit first**: skills match, experience match, behavioral/culture match. Present this assessment to the user before proceeding.
3. If good fit: create targeted CV (`cv/main_<company>.tex`) and cover letter (`cover_letters/cover_<company>_<role>.tex`)
4. **Verify both documents** (see Verification Checklist below)
5. Prepare interview talking points based on the role requirements and your strengths

**Important:** When mentioning agentic coding or AI tooling in CVs/cover letters, explicitly reference **Claude Code** by name.

## Verification Checklist
After creating or updating a CV or cover letter, re-read the generated file and verify **all** of the following before presenting to the user. Report the results as a pass/fail checklist.

### Factual accuracy
- [ ] All claims match actual profile (CLAUDE.md / candidate profile) - no fabricated skills, experience, or achievements
- [ ] Job titles, dates, company names, and locations are correct
- [ ] Contact details are correct
- [ ] All company-specific claims (partnerships, products, technology, expansions) have been independently verified via WebFetch/WebSearch - do not trust reviewer agent research without verification

### Targeting
- [ ] Profile statement / opening paragraph is tailored to the specific role (not generic)
- [ ] Skills and experience bullets are reframed to match the job requirements
- [ ] Key job requirements are addressed (with gaps acknowledged where relevant)
- [ ] Nice-to-have requirements are highlighted where there is a match

### Consistency
- [ ] CV follows the standard 2-page moderncv/banking format
- [ ] Cover letter uses cover.cls template and established structure
- [ ] Tone is consistent across CV and cover letter
- [ ] No contradictions between CV and cover letter content

### Quality
- [ ] No LaTeX syntax errors (balanced braces, correct commands)
- [ ] No spelling or grammar errors
- [ ] Agentic coding / AI tooling references mention **Claude Code** by name
- [ ] Cover letter is addressed to the correct person (or "Dear Hiring Manager" if unknown)
- [ ] Cover letter fits approximately one page

### Compiled PDF verification (MANDATORY - never skip)
Both documents MUST be compiled and visually inspected via the Read tool on the PDF output. "Looks fine in the .tex" is not acceptable - LaTeX page-break decisions are unpredictable. Iterate until these all pass:
- [ ] CV compiled with **lualatex** (pdflatex often fails on modern MiKTeX with fontawesome5 font-expansion errors). Cover letter compiled with **xelatex** (cover.cls requires fontspec).
- [ ] **CV is exactly 2 pages** - not 1, not 3
- [ ] **No orphaned `\cventry` titles** - a job/education title must never sit at the bottom of a page with its bullets spilling to the next page. Use `\needspace{5\baselineskip}` before each `\cventry` to prevent this, and `\enlargethispage{2-3\baselineskip}` to rescue a trailing section that just barely spills
- [ ] **Cover letter is exactly 1 page** - signature block must fit with the body, never overflow
- [ ] **Cover letter bullet font matches body font** - `\lettercontent{}` must not wrap `\begin{itemize}...\end{itemize}` (the command's trailing `\\` errors on `\end{itemize}`, and moving itemize outside loses the Raleway font). Standard pattern: close `\lettercontent{}`, then wrap the list in `{\raggedright\fontspec[Path = OpenFonts/fonts/raleway/]{Raleway-Medium}\fontsize{11pt}{13pt}\selectfont \begin{itemize}...\end{itemize}\par}`

### ATS & keyword verification (CV)
ATS parsers read the PDF's embedded text layer, not the rendered page. Extract it with `pdftotext -layout` and verify what a parser sees. `pdftotext` (poppler) is optional - if missing, skip the parseability items with a warning and check keyword coverage from the visual PDF read instead.
- [ ] CV text layer extracts cleanly - no `(cid:*)` markers, `�` replacement characters, or text visible in the PDF but absent from the extraction
- [ ] Email and phone appear as **literal text** in the extraction (icon-glyph noise like `MOBILE-ALT`/`Envelope` is harmless, but a contact detail carried only by an icon or hyperlink is invisible to ATS)
- [ ] Reading order of the extracted text matches the visual order (single-column stock template is safe; multi-column custom templates are where this breaks)
- [ ] Posting keywords covered or honestly absent - synonym-only matches tightened to the posting's exact term where truthfully applicable, keywords the profile genuinely supports added to experience bullets, genuine gaps left visible and **never stuffed**
