# Auto Video Editor: how it works, what was tested, what is missing

Tool slug: `auto-video-editor` (registered in `components/tools/registry.js`, wide layout). Database row: `supabase/add-audio-transcriber.sql`.
Everything runs in the visitor's browser. Nothing is uploaded. Nothing is saved (no projects, templates, demo, mic, browser Whisper).

## Files
- `components/video-editor/` : the interface (one page: numbered sections on the left, preview in the middle, timeline below)
  - `AutoVideoEditor.js` layout, `useEditorState.js` all state and actions, `hooks.js` undo/redo + playback clock
  - `panels1.js` (voice + silence remover, timing, music, media), `panels2.js` (storyboard, captions, output), `Preview.js`, `Timeline.js`, `RenderDialog.js`
  - `Loader.js` loads the editor only on its own page (the heavy engine is not in any other page)
- `lib/video/` : pure logic and the engine
  - `timing.js` SRT/VTT/JSON reading, `scenes.js` scenes, timing maths, silence cuts, script estimate, `captions.js` caption chunks + drawing + PNG encoder
  - `ffmpegClient.js` FFmpeg.wasm, `render.js` MP4 pipeline, `audio.js` silence detection/cutting/waveform, `groq.js` optional Groq, `zip.js` package, `options.js` shapes/transitions
- `scripts/copy-ffmpeg.mjs` (runs after `npm install`) copies the engine (32 MB) to `public/vendor/ffmpeg`, which is git-ignored. The site serves it itself; nothing comes from a third-party CDN.

## Features (all tested in a real browser unless listed under "not verified")
- Voiceover upload (any length), waveform, silence remover (find, preview time saved, cut, restore)
- Timing: SRT, VTT, JSON (my TTS tool: `sentences` + `words` + `timing_estimated`; Whisper/Groq style; word-only files grouped into sentences), script estimate (uses pauses in the audio), equal time, optional Groq with the user's own key
- **One scene per picture (default)**: `lib/video/plan.js` cuts the narration into exactly as many scenes as there are pictures (dynamic programming: scenes of similar length, cuts on sentence ends first, then commas, then pauses; one/two-word scenes are penalised). Pictures are ordered by file name (01, 02 ... 10). Adding or removing pictures re-plans by itself until the user edits scenes by hand. Or choose 1/2/3/4 sentences per picture. Scene list, per-scene text/time/picture/fit/motion/transition, split, duplicate, delete, undo/redo
- Timeline: drag the edge between two scenes, scrub, zoom, waveform, caption lines (green = real word times, amber = estimated)
- Preview: voice is the clock, shape selector 16:9 / 9:16 / 1:1, safe zones, captions drawn by the same code as the render
- Captions: 5 presets, fonts, colours, outline, box, position, word highlight, any language the user's fonts cover (RTL tested with Urdu/Arabic, also Hindi, Japanese, Korean, emoji)
- MP4 render: 720p/1080p, cut or crossfade/slide/wipe/zoom, slow zoom/pan on pictures, picture or video-clip scenes (clips loop), burned-in captions, music with fade and a correct voice level, progress, cancel, memory-error message
- ZIP package (unique file names) and SRT download

## Measured results
- Picture planner (synthetic 82-sentence story): 150 pictures -> 150 scenes, every sentence end is a cut, scene lengths 1.8-4.2 s; 82 pictures -> all 81 cuts on sentence ends; 40 pictures -> all 39 cuts on sentence ends; runs in about 0.2 s. In the editor: 9 pictures -> 9 scenes, +3 pictures -> 12 scenes automatically, 9 -> 6 pictures re-plans to 6 scenes
- Scene changes in the rendered MP4 land on the scene start times (checked frame by frame, 4 and 24 scenes, 0 mismatches); output length equals the voiceover (15.03 s for 15.02 s)
- Crossfade is a real blend (checked colours during the transition)
- Voice level with music: RMS 0.123 vs 0.117 expected (no halving, no clipping)
- Silence remover: scene starts move to the new speech onsets (quiet before, speech after, in the cut audio)
- Script estimate on clean TTS: start error about +0.1 s, end error about 0.04 s (an estimate, labelled as such)
- Speed (720p, this computer, single-threaded WebAssembly): about 1.1x the video length with cuts and captions; about 5x with crossfades + slow zoom. 1080p is about twice as slow (not measured)

## Not verified / not built
- Groq transcription with a real key (only the browser-to-Groq request, CORS and the invalid-key message were tested)
- Very long videos, many large files, phones, Safari, Firefox (tested in a Chromium-based browser only); the editor warns about memory but cannot promise anything for huge projects
- Matching pictures to sentences by what is IN the picture (CLIP) and match %: not built. The planner only uses narration timing and picture order (file name), so it is right when the pictures are in story order
- Music ducking under the voice, "um/uh" removal, caption translation, direct CapCut project export: not built (the ZIP is the hand-off)
- The login gate / Free-Pro check is the website's own (tool page); not exercised here because it needs the database row from the SQL file
- Hosting note: `ffmpeg-core.wasm` is 32 MB. Netlify and Vercel accept it; Cloudflare Pages rejects single files over 25 MB (host that one file elsewhere if you use Cloudflare)
