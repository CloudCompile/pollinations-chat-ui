import { getApiKey as getStoredApiKey, saveApiKey as saveStoredApiKey } from './storage';

const BASE_URL = 'https://gen.pollinations.ai';
const DEFAULT_API_KEY = import.meta.env.VITE_POLLINATIONS_API_KEY || '';

let textModels = [];
let imageModels = [];
let videoModels = [];
let audioModels = [];
let embeddingModels = [];
let realtimeModels = [];
let abortController = null;
let sessionApiKey = '';

let modelsCache = null;
let modelsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

const normalizeApiKey = (apiKey = '') => (typeof apiKey === 'string' ? apiKey.trim() : '');
const maskApiKey = (apiKey = '') => {
  const key = normalizeApiKey(apiKey);
  if (!key) return '';
  if (key.length < 8) return `${key.slice(0, 2)}***`;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
};
const detectApiKeyType = (apiKey = '') => {
  const key = normalizeApiKey(apiKey);
  if (key.startsWith('pk_')) return 'publishable';
  if (key.startsWith('sk_')) return 'secret';
  return key ? 'unknown' : 'none';
};
const getActiveApiKey = () => normalizeApiKey(sessionApiKey || getStoredApiKey() || DEFAULT_API_KEY);
const buildAuthHeaders = (headers = {}) => {
  const apiKey = getActiveApiKey();
  if (!apiKey) return headers;
  return { ...headers, Authorization: 'Bearer ' + apiKey };
};
const buildGetUrl = (path, params = {}) => {
  const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  const apiKey = getActiveApiKey();
  if (apiKey) url.searchParams.set('key', apiKey);
  return url.toString();
};
const getRealModelName = (modelId) => (typeof modelId === 'string' ? modelId : 'Unknown Model');

const modelFromData = (m, defaults = {}) => {
  const id = typeof m === 'string' ? m : (m.id || m.name || m.model || m.slug || m);
  const inputModalities = m?.inputModalities || m?.input_modalities || defaults.inputModalities || ['text'];
  const outputModalities = m?.outputModalities || m?.output_modalities || defaults.outputModalities || ['text'];
  return {
    id,
    name: (typeof m === 'object' && m.description) ? m.description : getRealModelName(id),
    description: (typeof m === 'object' && (m.description || m.name || m.id)) || String(id),
    type: defaults.type || m?.type || 'text',
    ownedBy: m?.owned_by || m?.ownedBy || 'unknown',
    created: m?.created,
    tier: m?.tier || 'unknown',
    community: Boolean(m?.community),
    supportsVision: m?.vision === true || inputModalities.includes('image'),
    supportsAudio: m?.audio === true || outputModalities.includes('audio') || inputModalities.includes('audio'),
    supportsTools: m?.tools === true || m?.supports_tools === true,
    inputModalities,
    outputModalities,
    pricing: m?.pricing || null,
    paidOnly: Boolean(m?.paid_only || m?.paidOnly),
    reasoningEffort: m?.reasoning_effort || null,
  };
};

const parseApiError = async (response) => {
  try {
    const body = await response.json();
    const msg = body?.error?.message || body?.message || body?.error?.code || response.statusText;
    const code = response.status;
    if (code === 401) return new Error('Invalid or missing API key (401)');
    if (code === 402) return new Error('Insufficient pollen balance or key budget (402)');
    if (code === 403) return new Error('API key lacks required permission (403)');
    if (code === 429) return new Error('Rate limited by Pollinations API (429)');
    return new Error(`API error ${code}: ${msg}`);
  } catch {
    return new Error(`API error ${response.status}: ${response.statusText}`);
  }
};

const toObjectById = (arr = []) => Object.fromEntries(arr.map((m) => [m.id, { name: m.name, ...m }]));

const normalizeModelArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.models)) return data.models;
  return [];
};

export const setApiKey = (apiKey = '') => {
  const key = normalizeApiKey(apiKey);
  sessionApiKey = key;
  saveStoredApiKey(key);
  modelsCache = null;
  modelsCacheTime = null;
  return { key: maskApiKey(key), type: detectApiKeyType(key) };
};

export const getApiKeyState = () => {
  const key = getActiveApiKey();
  return {
    hasKey: Boolean(key),
    key: maskApiKey(key),
    type: detectApiKeyType(key),
    source: sessionApiKey ? 'session' : (getStoredApiKey() ? 'storage' : (DEFAULT_API_KEY ? 'env' : 'none')),
  };
};

