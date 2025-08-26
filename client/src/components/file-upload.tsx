import React, { useState, useRef } from "react";
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File;
  onFileRemove?: () => void;
}

export default function FileUpload({
  onFileSelect,
  selectedFile,
  onFileRemove,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${
            isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-6 w-6" />
          <p className="text-gray-600">Drag & drop your file here, or click to browse</p>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between border rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <File className="h-6 w-6 text-blue-500" />
            <span className="text-gray-800">{selectedFile.name}</span>
          </div>
          <button
            onClick={onFileRemove}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
