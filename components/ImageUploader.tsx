
import React, { useRef } from 'react';

interface ImageUploaderProps {
  id: string;
  title: string;
  description: string;
  onImageUpload: (file: File) => void;
  imageUrl?: string | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, title, description, onImageUpload, imageUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg p-6 text-center flex flex-col justify-between hover:border-purple-500 transition-colors duration-300">
      <div>
        <h3 className="text-xl font-semibold text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>

      <div 
        className="mt-4 flex-grow flex items-center justify-center cursor-pointer rounded-md overflow-hidden"
        onClick={handleClick}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {imageUrl ? (
          <img src={imageUrl} alt="Uploaded preview" className="max-h-64 w-auto object-contain rounded-md" />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <UploadIcon />
            <p className="mt-2">Click to browse or drag & drop</p>
          </div>
        )}
      </div>
    </div>
  );
};
