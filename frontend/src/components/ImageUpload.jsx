import React, { useState, useRef } from 'react';

/**
 * ImageUpload Component
 * 
 * A drag-and-drop image upload component with real-time verification.
 * Rejects screenshots, AI-generated images, and invalid formats.
 * 
 * Props:
 *   - onImageVerified(file, metadata) - Callback when image is verified
 *   - onImageRejected(error, code) - Callback when image fails verification
 *   - maxSize (optional) - Max file size in MB (default 15)
 */
const ImageUpload = ({ onImageVerified, onImageRejected, maxSize = 15 }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Error messages with icons
  const errorMessages = {
    SCREENSHOT: '📱 Screenshots are not accepted. Please take a real photo.',
    AI_GENERATED: '🤖 AI-generated images are not accepted as evidence.',
    NO_EXIF: '📷 Please upload an original photo taken from your camera.',
    ANIMATED: '📹 Animated images are not accepted. Please upload a still photo.',
    INVALID_FORMAT: '❌ Invalid file format. Only JPG, PNG, WebP allowed.',
    FILE_TOO_LARGE: `📦 File too large. Maximum size is ${maxSize}MB.`,
    FILE_TOO_SMALL: '📦 File too small. Minimum size is 100KB.',
    VERIFICATION_ERROR: '⚠️ Verification failed. Please try again.',
    FILE_NOT_FOUND: '❌ File error. Please try again.'
  };

  /**
   * Verify image with backend
   */
  const verifyImageWithBackend = async (file) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('photo', file);

      // Call your complaint endpoint or create a dedicated verification endpoint
      const response = await fetch('/api/complaints/verify-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Image verification failed
        const errorMsg = errorMessages[data.code] || data.error || 'Image verification failed';
        setError(errorMsg);
        onImageRejected?.(errorMsg, data.code);
        setLoading(false);
        return false;
      }

      // Image verified successfully
      setSuccess(true);
      setError(null);
      onImageVerified?.(file, data.metadata);
      setLoading(false);
      return true;
    } catch (err) {
      const errorMsg = 'Failed to verify image. Please check your connection.';
      setError(errorMsg);
      onImageRejected?.(errorMsg, 'NETWORK_ERROR');
      setLoading(false);
      return false;
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (file) => {
    setError(null);
    setSuccess(false);

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(errorMessages.INVALID_FORMAT);
      onImageRejected?.(errorMessages.INVALID_FORMAT, 'INVALID_FORMAT');
      return;
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(errorMessages.FILE_TOO_LARGE);
      onImageRejected?.(errorMessages.FILE_TOO_LARGE, 'FILE_TOO_LARGE');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setFileName(file.name);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);

    // Verify with backend
    await verifyImageWithBackend(file);
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handle drag enter
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
  };

  /**
   * Handle drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Clear selection
   */
  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    setSuccess(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!preview ? (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-teal-500 hover:bg-teal-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-3">
            <div className="text-4xl">📸</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Drag and drop your photo here
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                or click to select from your device
              </p>
            </div>
            <p className="text-xs text-gray-400">
              JPG, PNG, WebP • Max {maxSize}MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
            {!success && !loading && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* File name */}
          <div className="text-sm text-gray-600">
            📁 {fileName}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center space-x-3 text-teal-600 bg-teal-50 p-4 rounded-lg">
              <div className="animate-spin">⏳</div>
              <span className="font-medium">Verifying image authenticity...</span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={handleClear}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try another image
              </button>
            </div>
          )}

          {/* Success state */}
          {success && !loading && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">✅ Photo verified as real image</p>
              <p className="text-xs text-green-600 mt-1">
                This image has passed authenticity verification
              </p>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleClear}
                  className="text-sm px-4 py-2 bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 transition"
                >
                  Change image
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form submission */}
      {selectedFile && success && (
        <input
          type="hidden"
          name="photo"
          value={selectedFile.name}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default ImageUpload;
