# Once narrated submission video

Remotion composition `OnceNarrated`, 1920 x 1080, 30 fps, approximately 2 minutes 9 seconds. It combines the owner's recorded narration, fresh public-demo footage, captions, and animated introduction, comparison, benchmark, and AWS architecture scenes.

## Preview and render

```bash
cd video
npm ci
npm run dev
npm run render
```

The output is `../artifacts/live-video/once-narrated.mp4`. Scene boundaries are in `src/timing.json`; captions use the Remotion Caption JSON shape in `src/captions.json`. Each main scene has a separate component under `src/scenes`. Inter is bundled locally under the SIL Open Font License, included with the font. The preview currently runs at http://localhost:3010/OnceNarrated.

## Local media

Media is excluded from Git. The preparation workspace contains `public/media/voiceover.wav`, `demo.mp4`, and `verified-run.png`. The original supplied MP3 is preserved separately, without modification. A 70 Hz high-pass and speech loudness normalization were applied to the working copy. The narration keeps its natural pace and pitch; no generated voice or background music was added.

To rebuild the footage from the current public application, run this from the repository root:

```bash
docker run --rm --network host --user "$(id -u):$(id -g)" \\
  -e ONCE_API_ORIGIN=https://tpuqe8scax.us-east-1.awsapprunner.com \\
  -e ONCE_VIDEO_CLEAN=1 -e ONCE_VIDEO_DIR=artifacts/clean-video \\
  -v "$PWD:/app" -w /app mcr.microsoft.com/playwright:v1.63.0-noble npm run record:demo
ffmpeg -i artifacts/clean-video/once-walkthrough.webm -c:v libx264 \\
  -crf 20 -pix_fmt yuv420p video/public/media/demo.mp4
cp artifacts/clean-video/verified-run.png video/public/media/verified-run.png
ffmpeg -i /path/to/your-recording.mp3 \\
  -af 'highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11' \\
  -ar 48000 -c:a pcm_s16le video/public/media/voiceover.wav
```

For different narration, regenerate timing and captions. `scripts/transcribe.mjs` uses local Whisper.cpp 1.5.5 and the small.en model, reading `../artifacts/voiceover/transcription.wav`. `scripts/align-captions.py` aligns the supplied script to those measured word timestamps. The final caption phrases were reviewed for technical names and readability. Recognition does not send the recording to an external transcription service.

## Evidence and editing scope

The footage is an actual unauthenticated browser recording of the public AWS application. Recording and L4 comparison outcomes are asserted, including all six business checks and downloadable PNG/PDF evidence. Clean-footage metadata is saved under `artifacts/clean-video/recording.json`, with markers for aligning the edit.

Footage is trimmed and retimed to fit narration. The verification scene includes the actual successful run screenshot. The benchmark card reports the previously preserved public N=30 experiment, rather than implying the edited video contains thirty executions. Semantic binding uses predefined equivalent labels. Bedrock and AgentCore remain live-unverified; the AWS card states that boundary explicitly. No application runtime changes are required for this video.
