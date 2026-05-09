import { Session } from "@/types";

export async function generatePracticeSequence(
  session: Session,
  options: {
    selectedRegionIds: string[];
    loopGap: number; // ms
    loopGapEnabled: boolean;
    globalLoopCount: number | "infinite";
    globalRegionRepeatEnabled: boolean;
    globalRegionRepeatCount: number;
  }
) {
  if (!session.audioBlob) throw new Error("No audio data available");

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await session.audioBlob.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const selectedRegions = session.regions.filter(r => options.selectedRegionIds.includes(r.id));
  if (selectedRegions.length === 0) throw new Error("No regions selected for practice");

  const globalReps = options.globalLoopCount === "infinite" ? 1 : options.globalLoopCount;
  const gapDuration = options.loopGapEnabled ? options.loopGap / 1000 : 0;

  // Calculate total duration
  let totalDuration = 0;
  for (let g = 0; g < globalReps; g++) {
    for (const region of selectedRegions) {
      let reps = options.globalRegionRepeatEnabled 
        ? options.globalRegionRepeatCount 
        : (region.repeatCount === "infinite" ? 1 : region.repeatCount) as number;
      
      for (let r = 0; r < reps; r++) {
        totalDuration += (region.end - region.start);
        totalDuration += gapDuration;
      }
    }
  }

  // Create OfflineContext
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(totalDuration * audioBuffer.sampleRate),
    audioBuffer.sampleRate
  );

  let currentTime = 0;

  for (let g = 0; g < globalReps; g++) {
    for (const region of selectedRegions) {
      let reps = options.globalRegionRepeatEnabled 
        ? options.globalRegionRepeatCount 
        : (region.repeatCount === "infinite" ? 1 : region.repeatCount) as number;
      
      for (let r = 0; r < reps; r++) {
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        
        const duration = region.end - region.start;
        source.start(currentTime, region.start, duration);
        
        currentTime += duration;
        currentTime += gapDuration;
      }
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWav(renderedBuffer);
}

// WAV helper (runs instantaneously inside browser)
function bufferToWav(abuffer: AudioBuffer) {
  let numOfChan = abuffer.numberOfChannels;
  let length = abuffer.length * numOfChan * 2 + 44;
  let buffer = new ArrayBuffer(length);
  let view = new DataView(buffer);
  let channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  function setUint16(data: any) { view.setUint16(pos, data, true); pos += 2; }
  function setUint32(data: any) { view.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
  setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
  setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2); setUint16(16);
  setUint32(0x61746164); setUint32(length - pos - 4);

  for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], {type: "audio/wav"});
}

