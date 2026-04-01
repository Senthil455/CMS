import os
import subprocess

directory = 'output/v1/'
videos = [
    ('setup.mp4', 'setup.srt'),
    ('entity-design.mp4', 'entity-design.srt'),
    ('query.mp4', 'query.srt'),
    ('list.mov', 'list.srt'),
    ('detail-page.mov', 'detail-page.srt'),
    ('engagement-bar.mp4', 'engagement-bar.srt')
]

tmp_dir = os.path.join(directory, 'tmp')
os.makedirs(tmp_dir, exist_ok=True)

def get_duration(file_path):
    cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    return float(result.stdout.strip())

def parse_time(t_str):
    t_str = t_str.strip()
    parts = t_str.split(',')
    milliseconds = int(parts[1]) if len(parts) > 1 else 0
    time_parts = parts[0].split(':')
    hours = int(time_parts[0])
    minutes = int(time_parts[1])
    seconds = int(time_parts[2])
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0

def format_time(seconds_float):
    hours = int(seconds_float // 3600)
    minutes = int((seconds_float % 3600) // 60)
    seconds = int(seconds_float % 60)
    milliseconds = int(round((seconds_float - int(seconds_float)) * 1000))
    if milliseconds >= 1000:
        seconds += 1
        milliseconds -= 1000
    if seconds >= 60:
        minutes += 1
        seconds -= 60
    if minutes >= 60:
        hours += 1
        minutes -= 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"

def shift_srt_content(content, offset_seconds, start_index):
    lines = content.strip().split('\n')
    new_lines = []
    i = 0
    idx = start_index
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            new_lines.append("")
            i += 1
            continue
        if line.isdigit():
            new_lines.append(str(idx))
            idx += 1
            i += 1
            if i < len(lines):
                ts_line = lines[i]
                parts = ts_line.split(' --> ')
                if len(parts) == 2:
                    start_t = parse_time(parts[0]) + offset_seconds
                    end_t = parse_time(parts[1]) + offset_seconds
                    new_lines.append(f"{format_time(start_t)} --> {format_time(end_t)}")
                else:
                    new_lines.append(ts_line)
                i += 1
                while i < len(lines) and lines[i].strip() != "":
                    new_lines.append(lines[i].strip())
                    i += 1
        else:
            new_lines.append(line)
            i += 1
    return '\n'.join(new_lines), idx

transcoded_files = []
cumulative_duration = 0.0
merged_srt_content = ""
current_idx = 1

for vid_file, srt_file in videos:
    vid_path = os.path.join(directory, vid_file)
    srt_path = os.path.join(directory, srt_file)
    tmp_out = os.path.join(tmp_dir, f"uniform_{vid_file}.mp4")
    
    # Check if tmp_out exists, if not, transcode
    if not os.path.exists(tmp_out):
        print(f"Transcoding {vid_file} to 1920x1200@30fps...")
        subprocess.run([
            "ffmpeg", "-y", "-i", vid_path,
            "-vf", "scale=1920:1200:force_original_aspect_ratio=decrease,pad=1920:1200:(ow-iw)/2:(oh-ih)/2,fps=30",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-an", tmp_out
        ], check=True)
    else:
        print(f"Skipping transcode for {vid_file}, already exists.")
    
    dur = get_duration(tmp_out)
    print(f"Duration of {tmp_out}: {dur:.2f}s")
    transcoded_files.append(tmp_out)
    
    with open(srt_path, 'r', encoding='utf-8') as f:
        srt_content = f.read()
    
    shifted_content, next_idx = shift_srt_content(srt_content, cumulative_duration, current_idx)
    merged_srt_content += shifted_content + "\n\n"
    
    current_idx = next_idx
    cumulative_duration += dur

merged_srt_path = os.path.join(directory, 'merged.srt')
with open(merged_srt_path, 'w', encoding='utf-8') as f:
    f.write(merged_srt_content.strip())
print("Merged SRT generated at", merged_srt_path)

concat_file = os.path.join(tmp_dir, 'concat.txt')
with open(concat_file, 'w') as f:
    for tf in transcoded_files:
        f.write(f"file '{tf}'\n")

final_silent = os.path.join(directory, 'final_silent.mp4')
print("Concatenating videos...")
subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file,
    "-c", "copy", final_silent
], check=True)
print("Final silent video generated at", final_silent)

print("Generating voiceover using generate_voice.py...")
key = os.environ.get("OPENAI_API_KEY")
if not key:
    print("Error: OPENAI_API_KEY environment variable not set.")
    exit(1)

final_voiced = os.path.join(directory, "final_voiced.mp4")
subprocess.run([
    "python3", "../../generate_voice.py",
    "-s", merged_srt_path,
    "-v", final_silent,
    "-o", final_voiced,
    "--engine", "openai",
    "--voice", "alloy",
    "-k", key
], check=True)
print("Voiceover generated at", final_voiced)

print("Burning subtitles...")
final_demo = os.path.join(directory, "final_demo.mp4")
subprocess.run([
    "ffmpeg", "-y", "-i", final_voiced,
    "-vf", f"subtitles={os.path.basename(merged_srt_path)}",
    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-c:a", "copy",
    final_demo
], check=True, cwd=directory)
print("Pipeline completely finished: final_demo.mp4 is ready!")
