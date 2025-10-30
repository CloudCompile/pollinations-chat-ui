// promptEnhancer.js
// CJ + team| Pollinations.ai Prompt Enhancer
// Flow: (prompt + optional image) → image description → enhanced prompt → Pollinations API

const PromptEnhancer = {
  async enhancePrompt(userPrompt, imageFile = null) {
    try {
      // Step 1: If there’s an image, analyze it first
      let imageAnalysisPrompt = "";
      if (imageFile) {
        console.log("Analyzing reference image...");
        imageAnalysisPrompt = await this.analyzeImage(imageFile);
      }

      // Step 2: Combine user prompt + image analysis into enhancement request
      const enhanceInstruction = `
You are an expert creative AI prompt optimizer. 
Given a user prompt and an optional visual reference description, merge them into a single, vivid, balanced prompt suitable for image or video generation.

User prompt: "${userPrompt}"
Visual reference: "${imageAnalysisPrompt || 'none'}"

Return only the enhanced prompt text.
      `.trim();

      // Step 3: Send the enhancement request to the Pollinations endpoint
      const enhanced = await this.callPollinations(enhanceInstruction);

      return enhanced;
    } catch (err) {
      console.error("Prompt enhancement failed:", err);
      return userPrompt; // fallback
    }
  },

  async analyzeImage(imageFile) {
    // Convert the image to base64 for transport
    const base64 = await this.toBase64(imageFile);

    // Pollinations (or OpenAI large model) image-to-text description
    const analysisPrompt = `
Describe this image in a detailed, artistic, conceptual way.
Include visual elements, mood, and aesthetic details.
    `.trim();

    const response = await this.callPollinations(analysisPrompt, base64);
    return response;
  },

  async callPollinations(prompt, imageBase64 = null) {
    const endpoint = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=gemini&token=TOEAP3DuMvvVHUsy`;
    const body = imageBase64 ? { image: imageBase64 } : undefined;

    const res = await fetch(endpoint, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    return text.trim();
  },

  async toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export default PromptEnhancer;
