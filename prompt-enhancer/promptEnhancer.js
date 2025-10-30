// promptEnhancer.js
// CJ + team | Pollinations.ai Prompt Enhancer
// Flow: (prompt + optional image) → image description → enhanced prompt → Pollinations API

const PromptEnhancer = {
  // Cache for image analysis results (keyed by file hash)
  imageCache: new Map(),
  promptCache: new Map(),
  maxCacheSize: 50,

  async enhancePrompt(userPrompt, imageFile = null) {
    try {
      const startTime = performance.now();
      
      // Skip enhancement for very short prompts - return immediately
      if (userPrompt.length < 10) {
        console.log(`⚡ Skipping enhancement for short prompt (${userPrompt.length} chars)`);
        return userPrompt;
      }
      
      // Generate cache key
      const cacheKey = imageFile 
        ? `${userPrompt}:${imageFile.name}:${imageFile.size}:${imageFile.lastModified}`
        : userPrompt;
      
      // Check cache first
      if (this.promptCache.has(cacheKey)) {
        console.log(`✨ Cache hit! Returned in ${(performance.now() - startTime).toFixed(2)}ms`);
        return this.promptCache.get(cacheKey);
      }

      // For simple prompts without images, use minimal enhancement
      if (!imageFile && userPrompt.length < 50) {
        console.log(`⚡ Quick enhancement for simple prompt`);
        const enhanced = await this.quickEnhance(userPrompt);
        this.addToCache(this.promptCache, cacheKey, enhanced);
        console.log(`✅ Enhanced in ${(performance.now() - startTime).toFixed(2)}ms`);
        return enhanced;
      }

      // Step 1: Process image and prompt in parallel
      let imageAnalysisPromise = Promise.resolve("");
      
      if (imageFile) {
        console.log("⚡ Analyzing reference image...");
        
        // Check image cache
        const imgCacheKey = `${imageFile.name}:${imageFile.size}:${imageFile.lastModified}`;
        if (this.imageCache.has(imgCacheKey)) {
          imageAnalysisPromise = Promise.resolve(this.imageCache.get(imgCacheKey));
        } else {
          // Convert to base64 and analyze in parallel - use promise directly
          imageAnalysisPromise = this.toBase64(imageFile)
            .then(base64 => this.analyzeImage(base64, imgCacheKey));
        }
      }

      // Step 2: Wait for image analysis (if any)
      const imageAnalysisPrompt = await imageAnalysisPromise;

      // Step 3: Build ultra-concise enhancement request for 4-5 line output
      const enhanceInstruction = imageAnalysisPrompt 
        ? `Rewrite in exactly 4-5 lines capturing core ideology: "${userPrompt}" + ${imageAnalysisPrompt}`
        : `Rewrite in exactly 4-5 lines capturing core ideology: "${userPrompt}"`;

      // Step 4: Send the enhancement request with random seed
      const seed = Math.floor(Math.random() * 2147483647);
      const enhanced = await this.callPollinations(enhanceInstruction, null, seed);

      // Cache the result
      this.addToCache(this.promptCache, cacheKey, enhanced);
      
      console.log(`✅ Enhanced in ${(performance.now() - startTime).toFixed(2)}ms`);
      return enhanced;
    } catch (err) {
      console.error("Prompt enhancement failed:", err);
      return userPrompt; // fallback
    }
  },

  // Ultra-fast enhancement for simple prompts - 4-5 lines capturing ideology
  async quickEnhance(prompt) {
    const seed = Math.floor(Math.random() * 2147483647);
    const endpoint = `https://text.pollinations.ai/${encodeURIComponent(`Rewrite in exactly 4-5 lines capturing core ideology: ${prompt}`)}?model=openai-fast&seed=${seed}`;
    
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return (await res.text()).trim();
    } catch (err) {
      return prompt; // fallback
    }
  },

  async analyzeImage(base64, cacheKey) {
    // Ultra-concise analysis prompt - just key elements
    const analysisPrompt = `Key visual elements in 1 sentence:`;

    const response = await this.callPollinations(analysisPrompt, base64);
    
    // Cache the result
    this.addToCache(this.imageCache, cacheKey, response);
    
    return response;
  },

  async callPollinations(prompt, imageBase64 = null, seed = null) {
    const seedParam = seed ? `&seed=${seed}` : '';
    // Use the absolute fastest model available
    const endpoint = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai-fast${seedParam}&noCache=true`;
    
    // Use faster model (openai-fast) and streaming disabled for quick response
    if (!imageBase64) {
      // GET request for text-only (faster)
      const res = await fetch(endpoint, {
        method: "GET",
        signal: AbortSignal.timeout(8000) // 8 second timeout (reduced from 10)
      });
      return (await res.text()).trim();
    }

    // POST request for image analysis with aggressive timeout
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
      signal: AbortSignal.timeout(12000) // 12 second timeout (reduced from 15)
    });

    return (await res.text()).trim();
  },

  async toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // LRU cache management
  addToCache(cache, key, value) {
    // Remove oldest entry if cache is full
    if (cache.size >= this.maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    cache.set(key, value);
  },

  // Clear caches manually if needed
  clearCache() {
    this.imageCache.clear();
    this.promptCache.clear();
    console.log("✨ Caches cleared");
  }
};

export default PromptEnhancer;
