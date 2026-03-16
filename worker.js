self.importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js');

const { pipeline, env } = self.Transformers;
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

async function load(modelName) {
  transcriber = await pipeline('automatic-speech-recognition', modelName, {
    progress_callback: (p) => {
      if (p.status === 'progress' || p.status === 'downloading') {
        self.postMessage({ type: 'dl_progress', progress: p.progress || 0, file: p.file || '' });
      }
    }
  });
  self.postMessage({ type: 'ready' });
}

async function transcribe(audio) {
  const result = await transcriber(audio, {
    return_timestamps: 'word',
    chunk_length_s: 30,
    stride_length_s: 5,
    language: 'english',
    task: 'transcribe',
  });
  self.postMessage({ type: 'result', result });
}

self.onmessage = async (e) => {
  try {
    if (e.data.type === 'load') await load(e.data.model);
    else if (e.data.type === 'transcribe') await transcribe(e.data.audio);
  } catch(err) {
    self.postMessage({ type: 'error', error: err.message });
  }
};
