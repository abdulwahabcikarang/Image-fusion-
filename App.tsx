import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Spinner } from './components/Spinner';
import { GeneratedImage } from './components/GeneratedImage';
import { generatePromptFromImage, generateFusedImages } from './services/geminiService';

const App: React.FC = () => {
  const [referenceImage, setReferenceImage] = useState<{ file: File; url: string } | null>(null);
  const [subjectImage, setSubjectImage] = useState<{ file: File; url: string } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleReferenceImageUpload = (file: File) => {
    setReferenceImage({ file, url: URL.createObjectURL(file) });
    setGeneratedImages(null);
    setError(null);
  };

  const handleSubjectImageUpload = (file: File) => {
    setSubjectImage({ file, url: URL.createObjectURL(file) });
    setGeneratedImages(null);
    setError(null);
  };

  const handleGenerateClick = useCallback(async () => {
    if (!referenceImage || !subjectImage) {
      setError("Please upload both a reference and a subject image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages(null);

    try {
      setProgressMessage('Step 1/2: Analyzing reference image for style...');
      const referenceImageBase64 = await fileToBase64(referenceImage.file);
      const stylePrompt = await generatePromptFromImage(referenceImageBase64, referenceImage.file.type);
      
      setProgressMessage('Step 2/2: Fusing images and generating 4 new versions...');
      const subjectImageBase64 = await fileToBase64(subjectImage.file);
      
      const newImageBase64Array = await generateFusedImages(
          stylePrompt,
          subjectImageBase64,
          subjectImage.file.type,
          aspectRatio
      );
      
      setGeneratedImages(newImageBase64Array.map(base64 => `data:image/png;base64,${base64}`));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during image generation.");
    } finally {
      setIsLoading(false);
      setProgressMessage('');
    }
  }, [referenceImage, subjectImage, aspectRatio]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            AI Image Fusion
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Blend a subject into the style of a reference image.
          </p>
        </header>

        <main className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ImageUploader
              id="reference-uploader"
              title="1. Upload Reference Image"
              description="The style, mood, and composition will be copied from this image."
              onImageUpload={handleReferenceImageUpload}
              imageUrl={referenceImage?.url}
            />
            <ImageUploader
              id="subject-uploader"
              title="2. Upload Subject Image"
              description="The main subject (e.g., a person) will be taken from this image."
              onImageUpload={handleSubjectImageUpload}
              imageUrl={subjectImage?.url}
            />
          </div>

          <div className="flex flex-col items-center gap-6 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
             <div className="flex flex-col items-center gap-2">
                <label htmlFor="aspect-ratio-select" className="text-xl font-semibold text-gray-100">
                    3. Select Aspect Ratio
                </label>
                <select
                    id="aspect-ratio-select"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                    aria-label="Select aspect ratio for generated images"
                >
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:3">Landscape (4:3)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="16:9">Widescreen (16:9)</option>
                    <option value="9:16">Tall (9:16)</option>
                </select>
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={!referenceImage || !subjectImage || isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
            >
              {isLoading ? 'Generating...' : 'Fuse Images & Generate 4 Versions'}
            </button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg">
              <Spinner />
              <p className="mt-4 text-gray-300 font-medium">{progressMessage}</p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          {generatedImages && !isLoading && (
            <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Your Fused Images
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generatedImages.map((src, index) => (
                        <GeneratedImage key={index} src={src} alt={`AI Generated Fusion Image ${index + 1}`} index={index} />
                    ))}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
