import { EnhancedSearchParams } from '../components/search/EnhancedSearchInterface';
import { apiRequest } from './apiClient';

const DEFAULT_MODEL = import.meta.env.VITE_DEFAULT_MODEL || 'gemini-2.5-flash';

export interface EnhancedSearchResponse {
  success: boolean;
  search_level: string;
  results: any[];
}

export interface SectionType {
  value: string;
  label: string;
  description: string;
}

class EnhancedSearchApi {
  
  async searchContracts(params: EnhancedSearchParams): Promise<EnhancedSearchResponse> {
    return apiRequest<EnhancedSearchResponse>('/api/contracts/search/enhanced', {
      method: 'POST',
      body: JSON.stringify({
        search_level: params.searchLevel,
        query: params.query || null,
        clause_types: params.clauseTypes.length > 0 ? params.clauseTypes : null,
        section_types: params.sectionTypes.length > 0 ? params.sectionTypes : null,
        parties: params.parties.length > 0 ? params.parties : null,
        contract_type: params.contractType || null,
        active: params.active
      })
    });
  }

  async getClauseTypes(): Promise<string[]> {
    const data = await apiRequest<{clause_types: string[]}>('/api/contracts/search/clause-types');
    return data.clause_types;
  }

  async getSectionTypes(): Promise<SectionType[]> {
    const data = await apiRequest<{section_types: SectionType[]}>('/api/contracts/search/section-types');
    return data.section_types;
  }

  async uploadEnhancedDocument(
    file: File, 
    model: string = DEFAULT_MODEL, 
    enableEmbeddings: boolean = true
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest(`/api/documents/enhanced/upload?model=${model}&enable_embeddings=${enableEmbeddings}`, {
      method: 'POST',
      body: formData
    });
  }

  async getEmbeddingStatus(contractId: string): Promise<any> {
    return apiRequest(`/api/documents/enhanced/embedding-status/${contractId}`);
  }
}

export const enhancedSearchApi = new EnhancedSearchApi();

export const enhancedSearchApi = new EnhancedSearchApi();