import os
import subprocess
import re

def parse_srt(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    blocks = content.strip().split('\n\n')
    subtitles = []
    for block in blocks:
        lines = block.split('\n')
        if len(lines) >= 3:
            # line 1 is time
            time_line = lines[1]
            text = " ".join(lines[2:])
            
            # parse time
            match = re.match(r'(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)', time_line)
            if match:
                h1, m1, s1, ms1 = map(int, match.groups()[:4])
                start_time_ms = (h1 * 3600 + m1 * 60 + s1) * 1000 + ms1
                subtitles.append({'start_ms': start_time_ms, 'text': text})
    return subtitles

def main():
    srt_file = 'query.srt'
    video_file = 'query_final.mp4'
    output_video = 'query_final_voiced.mp4'
    
    subtitles = parse_srt(srt_file)
    audio_files = []
    
    # Pre-generate an empty audio of 1 second so that if there's no subtitles at the very start
    # amix still works properly. But wait, amix automatically extends to longest.
    # It's better to just include the generated TTS files.
    
    for i, sub in enumerate(subtitles):
        text = sub['text']
        start_ms = sub['start_ms']
        audio_file = f'temp_audio_{i}.aiff'
        delayed_audio = f'temp_audio_delayed_{i}.wav'
        
        # generate speech
        # Samantha is generally good, we can use it.
        subprocess.run(['say', '-v', 'Samantha', '-o', audio_file, text], check=True)
        
        # add delay using ffmpeg
        # adelay takes delay in milliseconds. We need to specify delay for all channels
        delay_args = f'{start_ms}:all=1'
        subprocess.run(
            ['ffmpeg', '-y', '-i', audio_file, '-af', f'adelay={delay_args}', delayed_audio], 
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        audio_files.append(delayed_audio)
    
    # Mix all delayed audio files
    if audio_files:
        inputs = []
        for f in audio_files:
            inputs.extend(['-i', f])
        
        weightsStr = " ".join(["1"] * len(audio_files))
        filter_complex = f'amix=inputs={len(audio_files)}:duration=longest:normalize=0:weights={weightsStr}'
        
        print("Mixing audio files...")
        subprocess.run(
            ['ffmpeg', '-y'] + inputs + ['-filter_complex', filter_complex, 'voice.wav'], 
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        
        print("Merging with video...")
        
        subprocess.run(
            ['ffmpeg', '-y', '-i', video_file, '-i', 'voice.wav', 
             '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', 
             '-map', '0:v:0', '-map', '1:a:0', output_video], 
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        
        # Cleanup
        print("Cleaning up temporary files...")
        for f in audio_files:
            if os.path.exists(f):
                os.remove(f)
        for i in range(len(subtitles)):
            if os.path.exists(f'temp_audio_{i}.aiff'):
                os.remove(f'temp_audio_{i}.aiff')
        if os.path.exists('voice.wav'):
            os.remove('voice.wav')
            
        print(f"Success! Output written to {output_video}")
    else:
        print("No subtitles found.")

if __name__ == '__main__':
    main()
