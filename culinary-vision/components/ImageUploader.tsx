import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onTestMode?: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onTestMode }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const handleGenerateClick = () => {
    if (file) {
      onImageUpload(file);
    }
  };

  const handleTestModeClick = () => {
    if (file && onTestMode) {
      onTestMode(file);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileChange(droppedFile);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-full max-w-3xl">
        {/* Header - Clean Google-style */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-normal text-gray-900 mb-4 tracking-tight">
            Culinary Vision
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Transform your ingredients into recipes with AI-powered cooking videos
          </p>
        </div>

        {/* Upload Area - Google Material Design Style */}
        <div
          className={`w-full border-2 border-dashed rounded-lg p-12 transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : imagePreview
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          } cursor-pointer`}
          onClick={triggerFileSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            ref={fileInputRef}
          />
          
          {imagePreview ? (
            <div className="flex flex-col items-center">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 max-w-full rounded-lg shadow-md object-contain mb-4"
              />
              <p className="text-sm text-gray-500 mt-2">Click to change image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <UploadIcon className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload an image of your ingredients
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports JPEG, PNG, WebP
              </p>
            </div>
          )}
        </div>

        {/* Generate Buttons - Google Material Style */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGenerateClick}
            disabled={!file}
            className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-200 ${
              file
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:bg-blue-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Generate Recipes
          </button>
          
          {onTestMode && (
            <button
              onClick={handleTestModeClick}
              disabled={!file}
              className={`px-6 py-3 rounded-full text-base font-medium transition-all duration-200 border-2 ${
                file
                  ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400'
                  : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              }`}
              title="Test mode: Skip video generation and use placeholder content"
            >
              🧪 Test Mode
            </button>
          )}
        </div>
        
        {onTestMode && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Test Mode skips video generation and uses placeholder content
          </p>
        )}

        {/* Features List - Subtle Google-style */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">🎬</div>
            <h3 className="font-medium text-gray-900 mb-1">AI Video Generation</h3>
            <p className="text-sm text-gray-600">Watch your recipes come to life</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-medium text-gray-900 mb-1">Smart Assistant</h3>
            <p className="text-sm text-gray-600">Get cooking tips and meal plans</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-medium text-gray-900 mb-1">Instant Recipes</h3>
            <p className="text-sm text-gray-600">From ingredients to recipes in seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};
