
import { GoogleGenAI } from "@google/genai";
import { AnalysisRequest, Client } from '../types';

// Initialize with environment check - Support both standard and README documented keys
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Gemini API Key is missing. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

interface LabContextData {
  requests: AnalysisRequest[];
  clients: Client[];
  statusBreakdown: Record<string, number>;
}

interface AnalysisPayload {
  sampleType: string;
  title: string;
  keyword: string;
  result: string;
  unit: string;
  range: string;
}

/**
 * Generates lab intelligence insights based on current operational data.
 */
export const getLabIntelligence = async (query: string, labData: LabContextData): Promise<string> => {
  if (!apiKey) return "AI services are not configured.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Laboratory Management Assistant for M-Solutions LIMS. 
      
      User Query: "${query}"
      
      Live Lab Data:
      - Total Active Requests: ${labData.requests.length}
      - Total Registered Clients: ${labData.clients.length}
      - Workload Status: ${JSON.stringify(labData.statusBreakdown)}
      
      Guidelines:
      1. If the User Query is a greeting (e.g., "Hello", "Hi"), respond politely and briefly mention *one* key headline stat (e.g., "You have 5 pending samples today"). Do not provide a full report for a greeting.
      2. For analytical questions, be professional, concise, and evidence-based.
      3. Use bolding (**text**) for key metrics.
      4. Suggest a brief operational fix if you identify bottlenecks (e.g., high pending count).`,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini Intelligence Error:", error);
    return "I'm having trouble connecting to the laboratory intelligence engine right now. Please check your network.";
  }
};

/**
 * Detects anomalies in a specific analysis result using clinical reasoning.
 */
export const detectAnomalies = async (analysis: AnalysisPayload): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Role: Clinical Pathologist Assistant.
      Task: Flag potential anomalies in this test result.
      
      Data:
      - Test: ${analysis.title} (${analysis.keyword})
      - Sample: ${analysis.sampleType}
      - Result: ${analysis.result} ${analysis.unit}
      - Ref Range: ${analysis.range}
      
      Output:
      Provide a single short sentence assessment.
      Examples:
      "Result is critical/panic value; immediate notification required."
      "Result is slightly elevated but likely non-urgent."
      "Result is within normal limits."`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Anomaly Error:", error);
    return null;
  }
};
