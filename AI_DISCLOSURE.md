# AI disclosure

Team VNK used an AI assistant (Claude by Anthropic) to build this front end. This file says
where and how, as the NASA Space Apps Challenge rules require.

## Where AI was used

| What | How AI was used | How it is marked |
| --- | --- | --- |
| Source code (`src/`, `index.html`, config files) | Written by AI from the team's spec and the backend's API, then reviewed by the team. | A comment at the top of every source file, the `description` and `aiGenerated` fields in `package.json`, meta tags in `index.html`, and this file. |
| Body illustration (`src/components/risk/BodyFigure.tsx`) | An original outline drawn by AI as SVG shapes. It is not based on any agency artwork. | A visible "AI-generated" watermark on the image wherever it appears, and a header comment in the file. |
| Step illustrations (`src/components/measurement/StepArt.tsx`) | One original line drawing for each instruction step of each measurement (57 steps), drawn by AI as SVG shapes. No photos and no third-party artwork. | The words "AI-generated" are drawn into every picture, the picture's text description starts with "AI-generated illustration", and the file has a header comment. |
| App mark and favicon (`public/favicon.svg`) | An original pulse-line mark drawn by AI. | A comment inside the SVG file and this file. |
| Visual design (`src/styles/`) | The look (square ink borders, one monospace typeface, a cobalt accent for the main action) was produced by AI with a design checklist skill, then reviewed by the team. The app mark in the top bar was redrawn as a pulse line on a square plate. | Header comments in the style files and this file. |
| Simulated scan (`src/api/mock.ts`, demo mode only) | A simple drawing of the back of an eye, made by AI as SVG, used as a stand-in scan so scan review can be tried. | The words "Simulated scan. AI-generated drawing." are drawn into the picture. |
| Help text (`src/content/explainers.ts`, `src/lib/escalation.ts`) | The "Why is this exam needed?" and "How does spaceflight affect this?" answers, badge names and rules (`badges.json`) and guidance wording were drafted by AI from the sources listed in the README. The environment advice (`src/lib/environment.ts`) was written by AI from the team's ranges guide. | Header comments in the files and the Info page. |
| Demo data (`src/api/mock.ts`) | Simulated readings generated in the browser for demo mode. They are not real crew or patient data. | A bar on every screen in demo mode, a header comment in the file, and the Info page. |
| Documentation (`README.md`, this file) | Drafted by AI. The "App Specifications" section of the README was written by the team. | This file. |

No AI-generated audio or video is included.

## What was not made by AI in this repository

- The app specification at the end of `README.md` (written by the team).
- `src/mocks/riskInfo.json`, `measurementDetails.json` and `measurementInstructions.json` are
  copies of the backend's own data files, included only so demo mode can follow the same rules
  as the backend.
- The open-source libraries and fonts listed in the README.

## Branding

The app does not use, contain or modify any NASA branding or design elements: no NASA logos,
insignia, mission patches, typefaces or imagery. The name "Crew Health Monitor", the pulse-line
mark and the color scheme are original. The typeface is Chivo Mono (SIL Open Font License).

## Adding images or video later

Any AI-generated image or video added to this project must carry a visible watermark saying it
is AI-generated, and must be listed in the table above.
