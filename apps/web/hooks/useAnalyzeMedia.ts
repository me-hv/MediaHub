import { useMutation } from '@tanstack/react-query';
import { ApiService } from '../services/api.service';
import { MediaMetadata } from '@mediahub/types';

export function useAnalyzeMedia() {
  return useMutation<MediaMetadata, Error, { url: string }>({
    mutationFn: ({ url }) => ApiService.analyzeMedia(url),
  });
}
