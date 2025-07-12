
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

interface RequestBody {
  prompt: string;
  apiKeyId: string;
}

// Cache for API keys to reduce database queries
const apiKeyCache = new Map<string, { key: string; provider: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the request body
    const body: RequestBody = await req.json();
    const { prompt, apiKeyId } = body;

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!apiKeyId) {
      return new Response(
        JSON.stringify({ error: "API key ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if API key is in cache and not expired
    let apiKeyData;
    const now = Date.now();
    const cachedApiKey = apiKeyCache.get(apiKeyId);
    
    if (cachedApiKey && (now - cachedApiKey.timestamp) < CACHE_TTL) {
      apiKeyData = { key: cachedApiKey.key, provider: cachedApiKey.provider };
    } else {
      // Get the API key from the database
      const { data, error } = await supabaseClient
        .from("api_keys")
        .select("key, provider")
        .eq("id", apiKeyId)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Invalid or inactive API key" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      apiKeyData = data;
      
      // Update the cache
      apiKeyCache.set(apiKeyId, { 
        key: data.key, 
        provider: data.provider,
        timestamp: now
      });
    }

    // Use the Gemini API to generate code
    const geminiApiKey = apiKeyData.key;
    const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    
    const geminiResponse = await fetch(`${geminiUrl}?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate React code for the following request: ${prompt}. 
                Return only the code without explanations. Format the response as a JSON object with the following structure:
                {
                  "files": [
                    {
                      "path": "src/components/Example.tsx",
                      "content": "// Code content here"
                    }
                  ]
                }`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      return new Response(
        JSON.stringify({ 
          error: "Error from Gemini API", 
          details: geminiData,
          status: geminiResponse.status
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from Gemini API",
          details: geminiData
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Extract the generated code from the Gemini response
    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Try to parse the JSON response
    let parsedCode;
    try {
      // Find JSON object in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedCode = JSON.parse(jsonMatch[0]);
        
        // Validate the structure
        if (!parsedCode.files || !Array.isArray(parsedCode.files)) {
          throw new Error("Invalid response structure");
        }
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (error) {
      // If parsing fails, return the raw text
      return new Response(
        JSON.stringify({ 
          rawResponse: generatedText,
          error: "Failed to parse generated code as JSON: " + error.message
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify(parsedCode),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});