import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onTestMode?: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onTestMode }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onImageUpload(selectedFile);
    }
  };

  const handleTestMode = () => {
    if (selectedFile && onTestMode) {
      onTestMode(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col items-center justify-center p-6 pb-24">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-teal-500 p-4">
        <h1 className="text-white text-2xl font-bold">foogle</h1>
      </div>
      
      <div className="max-w-md w-full mt-20">
        {/* Main Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Upload your Ingredients Here!
          </h2>
          <p className="text-gray-300 text-sm">
            Get ready to chef it up!
          </p>
        </div>

        {/* Upload Area */}
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-200 bg-gray-100
            ${isDragging 
              ? 'border-teal-500 bg-teal-50' 
              : 'border-gray-300 hover:border-teal-400'
            }
          `}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-2">Choose Image</p>
            <UploadIcon className="w-8 h-8 text-gray-600" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="hidden"
          />
        </div>

        {/* Preview */}
        {selectedFile && (
          <div className="mt-6">
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={selectedFile ? handleUpload : () => fileInputRef.current?.click()}
          className={`
            w-full mt-6 py-4 px-6 rounded-lg font-bold text-white text-lg
            transition-all duration-200
            ${selectedFile
              ? 'bg-teal-500 hover:bg-teal-600 shadow-lg'
              : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          Generate!
        </button>

        {/* Test Mode Button */}
        {onTestMode && (
          <button
            onClick={handleTestMode}
            disabled={!selectedFile}
            className="w-full mt-3 py-2 px-4 rounded-lg font-medium text-gray-600 bg-white hover:bg-gray-100 transition-all duration-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Mode (Skip Video Generation)
          </button>
        )}
      </div>
      
      {/* Floating Action Button for Chat */}
      <button className="fixed bottom-20 right-6 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors z-40">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
};
