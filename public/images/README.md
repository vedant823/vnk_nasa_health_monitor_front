# Instruction images

The Measurement Performance screen looks for one image per instruction step at:

```
public/images/<measurementId>/step<N>.png
```

For example `public/images/sleep_duration/step1.png`. If the backend's instructions give an
image path for a step, that path is used instead (relative to `public/`).

When an image file is missing, the app shows its own drawing for that step
(`src/components/measurement/StepArt.tsx`), which has "AI-generated" drawn into the picture. An
image file placed here is shown instead, with an "AI-generated" label on top of it.

Rules for anything placed here:

- Do not use copyrighted images, and do not use NASA logos, insignia or other NASA branding.
- An AI-generated image must have a visible "AI-generated" watermark in the image itself, and
  must be listed in `AI_DISCLOSURE.md`.
- For a photo or diagram from another source, check that its license allows reuse and add the
  source to the README.
