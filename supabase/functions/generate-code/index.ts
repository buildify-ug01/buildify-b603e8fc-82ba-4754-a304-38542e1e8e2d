
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the request body
    const body: RequestBody = await req.json();
    const { prompt, apiKeyId } = body;

    if (!prompt || !apiKeyId) {
      return new Response(
        JSON.stringify({ error: "Prompt and API key ID are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get the API key from the database
    const { data: apiKeyData, error: apiKeyError } = await supabaseClient
      .from("api_keys")
      .select("key, provider")
      .eq("id", apiKeyId)
      .eq("is_active", true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
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

    const geminiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Error from Gemini API", details: geminiData }),
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
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (error) {
      // If parsing fails, return the raw text
      return new Response(
        JSON.stringify({ 
          rawResponse: generatedText,
          error: "Failed to parse generated code as JSON"
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});