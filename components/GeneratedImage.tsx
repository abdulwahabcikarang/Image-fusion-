import React from 'react';

interface GeneratedImageProps {
  src: string;
  alt: string;
  index: number;
}

export const GeneratedImage: React.FC<GeneratedImageProps> = ({ src, alt, index }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `ai-fused-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-700">
      <img src={src} alt={alt} className="w-full h-auto object-contain bg-gray-900" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center p-4">
        <button
          onClick={handleDownload}
          className="opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-95 transition-all duration-300 px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-pink-500 flex items-center gap-2"
          aria-label="Download generated image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
};
