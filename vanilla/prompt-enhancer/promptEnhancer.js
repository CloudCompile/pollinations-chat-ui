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
      
      // Generate cache key
      const cacheKey = imageFile 
        ? `${userPrompt}:${imageFile.name}:${imageFile.size}:${imageFile.lastModified}`
        : userPrompt;
      
      // Check cache first
      if (this.promptCache.has(cacheKey)) {
        console.log(`✨ Cache hit! Returned in ${(performance.now() - startTime).toFixed(2)}ms`);
        return this.promptCache.get(cacheKey);
      }

      // Step 1: Process image and prompt in parallel
      let imageAnalysisPromise = Promise.resolve("");
      let base64Promise = Promise.resolve(null);
      
      if (imageFile) {
        console.log("⚡ Analyzing reference image...");
        
        // Check image cache
        const imgCacheKey = `${imageFile.name}:${imageFile.size}:${imageFile.lastModified}`;
        if (this.imageCache.has(imgCacheKey)) {
          imageAnalysisPromise = Promise.resolve(this.imageCache.get(imgCacheKey));
        } else {
          // Convert to base64 and analyze in parallel
          base64Promise = this.toBase64(imageFile);
          imageAnalysisPromise = base64Promise.then(base64 => 
            this.analyzeImage(base64, imgCacheKey)
          );
        }
      }

      // Step 2: Wait for image analysis (if any)
      const imageAnalysisPrompt = await imageAnalysisPromise;

      // Step 3: Build concise enhancement request
      const enhanceInstruction = imageAnalysisPrompt 
        ? `Enhance this prompt with visual details: "${userPrompt}"\nVisual ref: ${imageAnalysisPrompt}\nReturn only enhanced prompt.`
        : `Enhance this image/video generation prompt with vivid details: "${userPrompt}"\nReturn only enhanced prompt.`;

      // Step 4: Send the enhancement request with random seed to prevent caching
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

  async analyzeImage(base64, cacheKey) {
    // Concise analysis prompt for speed
    const analysisPrompt = `Describe this image's key visual elements, mood, and style in 2-3 sentences.`;

    const response = await this.callPollinations(analysisPrompt, base64);
    
    // Cache the result
    this.addToCache(this.imageCache, cacheKey, response);
    
    return response;
  },

  async callPollinations(prompt, imageBase64 = null, seed = null) {
    const seedParam = seed ? `&seed=${seed}` : '';
    const endpoint = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai-fast${seedParam}`;
    
    // Use faster model (openai-fast) and streaming disabled for quick response
    if (!imageBase64) {
      // GET request for text-only (faster)
      const res = await fetch(endpoint, {
        method: "GET",
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      return (await res.text()).trim();
    }

    // POST request for image analysis
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
      signal: AbortSignal.timeout(15000) // 15 second timeout for image
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
