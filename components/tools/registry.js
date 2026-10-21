// Which tools have a working version. Key = the tool's slug. A tool added in the admin panel
// without an entry here shows a friendly "coming soon" panel until its code is connected.
import ThumbnailMaker from "@/components/tools/ThumbnailMaker";
import TextCleaner from "@/components/tools/TextCleaner";
import CaptionGenerator from "@/components/tools/CaptionGenerator";
import AudioTranscriber from "@/components/tools/AudioTranscriber";
import AutoVideoEditor from "@/components/video-editor/Loader";
import WordCounter from "@/components/tools/WordCounter";
import QRCodeGenerator from "@/components/tools/QRCodeGenerator";
import ImageCompressor from "@/components/tools/ImageCompressor";
import MusicVault from "@/components/tools/MusicVault";

export const runners = {
  "music-sfx-vault": {
    Component: MusicVault,
    wide: true,
    steps: [
      "Browse or search 1,290+ Royalty-Free music tracks and sound effects across 47 categories.",
      "Preview audio instantly with the integrated web player and waveform scrubber.",
      "Download high-quality MP3s or generate a dedicated Music API Key (ols_music_live_...) for automated bot integration.",
    ],
  },
  "music-and-sfx-vault": {
    Component: MusicVault,
    wide: true,
    steps: [
      "Browse or search 1,290+ Royalty-Free music tracks and sound effects across 47 categories.",
      "Preview audio instantly with the integrated web player and waveform scrubber.",
      "Download high-quality MP3s or generate a dedicated Music API Key (ols_music_live_...) for automated bot integration.",
    ],
  },
  "image-compressor": {
    Component: ImageCompressor,
    wide: true,
    steps: ["Drop or select any PNG, JPG, or WebP image.", "Choose your compression preset, quality, or target format.", "Preview savings and download your lightweight image."],
  },
  "qr-code-generator": {
    Component: QRCodeGenerator,
    wide: true,
    steps: ["Choose your QR code type (URL, WiFi, Contact, WhatsApp, Email, etc.).", "Fill in details and customize colors and styling.", "Download high-res PNG or vector SVG with zero watermarks."],
  },
  "word-counter": {
    Component: WordCounter,
    steps: ["Type or paste your text into the editor.", "View instantaneous word, character, and sentence counts.", "Use case formatting or copy your analyzed text."],
  },
  "thumbnail-maker": {
    Component: ThumbnailMaker,
    steps: ["Type your headline and an optional small line.", "Pick a background or upload your own picture.", "Adjust the text, then download your PNG."],
  },
  "text-cleaner": {
    Component: TextCleaner,
    steps: ["Paste your text on the left.", "Tick the clean-up options you want.", "Copy the cleaned text on the right."],
  },
  "caption-generator": {
    Component: CaptionGenerator,
    steps: ["Enter what your post is about.", "Choose a platform and a tone.", "Generate, copy your favorite and make it yours."],
  },
  "audio-transcriber": {
    Component: AudioTranscriber,
    steps: ["Add an audio or video file, or record your voice.", "Pick the quality and the language spoken.", "Start, then download subtitles (SRT/VTT) or text with exact word times."],
  },
  "auto-video-editor": {
    Component: AutoVideoEditor,
    wide: true,
    steps: ["Add your voiceover, then a timing file (or a script) so scenes follow your sentences.", "Add pictures and clips, then adjust scenes, captions and the timeline.", "Render the MP4 in your browser and download it. Nothing is uploaded."],
  },
};
