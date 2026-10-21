# Auto Video Editor: poori requirements (ek jagah, final)

> STATUS: built. See docs/auto-video-editor.md for what exists, what was tested and what is still missing (CLIP match %, ducking, um/uh removal, caption translation).

Maqsad: creator ki editing ka waqt bachana. Browser mein chalne wala (JavaScript), free, koi watermark nahi, koi credits nahi.
(M) = pehle version mein zaroori, (B) = baad mein. Har cheez 1-2 line mein.

## A. Bunyadi usool
1. **Kuch save nahi (M):** koi project, auto-save, project list, template ya demo nahi. User website chhode to sab reset, hamare server par bojh nahi.
2. **Start over (M):** ek button jo sab saaf karke shuru se kaam shuru kare.
3. **Tab band karne par warning (M):** "aap ka kaam save nahi hota, pehle Export kar lo."
4. **Guided steps (M):** 1 Awaaz, 2 Timing, 3 Music, 4 Images/Videos, 5 Storyboard, 6 Output.
5. **Undo/Redo (M):** har badlav (move, resize, hatana) wapas ho sake.
6. **Login zaroori (M):** hamari website ki tarah free signup ke baad hi chale.
7. **Free aur Pro (M):** kaun se features free, kaun se Pro, admin panel se tay ho.
8. **Bina watermark, bina credits (M):** hamara asal farq, website par saaf likha ho.
9. **Kuch upload nahi (M):** awaaz, images, videos hamare server par nahi jate (sirf Groq mode mein awaaz Groq ko jati hai, saaf likha ho).

## B. Awaaz (sirf upload)
10. **Awaaz upload (M):** MP3, WAV, M4A, OGG, WEBM, MP4. Drag and drop bhi.
11. **Mic recording nahi (M):** is tool mein recording ka option nahi.
12. **Lambai ki koi hadd nahi (M):** bas device ki memory ki wajah se naram warning; awaaz tukron mein parhi jaye.
13. **Awaaz ki maloomat (M):** naam, lambai, waveform dikhe.
14. **Awaaz ki saafai (B):** halki shor kam karna, volume barabar karna.

## C. Sync ke teen raaste (Whisper browser mein NAHI)
15. **Raasta 1: timing file upload (M):** word-level JSON (eddts jaisi) ya sentence-level SRT/VTT. Turant aur exact sync, koi intezar nahi.
16. **JSON/SRT parhna (M):** hamari eddts ki JSON, aur aam SRT/VTT (kisi bhi TTS ya tool ki). File mein text hota hai, to alag script ki zaroorat nahi.
17. **"Timings estimated" flag (M):** agar eddts ne andaza diya hai to user ko batao ke timing andaza hai.
18. **SRT mein word timing (M):** sirf jumle ka waqt ho to lafz jumle ke andar barabar baant diye jayein (word-by-word captions ke liye andaza).
19. **Raasta 2: user ki apni Groq key (M):** user apni key daale, awaaz Groq Whisper se transcribe ho, lafz-level waqt aaye. Is ki limit user ki apni hoti hai.
20. **Key ki hifazat (M):** key sirf api.groq.com ko jaye, password-type input, default sirf is session ki memory mein, "is browser mein yaad rakho" tick ho to hi save.
21. **Key kaise banayen guide (M):** screenshots ke saath chhoti hidayat.
22. **Groq mode ka saaf notice (M):** "is mode mein aap ki awaaz Groq ko jati hai."
23. **Groq ki limit ka message (M):** limit khatam ho ya file bari ho to saaf message aur tukron mein bhejna.
24. **Groq browser call ka test (M, pehle verify):** CORS chalta hai ya nahi, aur timing ki accuracy test karna; nahi chala to chhota proxy.
25. **Raasta 3: script + awaaz, koi file/key nahi (M):** script ke jumlon ka waqt khamoshi (pauses) aur characters ki lambai se andaza; ghalti 0.5-1 s ho sakti hai, saaf bataya jaye.
26. **Equal Time (M):** script bhi na ho to scenes barabar waqt mein baante jayein.
27. **Script paste (M):** words/characters ka counter; script ke bagair sirf timing file ya Groq se kaam chalta hai.
28. **Sync ka fine-tune (M):** slider se sab scenes aage peeche.
29. **Transcript edit (M):** text ki galti theek ho, timing na bigre.
30. **Zabaan chunna (M):** script/awaaz ki zabaan chunna (Groq mode mein auto bhi).

## D. Scenes aur media
31. **Smart Sync (M):** jumle = scene, waqt sync raaste se aaye.
32. **Sentences per image (M):** 1, 2, 3, 4 ya Auto.
33. **Scene ki tadaad (M):** upar count dikhe, images kam hon to warning.
34. **Images aur videos ek saath upload (M):** drag and drop, bohat si files.
35. **Auto assign (M):** har scene ko ek media, upload ki tarteeb se.
36. **Auto match + match % (M):** browser CLIP se image/video-frame ko jumle se match; kam % par narangi nishan.
37. **Media badalna aur aage peeche (M):** kisi bhi scene ki file badlo, scenes ki tarteeb badlo.
38. **Chhoti video clip (M):** loop, aakhri frame ruko, ya slow, user chune.
39. **Lambi video clip (M):** hissa chunna, ya agle kai scenes mein baantna.
40. **Clip ki apni awaaz (M):** default band, user khol sake.
41. **Fit aur crop (M):** media ko size mein fit ya crop, jagah chunna.
42. **Bari images khud chhoti (M):** browser crash se bachne ke liye.
43. **Stock links (B):** keywords aur free stock sites ke links.

