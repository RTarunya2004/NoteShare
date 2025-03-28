import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type FileUploaderProps = {
  onFileUpload: (file: File) => void;
  allowedFileTypes?: string[];
  maxSizeMB?: number;
};

export default function FileUploader({ 
  onFileUpload, 
  allowedFileTypes = [],
  maxSizeMB = 20
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the ${maxSizeMB}MB limit`);
      return false;
    }

    // Check file type if allowed types are provided
    if (allowedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedFileTypes.includes(fileExtension)) {
        setError(`File type not supported. Allowed types: ${allowedFileTypes.join(', ')}`);
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileUpload(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileUpload(file);
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIconByType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'fa-file-pdf';
      case 'doc':
      case 'docx': return 'fa-file-word';
      case 'ppt':
      case 'pptx': return 'fa-file-powerpoint';
      case 'xls':
      case 'xlsx':
      case 'csv': return 'fa-file-excel';
      case 'zip': return 'fa-file-archive';
      case 'txt': 
      case 'md': return 'fa-file-alt';
      case 'json': return 'fa-file-code';
      default: return 'fa-file';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={allowedFileTypes.map(type => `.${type}`).join(',')}
      />
      
      {!selectedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-700 mb-2">Drag and drop your file here, or click to browse</p>
            <p className="text-gray-500 text-sm mb-4">
              Supported formats: {allowedFileTypes.join(', ').toUpperCase()}
            </p>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleBrowseClick}
            >
              <i className="fas fa-folder-open mr-2"></i> Browse Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
              <i className={`fas ${getFileIconByType(selectedFile.name)} text-primary`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Selected</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-gray-500 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
