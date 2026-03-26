import axios from 'axios';

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1';
const MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';

// Helper function to call Featherless AI
const callFeatherlessAI = async (messages, temperature = 0.7) => {
  try {
    const response = await axios.post(
      `${FEATHERLESS_BASE_URL}/chat/completions`,
      {
        model: MODEL,
        messages,
        temperature,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${FEATHERLESS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Featherless AI API Error:', error.response?.data || error.message);
    throw error;
  }
};

// TASK 1: Classify complaint into category, department, severity
export const classifyComplaint = async (text, imageDescription = '') => {
  try {
    const prompt = `You are a civic complaint classifier. Analyze the complaint and respond in JSON format ONLY.

Complaint: ${text}
${imageDescription ? `Image Description: ${imageDescription}` : ''}

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "category": one of ["Road", "Water", "Electricity", "Sanitation", "Public Safety", "Other"],
  "department": one of ["PWD", "Water Board", "BESCOM", "BBMP", "Police", "Municipal Corp"],
  "severity": one of ["low", "medium", "high", "urgent"],
  "summary": "one clear sentence describing the issue"
}`;

    const response = await callFeatherlessAI([{ role: 'user', content: prompt }], 0.3);
    const parsed = JSON.parse(response);
    return parsed;
  } catch (error) {
    console.error('Error classifying complaint:', error.message);
    // Fallback response
    return {
      category: 'Other',
      department: 'Municipal Corp',
      severity: 'medium',
      summary: text.substring(0, 100)
    };
  }
};

// TASK 2: Generate Action Taken Report (ATR)
export const generateATR = async (complaint, resolutionNote) => {
  try {
    const prompt = `Generate a formal Action Taken Report (ATR) based on the following:

Complaint Title: ${complaint.title}
Complaint Description: ${complaint.description}
Category: ${complaint.category}
Location: ${complaint.location}
Official's Resolution Note: ${resolutionNote}

Format the ATR with these sections (use exact headers):
ISSUE: [brief statement of the issue]
ACTION TAKEN: [what was done to resolve]
RESOLUTION DATE: [date resolved]
DEPARTMENT: ${complaint.category || 'N/A'}
STATUS: Resolved

Keep it professional and concise (max 300 words).`;

    const atrText = await callFeatherlessAI([{ role: 'user', content: prompt }], 0.5);
    return atrText;
  } catch (error) {
    console.error('Error generating ATR:', error.message);
    // Fallback ATR
    return `ISSUE: ${complaint.title}\nACTION TAKEN: ${resolutionNote}\nRESOLUTION DATE: ${new Date().toLocaleDateString()}\nDEPARTMENT: ${complaint.category}\nSTATUS: Resolved`;
  }
};

// TASK 3: Predict resolution time based on category and severity
export const predictResolutionTime = async (category, severity) => {
  try {
    const severityMap = {
      'low': 7,
      'medium': 5,
      'high': 3,
      'urgent': 1
    };

    const categoryDaysMap = {
      'Road': 5,
      'Water': 7,
      'Electricity': 3,
      'Sanitation': 4,
      'Public Safety': 2,
      'Other': 7
    };

    const baseDays = categoryDaysMap[category] || 7;
    const severityModifier = severityMap[severity?.toLowerCase()] || 5;
    const estimatedDays = Math.ceil((baseDays + severityModifier) / 2);

    const prompt = `Given a complaint about "${category}" with severity "${severity}", suggest a helpful message about expected resolution time. Keep it to 1-2 sentences.`;
    const message = await callFeatherlessAI([{ role: 'user', content: prompt }], 0.5);

    return {
      days: estimatedDays,
      message: message || `Expected resolution within ${estimatedDays} business days.`
    };
  } catch (error) {
    console.error('Error predicting resolution time:', error.message);
    const defaultDays = 7;
    return {
      days: defaultDays,
      message: `Expected resolution within ${defaultDays} business days.`
    };
  }
};

// TASK 4: Chatbot response to user queries about their complaints
export const chatbotResponse = async (userMessage, complaints = []) => {
  try {
    const complaintsSummary = complaints
      .map(c => `- ${c.title} (${c.status}, ${c.category}, ${c.severity})`)
      .join('\n');

    const prompt = `You are a helpful citizen support chatbot for a grievance portal. A user is asking about their complaints.

User Message: "${userMessage}"

Their Complaints:
${complaintsSummary || 'No active complaints'}

Provide a helpful, empathetic response (1-3 sentences). Be conversational and supportive.`;

    const response = await callFeatherlessAI([{ role: 'user', content: prompt }], 0.7);
    return response;
  } catch (error) {
    console.error('Error generating chatbot response:', error.message);
    // Fallback response
    return 'Thank you for reaching out! We are working on resolving your complaint as quickly as possible. You can track the status on your dashboard.';
  }
};

export default {
  classifyComplaint,
  generateATR,
  predictResolutionTime,
  chatbotResponse
};
