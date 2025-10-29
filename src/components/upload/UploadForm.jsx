// src/components/UploadForm.jsx
"use client";

import React, { useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

export default function UploadForm() {
  const [file, setFile] = useState(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  //handle file pick
  const handlePick = (e) => {
    setResult(null);
    setUploadPct(0);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) setVideoUrl(URL.createObjectURL(f));
    else setVideoUrl("");
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropRef.current?.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const f = files[0];
      if (f.type.startsWith('video/')) {
        setResult(null);
        setUploadPct(0);
        setFile(f);
        setVideoUrl(URL.createObjectURL(f));
      }
    }
  };

  // handle upload
  const handleUpload = () => {
    if (!file) return;
    setIsProcessing(true);
    setResult(null);

    const form = new FormData();
    form.append("video", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "https://video-trascription-and-summary-generator.onrender.com/process"
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadPct(percent);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setIsProcessing(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            setResult(json);
          } catch (err) {
            setResult({ error: "Invalid JSON response from server" });
          }
        } else {
          setResult({
            error: `Upload failed: ${xhr.status} ${xhr.statusText}`,
            details: xhr.responseText,
          });
        }
      }
    };

    xhr.onerror = () => {
      setIsProcessing(false);
      setResult({ error: "Network error during upload" });
    };

    xhr.send(form);
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setVideoUrl("");
    setUploadPct(0);
    setResult(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className=" lg:w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl transition-all duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-900 to-blue-500 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-blue-600 dark:from-green-700 dark:to-blue-400 bg-clip-text text-transparent">
          Video Transcription & Summary
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Upload your video and get AI-powered transcription and summary</p>
      </div>

      {/* Drag & Drop Area */}
      <div
        ref={dropRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`mb-6 p-8  border-2 border-dashed rounded-2xl text-center transition-all duration-300 ${
          isDragging
            ? 'border-green-500 bg-purple-50 dark:bg-green-900 dark:bg-opacity-20 scale-105'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="max-w-md mx-auto">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Drag and drop your video file here</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">or</p>
          
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handlePick}
            className="hidden"
            id="file-input"
            disabled={isProcessing}
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-xl cursor-pointer hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose Video File
          </label>
          
          {file && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 dark:text-gray-200 font-medium text-sm truncate max-w-xs">{file.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Preview with Buttons */}
      {videoUrl && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-2 h-6 bg-gradient-to-b from-green-700 to-blue-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200">Video Preview</h3>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-96 object-contain"
            />
          </div>
          
          {/* Buttons under video */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-700 to-blue-600 text-white font-semibold rounded-xl hover:from-green-900 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              onClick={handleUpload}
              disabled={!file || isProcessing}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload & Process
                </>
              )}
            </button>

            <button
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReset}
              disabled={isProcessing}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploadPct > 0 && (
        <div className="mb-6">
          <ProgressBar percent={uploadPct} />
        </div>
      )}

      {/* Result Card with Loading Spinner */}
      {(isProcessing || result) && (
        <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="flex items-center mb-4">
            <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200">Processed Result</h3>
          </div>
          
          {isProcessing && !result && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-purple-200 dark:border-green-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-green-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 animate-pulse">
                Processing your video...
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                This may take a few moments
              </p>
            </div>
          )}
          
          {result && result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-600 dark:text-red-400 font-semibold">Error</span>
              </div>
              <pre className="text-sm text-red-600 dark:text-red-300 whitespace-pre-wrap">
                {result.error}
                {result.details ? `\n${result.details}` : ""}
              </pre>
            </div>
          ) : (
            result && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Transcription</h4>
                  </div>
                  <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-60 overflow-y-auto">
                    {result.transcription}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-200 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Summary</h4>
                  </div>
                  <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {result.summary}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}