export const loadModels = async () => {
  if (modelsCache && modelsCacheTime && (Date.now() - modelsCacheTime < CACHE_DURATION)) {
    return modelsCache;
  }

  const headers = buildAuthHeaders();
  const [textRes, imageRes, audioRes, embeddingsRes] = await Promise.allSettled([
    fetch(`${BASE_URL}/v1/models`, { headers }),
    fetch(`${BASE_URL}/image/models`, { headers }),
    fetch(`${BASE_URL}/audio/models`, { headers }),
    fetch(`${BASE_URL}/embeddings/models`, { headers }),
  ]);

  if (textRes.status === 'fulfilled' && textRes.value.ok) {
    textModels = normalizeModelArray(await textRes.value.json()).map((m) => modelFromData(m, { type: 'text', outputModalities: ['text'] }));
  } else {
    textModels = [];
  }

  if (imageRes.status === 'fulfilled' && imageRes.value.ok) {
    const all = normalizeModelArray(await imageRes.value.json()).map((m) => {
      const model = modelFromData(m, { type: 'image', outputModalities: ['image'] });
      model.type = model.outputModalities.includes('video') ? 'video' : 'image';
      return model;
    });
    imageModels = all.filter((m) => m.type === 'image');
    videoModels = all.filter((m) => m.type === 'video');
  } else {
    imageModels = [];
    videoModels = [];
  }

  if (audioRes.status === 'fulfilled' && audioRes.value.ok) {
    audioModels = normalizeModelArray(await audioRes.value.json()).map((m) => modelFromData(m, { type: 'audio', outputModalities: ['audio'] }));
  } else {
    audioModels = [];
  }

  if (embeddingsRes.status === 'fulfilled' && embeddingsRes.value.ok) {
    embeddingModels = normalizeModelArray(await embeddingsRes.value.json()).map((m) => modelFromData(m, { type: 'embedding', outputModalities: ['embedding'] }));
  } else {
    embeddingModels = [];
  }

  realtimeModels = textModels.filter((model) => model.outputModalities.includes('audio') || /realtime/i.test(model.id));

  const result = { textModels, imageModels, videoModels, audioModels, embeddingModels, realtimeModels };
  modelsCache = result;
  modelsCacheTime = Date.now();
  return result;
};

export const getModels = () => ({ textModels, imageModels, videoModels, audioModels, embeddingModels, realtimeModels });

export const filterModelsByCapabilities = (models = [], filters = {}) => {
  const { type, requiresVision, requiresAudio, inputModality, outputModality, requiresTools } = filters;
  return models.filter((model) => {
    if (type && model.type !== type) return false;
    if (requiresVision && !model.supportsVision) return false;
    if (requiresAudio && !model.supportsAudio && !model.outputModalities.includes('audio')) return false;
    if (inputModality && !model.inputModalities.includes(inputModality)) return false;
    if (outputModality && !model.outputModalities.includes(outputModality)) return false;
    if (requiresTools && !model.supportsTools) return false;
    return true;
  });
};

export const initializeModels = async () => {
  const { textModels: tm, imageModels: im, videoModels: vm, audioModels: am, embeddingModels: em, realtimeModels: rm } = await loadModels();
  return {
    textModels: toObjectById(tm),
    imageModels: toObjectById(im),
    videoModels: toObjectById(vm),
    audioModels: toObjectById(am),
    embeddingModels: toObjectById(em),
    realtimeModels: toObjectById(rm),
  };
};

const getCurrentModelInfo = (modelId) => [...textModels, ...imageModels, ...videoModels, ...audioModels, ...embeddingModels, ...realtimeModels].find((m) => m.id === modelId);

const extractBase64FromDataUrl = (dataUrl) => {
  if (typeof dataUrl !== 'string') return { base64: '', mimeType: null };
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (match) return { base64: match[2], mimeType: match[1] };
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex >= 0) return { base64: dataUrl.slice(commaIndex + 1), mimeType: null };
  return { base64: dataUrl, mimeType: null };
};

export const formatMessagesForAPI = (messages) => messages.map((msg) => {
  const parts = [];
  const textContent = typeof msg.content === 'string' ? msg.content : '';
  if (textContent) parts.push({ type: 'text', text: textContent });

  const attachments = Array.isArray(msg.attachments) ? msg.attachments : [];
  const legacyImage = (!attachments.length && msg.image?.src)
    ? [{ name: msg.image.name || 'image', data: msg.image.src, mimeType: msg.image.mimeType || 'image/png', isImage: true }]
    : [];

  for (const attachment of [...attachments, ...legacyImage]) {
    if (!attachment) continue;
    let base64Data = attachment.data || attachment.base64 || '';
    let mimeType = attachment.mimeType || attachment.type || 'application/octet-stream';

    if (!base64Data && attachment.preview) {
      const extracted = extractBase64FromDataUrl(attachment.preview);
      base64Data = extracted.base64;
      if (extracted.mimeType && !attachment.mimeType) mimeType = extracted.mimeType;
    }
    if (!base64Data && typeof attachment.src === 'string') {
      const extracted = extractBase64FromDataUrl(attachment.src);
      base64Data = extracted.base64;
      if (extracted.mimeType) mimeType = extracted.mimeType;
    }
    if (!base64Data) continue;

    const isImage = attachment.isImage ?? mimeType.startsWith('image/');
    const isAudio = mimeType.startsWith('audio/');
    const isVideo = mimeType.startsWith('video/');

    if (isImage && attachment.preview?.startsWith('http')) {
      parts.push({ type: 'image_url', image_url: { url: attachment.preview } });
      continue;
    }

    if (isImage) {
      parts.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } });
      continue;
    }

    if (isAudio) {
      parts.push({ type: 'input_audio', input_audio: { data: base64Data, format: mimeType.split('/')[1] || 'mp3' } });
      continue;
    }

    if (isVideo) {
      parts.push({ type: 'video_url', video_url: { url: `data:${mimeType};base64,${base64Data}` } });
    }
  }

  if (parts.length === 1 && parts[0].type === 'text') return { role: msg.role, content: parts[0].text };
  if (parts.length > 0) return { role: msg.role, content: parts };
  return { role: msg.role, content: textContent || '' };
});

