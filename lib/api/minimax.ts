const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

export interface BaseResp {
  status_code: number;
  status_msg: string;
}

export interface MiniMaxResponse<T> {
  base_resp: BaseResp;
  data?: T;
  task_id?: string;
  file_id?: string;
  extra_info?: any;
}

async function fetchMiniMax<T>(endpoint: string, body: any): Promise<MiniMaxResponse<T>> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY is not configured');
  }

  const response = await fetch(`https://api.minimax.io${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (data.base_resp?.status_code !== 0) {
    throw new Error(`MiniMax API business error: ${data.base_resp?.status_msg}`);
  }

  return data;
}

export const minimax = {
  /**
   * Music Generation (music-2.5)
   */
  generateMusic: async (params: {
    lyrics: string;
    prompt?: string;
    output_format?: 'url' | 'hex';
  }) => {
    return fetchMiniMax<any>('/v1/music_generation', {
      model: 'music-2.5',
      lyrics: params.lyrics,
      prompt: params.prompt,
      stream: false,
      output_format: params.output_format || 'url',
      audio_setting: {
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3',
      },
    });
  },

  /**
   * Video Generation (MiniMax-Hailuo-02)
   * Supports start and end frame transition.
   */
  generateVideo: async (params: {
    prompt: string;
    first_frame_image?: string;
    last_frame_image: string;
    duration?: 6 | 10;
    resolution?: '768P' | '1080P';
  }) => {
    return fetchMiniMax<any>('/v1/video_generation', {
      model: 'MiniMax-Hailuo-02',
      prompt: params.prompt,
      first_frame_image: params.first_frame_image,
      last_frame_image: params.last_frame_image,
      duration: params.duration || 6,
      resolution: params.resolution || '768P',
      prompt_optimizer: true,
    });
  },

  /**
   * Image Generation (image-01)
   * Supports Text-to-Image and Image-to-Image (character reference).
   */
  generateImage: async (params: {
    prompt: string;
    subject_reference?: Array<{ type: 'character'; image_file: string }>;
    aspect_ratio?: string;
    response_format?: 'url' | 'base64';
    n?: number;
  }) => {
    return fetchMiniMax<any>('/v1/image_generation', {
      model: 'image-01',
      prompt: params.prompt,
      subject_reference: params.subject_reference,
      aspect_ratio: params.aspect_ratio || '1:1',
      response_format: params.response_format || 'url',
      n: params.n || 1,
      prompt_optimizer: true,
    });
  },

  /**
   * Query Video Task Status
   */
  queryVideoTask: async (taskId: string) => {
    const response = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`MiniMax Query error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Retrieve File Info (to get download URL)
   */
  retrieveFile: async (fileId: string) => {
    const response = await fetch(`https://api.minimax.io/v1/files/retrieve?file_id=${fileId}`, {
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`MiniMax File Retrieve error: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Text Generation / Chat (MiniMax Text Chat API V2)
   */
  generateText: async (params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string; name?: string }>;
    model?: string;
  }) => {
    return fetchMiniMax<any>('/v1/text/chatcompletion_v2', {
      model: params.model || 'M2-her',
      messages: params.messages,
      stream: false,
    });
  }
};
