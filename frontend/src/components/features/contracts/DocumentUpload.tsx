import React, { useState, useCallback } from 'react';
import { Button } from '../../shared/ui/button';
import { Card } from '../../shared/ui/card';
import { Loader } from '../../shared/ui/loader';
import { Badge } from '../../shared/ui/badge';
import { 
  Zap,
  Clock, 
  Brain, 
  XCircle, 
  FileText, 
  AlertTriangle, 
  Shield, 
  Wifi, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DocumentUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  modelSelection?: string;
  onWorkflowUpdate?: (status: any) => void;
  onUploadStart?: () => void;
  variant?: 'default' | 'minimal';
  currentStatus?: string;
}

interface UploadResult {
  filename: string;
  status: string;
  contract_id?: string;
  details: string;
  model_used: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  modelSelection = import.meta.env.VITE_DEFAULT_MODEL || "gemini-2.5-flash",
  onWorkflowUpdate,
  onUploadStart,
  variant = 'default',
  currentStatus
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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

    // Start polling for workflow status
    const pollWorkflow = setInterval(async () => {
      try {
        const workflowResponse = await fetch('/api/workflow/status');
        if (workflowResponse.ok) {
          const workflowData = await workflowResponse.json();
          onWorkflowUpdate?.(workflowData);
        }
      } catch (e) {
        // Ignore workflow polling errors
      }
    }, 500);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', modelSelection);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      let result: UploadResult;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`);
      }
      setUploadResult(result);

      if (onUploadComplete) {
        onUploadComplete(result);
      }

      // Final workflow status update
      setTimeout(async () => {
        try {
          const workflowResponse = await fetch('/api/workflow/status');
          if (workflowResponse.ok) {
            const workflowData = await workflowResponse.json();
            onWorkflowUpdate?.(workflowData);
          }
        } catch (e) {
          // Ignore final workflow polling error
        }
      }, 1000);

    } catch (error) {
      setUploadResult({
        filename: file.name,
        status: 'error',
        details: error instanceof Error ? error.message : 'Upload failed',
        model_used: modelSelection
      });
    } finally {
      clearInterval(pollWorkflow);
      setIsUploading(false);
    }
  }, [modelSelection, onUploadComplete, onUploadStart, onWorkflowUpdate]);

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
      case 'success': return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-900/10';
      case 'error': return 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10';
      case 'review_required': return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10';
      default: return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const getStatusMessage = (result: UploadResult) => {
    switch (result.status) {
      case 'success':
        return `✅ Contract created successfully! ID: ${result.contract_id}`;
      case 'error':
        return `❌ Processing failed: ${result.details}`;
      case 'review_required':
        return `⚠️ Manual review required: ${result.details}`;
      default:
        return `📄 Processing completed: ${result.details}`;
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="w-full">
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 relative group overflow-hidden",
            dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/40',
            isUploading ? 'pointer-events-none' : ''
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md animate-pulse" />
                <Loader className="relative" />
              </div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 animate-pulse uppercase tracking-[0.2em]">
                {currentStatus || "Initializing..."}
              </p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <div className="text-3xl group-hover:scale-110 transition-transform duration-300">📄</div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Drop PDF contract here or <span className="text-blue-600 dark:text-blue-400">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest mt-2 animate-in fade-in duration-500">
                {(currentStatus && isUploading) ? currentStatus : "MAXIMUM 50MB PDF FILES ONLY"}
              </p>
            </div>
          )}
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />

        {uploadResult && (
          <div className={cn("mt-4 p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300", getStatusColor(uploadResult.status))}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold truncate pr-4">
                {uploadResult.filename}
              </p>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest whitespace-nowrap">
                {uploadResult.status}
              </Badge>
            </div>
            <p className="text-xs mt-1 font-medium opacity-80">
              {getStatusMessage(uploadResult)}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Upload PDF Contract</h3>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative group",
              dragActive ? 'border-blue-500 bg-blue-500/10 shadow-[inner_0_0_20px_rgba(59,130,246,0.1)]' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/40',
              isUploading ? 'pointer-events-none opacity-50' : ''
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {isUploading ? (
              <div className="space-y-4 py-4">
                <Loader className="mx-auto" />
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 animate-pulse tracking-wide uppercase">
                  Processing PDF...
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="text-5xl group-hover:scale-110 transition-transform duration-300">📄</div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Drop PDF here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                    Industry standard security protocols apply
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl">
            <span>LLM Core:</span>
            <span className="text-blue-600 dark:text-blue-400">{modelSelection}</span>
          </div>

          {uploadResult && (
            <div className={cn("p-4 rounded-xl border animate-in zoom-in-95 duration-300", getStatusColor(uploadResult.status))}>
              <p className="text-sm font-bold mb-1">
                {uploadResult.filename}
              </p>
              <p className="text-xs font-medium opacity-90">
                {getStatusMessage(uploadResult)}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};