const containsChartRequest = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return false;
  const content = typeof last.content === 'string' ? last.content.toLowerCase() : '';
  return /(chart|graph|plot|visualiz|scatter|line\s+chart|bar\s+chart|pie\s+chart|histogram|trend)/.test(content);
};

export const sendMessage = async (messages, onChunk, onComplete, onError, modelId, generationConfig = {}) => {
  const selectedModelId = modelId || 'openai-large';
  const { maxTokens = 2000, temperature = 0.7, topP = 1 } = generationConfig;
  const isClaude = selectedModelId.includes('claude');
  const finalTemperature = isClaude ? 1 : temperature;
  const chartRequested = containsChartRequest(messages);
  const currentModel = getCurrentModelInfo(selectedModelId);

  const tools = [{
    type: 'function',
    function: {
      name: 'create_chart',
      description: 'Create a chart or graph visualization from data points.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          data: { type: 'array', items: { type: 'object' } },
          series: {
            type: 'array',
            items: { type: 'object', properties: { key: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' } }, required: ['key', 'name'] },
          },
          xKey: { type: 'string' },
          xLabel: { type: 'string' },
          yLabel: { type: 'string' },
        },
        required: ['title', 'data', 'series', 'xKey'],
      },
    },
  }];

  try {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const requestBody = {
      model: selectedModelId,
      messages: formatMessagesForAPI(messages, selectedModelId),
      max_tokens: maxTokens,
      temperature: finalTemperature,
      tools,
      tool_choice: chartRequested ? { type: 'function', function: { name: 'create_chart' } } : 'auto',
      stream: true,
      stream_options: { include_usage: true },
    };

    if (topP !== 1) requestBody.top_p = topP;
    if (isClaude && currentModel?.reasoningEffort !== 'none') requestBody.reasoning_effort = 'high';

    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) throw await parseApiError(response);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    const functionBuffers = {};
    const collectedFunctionCalls = [];
    let lastFunctionName = null;
    let pendingData = '';
    let sseBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split('\n\n');
      sseBuffer = events.pop() ?? '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;

          const dataString = pendingData ? pendingData + payload : payload;
          let parsed;
          try {
            parsed = JSON.parse(dataString);
            pendingData = '';
          } catch {
            pendingData = dataString;
            continue;
          }

          const delta = parsed?.choices?.[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            fullContent += delta.content;
            if (onChunk) onChunk(delta.content, fullContent, '');
          }

          const toolCall = delta?.tool_calls?.[0];
          if (toolCall?.function) {
            const fn = toolCall.function;
            const name = fn?.name || lastFunctionName || 'unknown_function';
            if (fn?.name) lastFunctionName = fn.name;
            const argChunk = fn?.arguments || '';
            if (!functionBuffers[name]) functionBuffers[name] = '';
            functionBuffers[name] += argChunk;
            try {
              const parsedArgs = JSON.parse(functionBuffers[name]);
              collectedFunctionCalls.push({ name, arguments: typeof parsedArgs === 'string' ? JSON.parse(parsedArgs) : parsedArgs });
              delete functionBuffers[name];
            } catch {
              // keep buffering chunks
            }
          }
        }
      }
    }

    let finalContent = typeof fullContent === 'string'
      ? fullContent.replace(/\s+$/g, '').replace(/\n{3,}/g, '\n\n')
      : fullContent;

    for (const call of collectedFunctionCalls) {
      if (call.name !== 'create_chart') continue;
      try {
        const args = call.arguments;
        finalContent += `\n\n__CHART__${JSON.stringify({ type: 'chart', output: { title: args.title, data: args.data, series: args.series, xKey: args.xKey, xLabel: args.xLabel || 'X Axis', yLabel: args.yLabel || 'Y Axis' } })}__CHART__`;
      } catch {
        // skip malformed tool result
      }
    }

    if (onComplete) onComplete(finalContent, '');
    abortController = null;
    return finalContent;
  } catch (error) {
    abortController = null;
    if (error.name === 'AbortError') {
      if (onError) onError(new Error('User aborted'));
      return null;
    }
    if (onError) onError(error);
    throw error;
  }
};

