import { FunctionCallingConfigMode } from "@google/genai";

import { ai } from "./ai/config.js";
import { PROGOVA_SYSTEM_INSTRUCTION } from "./ai/prompts.js";
import { PROGOVA_TOOLS, runToolCall } from "./ai/tools.js";
import { requireAuth } from "./middleware/authMiddleware.js";

const extractThoughtSignatureMap = (initialResponse) => {
  const parts =
    initialResponse?.candidates?.[0]?.content?.parts?.filter(
      (part) => part && part.functionCall
    ) || [];

  const thoughtSignatureMap = {};

  for (const part of parts) {
    if (part && part.functionCall && part.thoughtSignature) {
      thoughtSignatureMap[part.functionCall.id || part.functionCall.name] =
        part.thoughtSignature;
    }
  }

  return thoughtSignatureMap;
};

export const generateChatReply = async (message, currentUser = null) => {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("Message is required.");
  }

  const cleanedMessage = message.trim();

  const initialResponse = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [{ role: "user", parts: [{ text: cleanedMessage }] }],
    config: {
      systemInstruction: PROGOVA_SYSTEM_INSTRUCTION,
      tools: PROGOVA_TOOLS,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });

  const toolCalls = Array.isArray(initialResponse?.functionCalls)
    ? initialResponse.functionCalls
    : [];

  if (!toolCalls.length) {
    return {
      reply: initialResponse?.text || "I could not generate a response.",
      data: [],
    };
  }

  const thoughtSignatureMap = extractThoughtSignatureMap(initialResponse);

  const toolResults = [];

  for (const toolCall of toolCalls) {
    const toolName = toolCall?.name;
    const toolArgs = toolCall?.args || {};
    const result = await runToolCall(toolName, toolArgs, { user: currentUser });

    toolResults.push({
      id: toolCall.id || toolName,
      name: toolName,
      response: result,
    });
  }

  const followUpResponse = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: [
      { role: "user", parts: [{ text: cleanedMessage }] },
      {
        role: "model",
        parts: toolCalls.map((toolCall) => ({
          functionCall: toolCall,
          thoughtSignature:
            thoughtSignatureMap[toolCall.id || toolCall.name] || undefined,
        })),
      },
      {
        role: "user",
        parts: toolResults.map((toolResult) => ({
          functionResponse: {
            id: toolResult.id,
            name: toolResult.name,
            response: toolResult.response,
          },
        })),
      },
    ],
    config: {
      systemInstruction: PROGOVA_SYSTEM_INSTRUCTION,
    },
  });

  return {
    reply:
      followUpResponse?.text ||
      "I could not generate a final response using the available PROGOVA data.",
    data: toolResults.map((toolResult) => toolResult.response),
  };
};

export const handleChatMessage = async (message, currentUser = null) => {
  return generateChatReply(message, currentUser);
};

export const handleChatRequest = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message is required.",
      });
    }

    const result = await generateChatReply(message.trim(), req.user || null);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Chat request failed:", error);

    return res.status(500).json({
      error: "Failed to get AI response.",
    });
  }
};

export { requireAuth };

export default handleChatMessage;
