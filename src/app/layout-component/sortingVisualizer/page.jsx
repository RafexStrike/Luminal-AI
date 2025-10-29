'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, BarChart3, Cpu, Zap, TrendingUp, Sparkles, Menu, X } from 'lucide-react';

export default function SortingVisualizer() {
  const [array, setArray] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [algorithm, setAlgorithm] = useState('bubble');
  const [speed, setSpeed] = useState(50);
  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);
  const [currentIndices, setCurrentIndices] = useState([]);
  const [sortedIndices, setSortedIndices] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sortingRef = useRef(false);

  const algorithms = [
    { id: 'bubble', name: 'Bubble Sort', description: 'Simple comparison-based algorithm' },
    { id: 'selection', name: 'Selection Sort', description: 'Finds minimum and swaps' },
    { id: 'insertion', name: 'Insertion Sort', description: 'Builds sorted array one item at a time' },
    { id: 'quick', name: 'Quick Sort', description: 'Divide and conquer algorithm' }
  ];

  // Initialize array with smaller size for mobile
  const resetArray = () => {
    const isMobile = window.innerWidth < 768;
    const arrayLength = isMobile ? 15 : 30;
    const newArray = Array.from({ length: arrayLength }, () => 
      Math.floor(Math.random() * 80) + 10
    );
    setArray(newArray);
    setComparisons(0);
    setSwaps(0);
    setCurrentIndices([]);
    setSortedIndices([]);
  };

  useEffect(() => {
    resetArray();
    
    // Update array size on window resize
    const handleResize = () => {
      if (!sorting) {
        resetArray();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bubble Sort Algorithm
  const bubbleSort = async (arr) => {
    const n = arr.length;
    let tempComparisons = 0;
    let tempSwaps = 0;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!sortingRef.current) return;
        
        tempComparisons++;
        setComparisons(tempComparisons);
        setCurrentIndices([j, j + 1]);
        
        await new Promise(resolve => setTimeout(resolve, 200 - speed * 2));
        
        if (arr[j] > arr[j + 1]) {
          tempSwaps++;
          setSwaps(tempSwaps);
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
        }
      }
      setSortedIndices(prev => [...prev, n - i - 1]);
    }
    setSortedIndices(Array.from({ length: n }, (_, i) => i));
    setSorting(false);
  };

  // Selection Sort Algorithm
  const selectionSort = async (arr) => {
    const n = arr.length;
    let tempComparisons = 0;
    let tempSwaps = 0;
    
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      
      for (let j = i + 1; j < n; j++) {
        if (!sortingRef.current) return;
        
        tempComparisons++;
        setComparisons(tempComparisons);
        setCurrentIndices([minIdx, j]);
        
        await new Promise(resolve => setTimeout(resolve, 200 - speed * 2));
        
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        tempSwaps++;
        setSwaps(tempSwaps);
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setArray([...arr]);
      }
      
      setSortedIndices(prev => [...prev, i]);
    }
    setSortedIndices(Array.from({ length: n }, (_, i) => i));
    setSorting(false);
  };

  // Insertion Sort Algorithm
  const insertionSort = async (arr) => {
    const n = arr.length;
    let tempComparisons = 0;
    let tempSwaps = 0;
    
    for (let i = 1; i < n; i++) {
      let key = arr[i];
      let j = i - 1;
      
      setCurrentIndices([i]);
      await new Promise(resolve => setTimeout(resolve, 200 - speed * 2));
      
      while (j >= 0 && arr[j] > key) {
        if (!sortingRef.current) return;
        
        tempComparisons++;
        setComparisons(tempComparisons);
        tempSwaps++;
        setSwaps(tempSwaps);
        
        arr[j + 1] = arr[j];
        j = j - 1;
        
        setArray([...arr]);
        setCurrentIndices([j + 1]);
        await new Promise(resolve => setTimeout(resolve, 200 - speed * 2));
      }
      
      arr[j + 1] = key;
      setArray([...arr]);
      setSortedIndices(prev => [...prev, i]);
    }
    setSortedIndices(Array.from({ length: n }, (_, i) => i));
    setSorting(false);
  };

  const startSorting = () => {
    if (sorting) {
      sortingRef.current = false;
      setSorting(false);
    } else {
      sortingRef.current = true;
      setSorting(true);
      setComparisons(0);
      setSwaps(0);
      setSortedIndices([]);
      
      const arr = [...array];
      switch (algorithm) {
        case 'bubble':
          bubbleSort(arr);
          break;
        case 'selection':
          selectionSort(arr);
          break;
        case 'insertion':
          insertionSort(arr);
          break;
        default:
          bubbleSort(arr);
      }
    }
  };

  const getBarColor = (index, value) => {
    if (sortedIndices.includes(index)) {
      return 'bg-gradient-to-t from-emerald-600 to-cyan-500';
    }
    if (currentIndices.includes(index)) {
      return 'bg-gradient-to-t from-amber-500 to-orange-500';
    }
    return 'bg-gradient-to-t from-cyan-600 to-cyan-400';
  };

  return (
    <div className="min-h-screen  py-6 px-6 sm:px-6 lg:py-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-6xl mt-16 font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
            If You're Tired of <span className="bg-gradient-to-r from-blue-900 to-emerald-950 bg-clip-text text-transparent">Scrolling</span> Now-
          </h2>

          <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg mb-3 sm:mb-4 max-w-full">
            <Cpu className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
              Enjoy AI Sorting Visualizer <span className='bg-gradient-to-r from-indigo-800 to-amber-800 bg-clip-text text-transparent'>Game</span>
            </h1>
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 flex-shrink-0" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2">
            Watch how different sorting algorithms work in real-time. Perfect for understanding AI decision-making processes.
          </p>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden mb-4 flex justify-between items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl font-medium"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            Controls
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {algorithm.replace(/([A-Z])/g, ' $1').trim()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          
          {/* Controls Panel - Mobile */}
          <div className={`lg:col-span-1 space-y-4 lg:space-y-6 transition-all duration-300 ${
            mobileMenuOpen ? 'block' : 'hidden lg:block'
          }`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-6 border border-cyan-100 dark:border-cyan-900">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-600 dark:text-cyan-400" />
                Algorithm Controls
              </h2>
              
              <div className="space-y-3 lg:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    Sorting Algorithm
                  </label>
                  <select 
                    value={algorithm}
                    onChange={(e) => {
                      setAlgorithm(e.target.value);
                      setMobileMenuOpen(false);
                    }}
                    disabled={sorting}
                    className="w-full px-3 lg:px-4 py-2 lg:py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-800 dark:text-gray-200 text-sm lg:text-base"
                  >
                    {algorithms.map(algo => (
                      <option key={algo.id} value={algo.id}>
                        {algo.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 lg:mb-2">
                    Speed: {speed}ms
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                    disabled={sorting}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2 lg:gap-3 pt-2 lg:pt-4">
                  <button
                    onClick={startSorting}
                    disabled={!array.length}
                    className="flex-1 flex items-center justify-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-cyan-700 to-emerald-700 text-white rounded-lg lg:rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
                  >
                    {sorting ? (
                      <>
                        <Pause className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="hidden sm:inline">Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="hidden sm:inline">Start Sorting</span>
                        <span className="sm:hidden">Start</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetArray}
                    disabled={sorting}
                    className="px-3 lg:px-4 py-2 lg:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg lg:rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-4 h-4 lg:w-5 lg:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-6 border border-cyan-100 dark:border-cyan-900">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-600 dark:text-cyan-400" />
                Performance Metrics
              </h2>
              
              <div className="grid grid-cols-3 gap-2 lg:gap-4">
                <div className="flex flex-col items-center p-2 lg:p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg lg:rounded-xl">
                  <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 text-center">Comparisons</span>
                  <span className="text-lg lg:text-2xl font-bold text-cyan-700 dark:text-cyan-400">{comparisons}</span>
                </div>
                
                <div className="flex flex-col items-center p-2 lg:p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg lg:rounded-xl">
                  <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 text-center">Swaps</span>
                  <span className="text-lg lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{swaps}</span>
                </div>
                
                <div className="flex flex-col items-center p-2 lg:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg lg:rounded-xl">
                  <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 text-center">Array Size</span>
                  <span className="text-lg lg:text-2xl font-bold text-amber-700 dark:text-amber-400">{array.length}</span>
                </div>
              </div>
            </div>

            {/* Algorithm Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-6 border border-cyan-100 dark:border-cyan-900">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 lg:mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-600 dark:text-cyan-400" />
                Algorithm Info
              </h2>
              
              <div className="space-y-2 lg:space-y-3">
                {algorithms.map(algo => (
                  <div
                    key={algo.id}
                    className={`p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      algorithm === algo.id
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30 dark:border-cyan-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-500'
                    }`}
                    onClick={() => !sorting && setAlgorithm(algo.id)}
                  >
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm lg:text-base">{algo.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-1">{algo.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-8 border border-cyan-100 dark:border-cyan-900 h-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-8 gap-2">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">
                  {algorithms.find(a => a.id === algorithm)?.name} Visualization
                </h2>
                <div className="flex items-center justify-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1 lg:gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded"></div>
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-t from-amber-500 to-orange-500 rounded"></div>
                    <span>Comparing</span>
                  </div>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-t from-emerald-600 to-cyan-500 rounded"></div>
                    <span>Sorted</span>
                  </div>
                </div>
              </div>

              {/* Array Visualization */}
              <div className="flex items-end justify-center h-64 sm:h-80 lg:h-96 gap-0.5 lg:gap-1 p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 rounded-xl lg:rounded-2xl border-2 border-dashed border-cyan-200 dark:border-cyan-800">
                {array.map((value, index) => (
                  <div
                    key={index}
                    className={`flex-1 transition-all duration-300 rounded-t sm:rounded-t-lg ${getBarColor(index, value)}`}
                    style={{ height: `${value}%` }}
                  >
                    <div className="text-center text-[10px] xs:text-xs text-white font-medium mt-0.5 opacity-0 hover:opacity-100 transition-opacity">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-4 lg:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-4 text-center">
                <div className="p-2 lg:p-4 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg lg:rounded-xl">
                  <div className="text-lg lg:text-2xl font-bold text-cyan-700 dark:text-cyan-400">{comparisons}</div>
                  <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Total Comparisons</div>
                </div>
                <div className="p-2 lg:p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg lg:rounded-xl">
                  <div className="text-lg lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">{swaps}</div>
                  <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Total Swaps</div>
                </div>
                <div className="p-2 lg:p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg lg:rounded-xl">
                  <div className="text-lg lg:text-2xl font-bold text-amber-700 dark:text-amber-400">
                    O({algorithm === 'quick' ? 'n log n' : algorithm === 'bubble' ? 'n²' : 'n²'})
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Time Complexity</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 lg:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg lg:shadow-xl border border-cyan-100 dark:border-cyan-900">
            <h3 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 lg:mb-3">How It Works</h3>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              This visualizer demonstrates how sorting algorithms process data step by step. 
              Watch how different algorithms compare and swap elements to organize the array in ascending order.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg lg:shadow-xl border border-cyan-100 dark:border-cyan-900">
            <h3 className="text-base lg:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 lg:mb-3">AI Relevance</h3>
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Understanding sorting algorithms is fundamental to AI and machine learning. 
              These concepts help in optimizing data processing and decision-making in intelligent systems.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0891b2, #047857);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0891b2, #047857);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        @media (prefers-color-scheme: dark) {
          .slider::-webkit-slider-thumb {
            border: 2px solid #1f2937;
          }
          .slider::-moz-range-thumb {
            border: 2px solid #1f2937;
          }
        }

        @media (max-width: 640px) {
          .slider::-webkit-slider-thumb {
            height: 16px;
            width: 16px;
          }
          .slider::-moz-range-thumb {
            height: 16px;
            width: 16px;
          }
        }
      `}</style>
    </div>
  );
}