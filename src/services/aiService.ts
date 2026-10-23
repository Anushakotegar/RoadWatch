import type {
  ComplaintCategory,
  SeverityLevel,
} from '../types';

const API_BASE_URL = '/api';

export interface IssueAnalysis {
  suggestedCategory: ComplaintCategory;
  suggestedSeverity: SeverityLevel;
  observations: string[];
  suggestedDescription: string;
  recommendedAction: string;
  limitations: string;
}

interface AnalysisResponse {
  success?: boolean;
  analysis?: {
    category?: string;
    severity?: string;
    title?: string;
    summary?: string;
    suggestedAction?: string;
    confidence?: number;
    suggestedCategory?: string;
    suggestedSeverity?: string;
    observations?: string[];
    suggestedDescription?: string;
    recommendedAction?: string;
    limitations?: string;
  };
  error?: string;
  message?: string;
  disclaimer?: string;
}

const ALLOWED_CATEGORIES = [
  'Potholes',
  'Streetlights',
  'Drainage',
  'Open Manholes',
  'Water Leaks',
  'Debris & Floods',
] as const;

const ALLOWED_SEVERITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
] as const;

function normalizeCategory(value?: string): ComplaintCategory {
  if (
    value &&
    ALLOWED_CATEGORIES.includes(value as (typeof ALLOWED_CATEGORIES)[number])
  ) {
    return value as ComplaintCategory;
  }

  return 'Drainage' as ComplaintCategory;
}

function normalizeSeverity(value?: string): SeverityLevel {
  if (
    value &&
    ALLOWED_SEVERITIES.includes(value as (typeof ALLOWED_SEVERITIES)[number])
  ) {
    return value as SeverityLevel;
  }

  return 'Medium' as SeverityLevel;
}

export const aiService = {
  async analyzeIssue(
    image: File,
    reportDescription = '',
  ): Promise<IssueAnalysis> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(image.type)) {
      throw new Error('Please upload a JPEG, PNG, or WebP image.');
    }

    if (image.size > 5 * 1024 * 1024) {
      throw new Error('Please choose an image smaller than 5 MB.');
    }

    const imageBase64 = await new Promise<string>(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Could not read the selected image.'));
            return;
          }

          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(new Error('Could not read the selected image.'));
        };

        reader.readAsDataURL(image);
      },
    );

    let response: Response;

    try {
      response = await fetch(
        `${API_BASE_URL}/ai/analyze-issue`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageBase64,
            description: reportDescription.trim(),
          }),
        },
      );
    } catch {
      throw new Error(
        'Cannot connect to RoadWatch. Make sure the backend is running.',
      );
    }

    const data = (await response.json().catch(() => ({}))) as AnalysisResponse;

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          'Image analysis failed. Please try again.',
      );
    }

    if (!data.analysis) {
      throw new Error('The AI did not return an analysis.');
    }

    const analysis = data.analysis;

    return {
      suggestedCategory: normalizeCategory(
        analysis.suggestedCategory ?? analysis.category,
      ),
      suggestedSeverity: normalizeSeverity(
        analysis.suggestedSeverity ?? analysis.severity,
      ),
      observations: analysis.observations ??
        (analysis.summary ? [analysis.summary] : []),
      suggestedDescription:
        analysis.suggestedDescription ??
        analysis.summary ??
        analysis.title ??
        reportDescription.trim(),
      recommendedAction:
        analysis.recommendedAction ??
        analysis.suggestedAction ??
        'Ask the municipal authority to inspect this issue.',
      limitations:
        analysis.limitations ??
        data.disclaimer ??
        'AI suggestions may be incorrect and require human review.',
    };
  },
};