## E. Timeline
44. **Timeline (M):** clip ki chaurai = screen time, neeche waqt ka scale.
45. **Drag aur resize (M):** kheench kar aage peeche, kinare kheench kar chhota/bara.
46. **Zoom aur playhead (M):** timeline zoom, playhead kheench kar kahin bhi.
47. **Split aur delete (M):** scene ko do mein todna ya hatana.
48. **Audio tracks (M):** awaaz aur music alag tracks mein dikhein.
49. **Snap (B):** kinare ya jumle se khud chipak jaye.

## F. Storyboard aur player
50. **Storyboard (M):** har scene ka thumbnail, jumla, waqt, match %, "badlo" aur "hatao".
51. **Scene text edit (M):** jumla badle to caption bhi badle.
52. **Click par jump (M):** scene dabane par player aur timeline wahan chale jayein.
53. **Player (M):** play, pause, seek, abhi ka waqt.
54. **Matched line aur Scene n/N (M):** jo jumla bol raha ho wo neeche likha ho.
55. **Preview mein sab kuch (M):** transitions, captions, music, awaaz.
56. **Safe zone guides aur full screen (B).**

## G. Transitions
57. **Cut, Fade (M)** aur **Ken Burns (M)** (sthir image mein halka zoom/pan).
58. **Slide, zoom, wipe (B).**
59. **Transition ki lambai (M)** aur sab scenes par ek hi ya alag alag (M).

## H. Captions (bohat zaroori)
60. **Auto captions (M):** timing se, awaaz ke saath sahi waqt par.
61. **Bohat se styles (M):** TikTok bara zard, word-by-word highlight, saaf, box wala, minimal; har ka preview.
62. **Fonts (M):** kai fonts, har zabaan ke liye sahi font (Noto family).
63. **Rang, size, outline, shadow, background (M).**
64. **Position (M):** upar/beech/neeche, drag bhi.
65. **Word highlight (M):** bolte waqt lafz ka rang ya size badle.
66. **Line ki lambai (M):** zabaan ke hisab se sahi jagah line toote.
67. **Captions on/off (M)** aur **caption edit (M).**
68. **SRT download (M).**
69. **Captions ka English tarjuma (B).**

## I. Silence aur safai
70. **Silence hatao button (M):** awaaz ke lambe wakfe kaat do.
71. **Wakfe ki hadd slider (M)** aur hatane se pehle "kitna waqt bachega" dekho (M).
72. **Timing khud theek (M):** scenes, captions, timeline sab sahi rahein.
73. **"Um, uh" hatana (B):** timing file/Groq ke text se.

## J. Music aur awaaz
74. **Music upload, volume, loop (M).**
75. **Ducking (M):** awaaz ke waqt music halki.
76. **Fade in/out (M)** aur **sound effects (B).**

## K. Alag alag zabanein
77. **Har zabaan ka text (M):** timing file/Groq se jo bhi zabaan ho (Groq/Whisper 99 zabanein).
78. **Japanese/Chinese (M):** space ke bagair jumle aur line todna.
79. **Urdu/Arabic (M):** daaen se baaen likhna sahi dikhe.
80. **Har zabaan ka font (M):** warna dabbe aate hain.
81. **Interface ki zabaan (B):** Urdu, Hindi, Arabic, Spanish, Japanese, German, Korean mein bhi.

## L. Output
82. **Teen size (M):** 16:9, 9:16, 1:1.
83. **Quality (M):** 720p aur 1080p.
84. **MP4 render (M)** aur **progress aur rokna (M).**
85. **Captions ke saath aur bina (M).**
86. **Export package ZIP (M):** video, awaaz, music, SRT, scenes ki list; CapCut/Premiere mein aage kaam ke liye. (CapCut ka apna project format closed hai, wada nahi.)
87. **Timeline XML/EDL (B)** aur **thumbnail (B).**

## M. Hifazat, speed, galtiyan
88. **Page na ruke (M):** bhaari kaam Web Worker mein.
89. **Memory ki hadd (M):** bhaari project par pehle warning.
90. **Saaf error messages (M):** file na khule, awaaz khali, key ghalat, limit khatam, memory kam.
91. **Browser support (M):** Chrome/Edge poora; doosron mein jo kam chale uska saaf message.
92. **Phone (B):** sada interface aur warning.
93. **Madad (M):** chhoti guide aur tooltips.
94. **Haqeeqat ki hadden (M):** render ki speed user ke computer par depend karti hai.

## N. Is tool mein NAHI
- Browser Whisper (hata diya), mic recording, projects/save/templates/demo, AI se images ya video banana, awaaz banana (TTS), CapCut ka seedha project export.
- Prompt Generator alag tool hai; baad mein "Send to Video Editor" se jore jayenge.
