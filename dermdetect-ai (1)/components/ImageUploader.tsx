

import React, { useState, useCallback, useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  imageDataUrl: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imageDataUrl }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      onImageUpload(files[0]);
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [onImageUpload]);
  
  const onAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
        className={`relative group border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ease-in-out cursor-pointer
        ${isDragging ? 'border-primary bg-primary-light' : 'border-border hover:border-primary'}`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onAreaClick}
    >
        <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
        />

        {imageDataUrl ? (
            <div className="relative">
                <img src={imageDataUrl} alt="Skin condition preview" className="w-full h-auto max-h-96 object-contain rounded-lg" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity duration-300 rounded-lg">
                    <p className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100">Click or drop to change image</p>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <UploadIcon />
                <p className="mt-4 text-lg font-semibold text-text-secondary">
                    <span className="text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-sm text-text-secondary">PNG, JPG or WEBP</p>
            </div>
        )}
    </div>
  );
};