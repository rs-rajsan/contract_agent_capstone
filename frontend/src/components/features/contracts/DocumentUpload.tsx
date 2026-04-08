import { useState, useCallback, FC } from 'react';
import { Loader } from '../../shared/ui/loader';
import { useModel } from '../../../contexts/ModelContext';
import { useWorkflowStatus } from '../../../hooks/useWorkflowStatus';

interface DocumentUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onWorkflowUpdate?: (status: any) => void;
  onUploadStart?: () => void;
}

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details?: string;
  error?: string;
  error_details?: string;
  final_result?: string;
  model_used: string;
}

export const DocumentUpload: FC<DocumentUploadProps> = ({
  onUploadComplete,
  onUploadStart
}) => {
  const { selectedModel } = useModel();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Use centralized workflow hook
  useWorkflowStatus(isUploading, 500);

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large. Maximum size is 50MB');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', selectedModel);

      const correlationId = crypto.randomUUID();
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'X-Correlation-ID': correlationId
        },
        body: formData
      });

      // Special handling for non-200 responses
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Upload failed: ${response.status}`;
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorJson = await response.json();
          errorMessage = errorJson.detail || errorJson.error || errorMessage;
        } else {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      setUploadResult({
        filename: file.name,
        status: 'error',
        error_details: error instanceof Error ? error.message : 'Upload failed',
        model_used: selectedModel
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedModel, onUploadComplete, onUploadStart]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-500 font-bold';
      case 'review_required': return 'text-yellow-600';
      case 'skipped': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const getStatusMessage = (result: UploadResult) => {
    switch (result.status) {
      case 'success':
        return `✅ Contract created successfully! ID: ${result.contract_id}`;
      case 'error':
        // Try all possible error content fields
        const msg = result.error || result.error_details || result.final_result || result.details || 'Unknown error';
        return `❌ Processing failed: ${msg}`;
      case 'review_required':
        return `⚠️ Manual review required: ${result.details}`;
      case 'skipped':
        return `ℹ️ Document skipped: ${result.details}`;
      default:
        return `📄 Processing completed: ${result.details}`;
    }
  };

  return (
    <div className="w-full relative overflow-hidden rounded-3xl group">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 transition-all duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500 blur-[100px]" />
      </div>

      <div className="relative z-10 p-1 lg:p-1.5 h-full">
        <div 
          className={`
            h-full rounded-[1.4rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6
            ${dragActive ? 'border-white/50 bg-white/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
            ${isUploading ? 'pointer-events-none opacity-80' : 'cursor-pointer'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isUploading ? (
            <div className="space-y-4 text-center">
              <Loader className="mx-auto text-white w-10 h-10" />
              <div className="space-y-1">
                <p className="text-white font-bold text-lg">Intelligent Ingestion in Progress</p>
                <p className="text-white/60 text-sm">Our AI agents are extracting clauses and assessing risks...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center max-w-lg">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <span className="text-4xl">📄</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Drag & drop contracts or <span className="text-blue-400">browse</span>
                </h3>
                <p className="text-white/60 text-sm font-medium">
                  Supported formats: PDF, DOCX (Max 50MB)
                </p>
              </div>

              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm shadow-xl hover:bg-blue-50 transition-colors">
                  Upload & Analyze
                </div>
              </div>

              <div className="pt-6 flex justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Secure AES-256</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Model: {selectedModel}</span>
                </div>
              </div>
            </div>
          )}

          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Upload Result Overlay (Toast-like) */}
      {uploadResult && (
        <div className="absolute bottom-4 right-4 z-50 animate-in slide-in-from-right-10 duration-500 max-w-xs">
          <div className={`p-4 rounded-xl border-2 backdrop-blur-xl shadow-2xl glass ${getStatusColor(uploadResult.status)}`}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1">Upload Notification</p>
            <p className="text-[11px] font-medium opacity-90 leading-tight">
              {uploadResult.filename}: {getStatusMessage(uploadResult)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};