
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
  analysis?: IssueAnalysis;
  error?: string;
  message?: string;
  requiresHumanReview?: boolean;
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
            imageBase64,
            mimeType: image.type,
            reportDescription: reportDescription.trim(),
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
        data.error || 'Image analysis failed. Please try again.',
      );
    }

    if (!data.analysis) {
      throw new Error('The AI did not return an analysis.');
    }

    return data.analysis;
  },
};
