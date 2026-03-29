# AI Agent Workflow: Video Voiceover and Subtitle Generation

**Target Audience:** AI Agents / LLM Assistants
**Objective:** Systematically take a raw `.mp4` video, generate perfectly synced AI voiceovers based on `.srt` timestamps, and burn the text directly into the final video.

When the USER requests voiceovers or subtitles for a video, follow these deterministic steps exactly as outlined:

---

## Step 1: "View" the Video Context
As an AI Agent, you lack visual media playback capabilities. To gather the necessary timeline data:
1. Locate the target `.mp4` file in the user's workspace using directory listing tools.
2. If the user has not provided them, explicitly ask the USER for the spoken text and their corresponding exact start and end timestamps.
3. *Optional:* Execute `ffprobe -i <video_file>` using terminal tools to ascertain the video's total duration and detect if an existing audio stream needs to be replaced.

## Step 2: Generate the `.srt` SubRip File
With the user's provided text and timings, physically create the subtitle file (e.g., `video.srt`) using file-writing tools. 
- You MUST enforce strict `.srt` syntax: sequential ID, timestamp target, and text.
- Timecode format is strictly `HH:MM:SS,ms --> HH:MM:SS,ms`. Use a comma (`,`) for milliseconds.

**Required Formatting Example:**
```srt
1
00:00:00,500 --> 00:00:07,500
Welcome to CMS! I'll show you how to use our AI schema builder.

2
00:00:08,000 --> 00:00:16,800
First, we'll ask the AI to create a post list query.
```

## Step 3: Run `generate_voice.py`
To generate the voiceover audio clips and map them exactly to the video timeline, execute the `docs/videos/generate_voice.py` script via terminal execution tools.

Choose the correct command parameter based on the user's environment:

**A. Using Free macOS System Voice:**
```bash
python3 docs/videos/generate_voice.py -s <path_to_srt> -v <path_to_input_video> -o <path_to_voiced_video.mp4>
```

**B. Using Premium OpenAI Voice (Preferred):**
If the user provides an OpenAI key or it is found in the workspace configurations (`OPENAI_API_KEY`), execute:
```bash
python3 docs/videos/generate_voice.py -s <path_to_srt> -v <path_to_input_video> -o <path_to_voiced_video.mp4> --engine openai --voice alloy -k "sk-..."
```
*(The script parses the SRT, generates timestamp-accurate speech clips, mixes the audio, and outputs the synced `voiced_video.mp4` file).*

## Step 4: Burn Subtitles and Output Final Video
The final directive is to permanently "burn" (hardcode) the subtitles onto the visual stream so they are guaranteed visible on web players, while retaining the newly generated audio.

Execute the following `ffmpeg` command referencing the *newly voiced video* from Step 3:
```bash
# Wait for the python script in Step 3 to finish before executing this:
ffmpeg -y -i <path_to_voiced_video.mp4> -vf subtitles=<path_to_srt> -c:a copy <final_hardsubbed_video.mp4>
```
**Constraint Checklist for Step 4:**
- Ensure the `-vf subtitles=<srt_file>` filter is correctly pointing to the `.srt` file.
- You MUST include `-c:a copy` to instantly pass through the generated voice track without degrading the audio quality.
- Use command status polling tools to monitor the `ffmpeg` background encoding job until it yields `Exit code: 0`.
