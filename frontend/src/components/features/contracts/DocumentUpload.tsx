import { useState, useCallback, FC } from 'react';
import { Loader } from '../../shared/ui/loader';
import { Button } from '../../shared/ui/button';
import { useModel } from '../../../contexts/ModelContext';
import { useWorkflowStatus } from '../../../hooks/useWorkflowStatus';
import { Upload, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DocumentUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onWorkflowUpdate?: (status: any) => void;
  onUploadStart?: () => void;
  variant?: 'hero' | 'minimal';
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
  onUploadStart,
  variant = 'hero'
}) => {
  const { selectedModel } = useModel();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Agent Pulse: Real-time status tracking
  const { status } = useWorkflowStatus(isUploading, correlationId, 1000);

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    const cId = crypto.randomUUID();
    setCorrelationId(cId);
    setIsUploading(true);
    setUploadResult(null);
    onUploadStart?.();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', selectedModel);
      formData.append('workflow_id', cId);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'X-Correlation-ID': cId
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Upload failed: ${response.status}`);
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
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <input
            id="minimal-file-input"
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <Button 
            onClick={() => document.getElementById('minimal-file-input')?.click()}
            disabled={isUploading}
            className={cn(
              "flex items-center gap-2 font-bold transition-all",
              isUploading ? "bg-slate-200 text-slate-500" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            )}
          >
            {isUploading ? (
              <Loader className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isUploading ? "Ingesting..." : "Upload Contract"}
          </Button>
        </div>

        {/* Horizontal Status Row */}
        {isUploading && (
          <div className="flex items-center gap-6 px-4 py-1.5 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-left-4 duration-500">
            {status?.agent_executions && status.agent_executions.length > 0 ? (
              status.agent_executions.map((exec, i) => (
                <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                  {exec.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    exec.status === 'completed' ? "text-slate-500" : "text-blue-600"
                  )}>
                    {exec.agent_name.replace('Agent', '').trim()}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 italic text-slate-400 text-[11px] font-medium animate-pulse">
                <Clock className="w-3 h-3" />
                Initializing agents...
              </div>
            )}
          </div>
        )}

        {/* Minimal Result Badge */}
        {!isUploading && uploadResult && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border animate-in zoom-in duration-300",
            uploadResult.status === 'success' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          )}>
            {uploadResult.status === 'success' ? "Ready" : "Error"}
          </div>
        )}
      </div>
    );
  }

  // Fallback to Hero Variant
  return (
    <div className="w-full relative overflow-hidden rounded-3xl group min-h-[400px]">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 transition-all duration-700" />
      <div 
        className={cn(
          "relative z-10 p-1 lg:p-1.5 h-full min-h-[400px] border-2 border-dashed rounded-[1.4rem] transition-all flex flex-col items-center justify-center py-12 px-6",
          dragActive ? 'border-white/50 bg-white/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5',
          isUploading ? 'pointer-events-none' : 'cursor-pointer'
        )}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files)}
          className="hidden"
        />
        {isUploading ? (
          <div className="text-center space-y-6">
            <Loader className="mx-auto text-blue-400 w-12 h-12" />
            <h3 className="text-2xl font-bold text-white tracking-tight">Agent Pipeline Active</h3>
            <div className="w-full space-y-3">
              {status?.agent_executions?.map((exec, i) => (
                <div key={i} className="flex items-center justify-center gap-4 text-white/80">
                  <div className={`w-1.5 h-1.5 rounded-full ${exec.status === 'completed' ? 'bg-green-500' : 'bg-blue-400 animate-pulse'}`} />
                  <span className="text-sm font-medium">{exec.agent_name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto border border-white/20">
              <span className="text-4xl">📄</span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Drag & drop contracts or <span className="text-blue-400">browse</span></h3>
            <p className="text-white/40 text-[11px] uppercase font-bold tracking-widest">PDF Documents (Max 50MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};