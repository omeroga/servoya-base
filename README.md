# Servoya Base Skeleton

This is a minimal, stable Node project that runs an end to end demo pipeline:

1. Picks a demo trend.
2. Maps trend to a simple category.
3. Builds a hook/body/cta script.
4. Tries to load up to 7 images from `assets/images/<niche>/`.
5. Tries to load 1 audio file from `assets/audio/<niche>/`.
6. If media exists, creates a vertical mp4 video using ffmpeg.
7. Returns JSON with script, mapping and videoPath.

It does not talk to Supabase or OpenAI. It is a clean base that you can extend.