export const stopGeneration = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

export const generateImage = async (prompt, options = {}) => {
  const { model = 'flux', width = 1024, height = 1024, seed = Math.floor(Math.random() * 2147483647), nologo = false, enhance = false, nofeed = false, safe = false, quality = 'medium' } = options;
  const url = buildGetUrl(`/image/${encodeURIComponent(prompt)}`, { model, width, height, seed, enhance, nologo, nofeed, safe, quality });
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw await parseApiError(response);
  const blob = await response.blob();
  return { url: await blobToDataUrl(blob), prompt, model, width, height, seed };
};

export const editImage = async ({ prompt, imageFile, model = 'kontext', size = '1024x1024', maskFile = null, n = 1 }) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('model', model);
  formData.append('size', size);
  formData.append('n', String(n));
  if (imageFile) formData.append('image', imageFile);
  if (maskFile) formData.append('mask', maskFile);

  const response = await fetch(`${BASE_URL}/v1/images/edits`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });

  if (!response.ok) throw await parseApiError(response);

  const data = await response.json();
  const first = data?.data?.[0]?.url || data?.url || null;
  return { ...data, url: first };
};

export const generateVideo = async (prompt, options = {}) => {
  const { model = 'veo', seed = Math.floor(Math.random() * 2147483647), nologo = false, nofeed = false, duration, aspectRatio, audio } = options;
  const url = buildGetUrl(`/video/${encodeURIComponent(prompt)}`, { model, seed, nologo, nofeed, duration, aspectRatio, audio });
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw await parseApiError(response);
  const blob = await response.blob();
  return { url: await blobToDataUrl(blob), prompt, model, seed };
};

export const generateAudio = async (text, options = {}) => {
  const { voice = 'nova', model = 'openai-audio' } = options;
  const url = buildGetUrl(`/audio/${encodeURIComponent(text)}`, { voice, model });
  const response = await fetch(url, { headers: buildAuthHeaders() });
  if (!response.ok) throw await parseApiError(response);
  const blob = await response.blob();
  const mimeType = blob.type || 'audio/mpeg';
  return { url: await blobToDataUrl(blob), text, voice, model, mimeType };
};

export const transcribeAudio = async (file, options = {}) => {
  const { model = 'openai-audio', responseFormat = 'verbose_json', temperature = 0, prompt = '', language = '' } = options;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  formData.append('response_format', responseFormat);
  formData.append('temperature', String(temperature));
  if (prompt) formData.append('prompt', prompt);
  if (language) formData.append('language', language);

  const response = await fetch(`${BASE_URL}/v1/audio/transcriptions`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });

  if (!response.ok) throw await parseApiError(response);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return { text: await response.text() };
};

export const createEmbeddings = async (input, options = {}) => {
  const { model = 'text-embedding-3-large', encoding_format = 'float', dimensions } = options;
  const payload = { model, input, encoding_format };
  if (dimensions) payload.dimensions = dimensions;

  const response = await fetch(`${BASE_URL}/v1/embeddings`, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await parseApiError(response);
  return response.json();
};

const fetchJson = async (path, params = {}, { includeKeyQuery = false } = {}) => {
  const requestUrl = includeKeyQuery ? buildGetUrl(path, params) : `${BASE_URL}${path}${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`;
  const response = await fetch(requestUrl, { headers: buildAuthHeaders() });
  if (!response.ok) throw await parseApiError(response);
  return response.json();
};

export const getAccountProfile = () => fetchJson('/account/profile');
export const getAccountBalance = () => fetchJson('/account/balance');
export const getAccountUsage = (params = {}) => fetchJson('/account/usage', params);
export const getAccountUsageDaily = (params = {}) => fetchJson('/account/usage/daily', params);
export const getAccountEarnings = (params = {}) => fetchJson('/account/earnings', params);
export const listApiKeys = () => fetchJson('/account/keys');
export const getApiKeyInfo = () => fetchJson('/account/key');
export const getApiKeyUsage = (params = {}) => fetchJson('/account/key/usage', params);

export const getRealtimeWebSocketUrl = (model = 'gpt-realtime-2') => {
  const apiKey = getActiveApiKey();
  const url = new URL('wss://gen.pollinations.ai/v1/realtime');
  url.searchParams.set('model', model);
  if (apiKey) url.searchParams.set('key', apiKey);
  return url.toString();
};
