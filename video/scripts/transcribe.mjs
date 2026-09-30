import path from "node:path";
import fs from "node:fs";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";
const whisperPath = "/tmp/once-whisper";
await installWhisperCpp({ to: whisperPath, version: "1.5.5" });
await downloadWhisperModel({ model: "small.en", folder: whisperPath });
const output = await transcribe({
  inputPath: path.resolve("../artifacts/voiceover/transcription.wav"),
  whisperPath,
  whisperCppVersion: "1.5.5",
  model: "small.en",
  tokenLevelTimestamps: true,
  language: "en",
  additionalArgs: [["-t", "8"]],
  printOutput: false,
});
fs.writeFileSync(
  "../artifacts/voiceover/whisper.json",
  JSON.stringify(output, null, 2),
);
const { captions } = toCaptions({ whisperCppOutput: output });
fs.writeFileSync("public/captions.json", JSON.stringify(captions, null, 2));
console.log(captions.map((c) => c.text).join(""));
