
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, ChefHatIcon } from './Icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerateClick = () => {
    if (file) {
      onImageUpload(file);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-4 mb-4">
            <ChefHatIcon className="w-12 h-12 text-indigo-400"/>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Culinary Vision
            </h1>
        </div>
        <p className="text-lg text-gray-300 mb-8">
          Snap a pic of your ingredients. Get recipe ideas with video guides instantly.
        </p>

        <div
          className="w-full h-64 border-4 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors duration-300 bg-gray-800/50"
          onClick={triggerFileSelect}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <UploadIcon className="w-12 h-12 mb-4"/>
              <span className="font-semibold">Click to upload an image</span>
              <span className="text-sm">or drag and drop</span>
            </div>
          )}
        </div>

        <button
          onClick={handleGenerateClick}
          disabled={!file}
          className="mt-8 w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
        >
          <ChefHatIcon className="w-6 h-6 mr-3"/>
          Generate Recipes
        </button>
      </div>
    </div>
  );
};
