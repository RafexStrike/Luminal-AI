// FILE: src/components/SECONDARY_QuizzesPanel.jsx
// DESCRIPTION: Multiple-choice quiz display with answer checking and feedback

'use client';

import { useState, useEffect } from 'react';

/**
 * SECONDARY_QuizzesPanel
 * 
 * Features:
 *   - Display MCQ questions generated from selected chat messages
 *   - User selects an answer option
 *   - "Check Answer" button reveals correctness and explanation
 *   - Score tracking across all questions
 *   - Empty state when no quizzes generated
 * 
 * Data flow:
 *   - User selects messages and clicks "Generate Quizzes"
 *   - Request sent to /api/secondStage/quizzes { messageIds }
 *   - API returns { questions: [{question, options, answerIndex, explanation}, ...] }
 *   - Questions displayed with radio options
 *   - User submits answer -> shows feedback and correct answer
 */
export default function SECONDARY_QuizzesPanel({
  chatId = null,
  refreshTrigger = 0,
}) {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
  const [checkedAnswers, setCheckedAnswers] = useState(new Set()); // Set of checked question indices
  const [score, setScore] = useState(0);

  // Load quizzes from DB when chat changes
  useEffect(() => {
    if (chatId) {
      const loadQuizzes = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/secondStage/quizzes?chatId=${chatId}`);
          if (response.ok) {
            const data = await response.json();
            setQuizzes(data.sets || []);
            setUserAnswers({});
            setCheckedAnswers(new Set());
            setScore(0);
          }
        } catch (error) {
          console.error('Error loading quizzes:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadQuizzes();
    }
  }, [chatId, refreshTrigger]);

  const handleSelectAnswer = (questionIndex, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleCheckAnswer = (questionIndex, quiz) => {
    const selectedIndex = userAnswers[questionIndex];
    if (selectedIndex === undefined) {
      alert('Please select an answer first');
      return;
    }

    setCheckedAnswers((prev) => new Set([...prev, questionIndex]));

    // Update score if correct
    if (selectedIndex === quiz.questions[questionIndex].answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No quizzes yet</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Select messages in the chat and click "Generate Quizzes" to create multiple-choice questions
          </p>
        </div>
      </div>
    );
  }

  // Calculate total questions
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Score Header */}
      {checkedAnswers.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-gray-700">
            Score: <span className="font-bold text-lg text-blue-700">{score}</span> /{' '}
            <span className="font-bold text-lg text-gray-700">{checkedAnswers.size}</span>
          </div>
        </div>
      )}

      {/* Quiz Sets */}
      {quizzes.map((quiz, quizIndex) => (
        <div
          key={quizIndex}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quiz Set {quizIndex + 1} ({quiz.questions.length} questions)
          </h3>

          {/* Questions */}
          <div className="space-y-6">
            {quiz.questions.map((question, qIndex) => {
              const questionKey = `${quizIndex}-${qIndex}`;
              const isChecked = checkedAnswers.has(questionKey);
              const selectedOption = userAnswers[questionKey];
              const isCorrect =
                isChecked && selectedOption === question.answerIndex;

              return (
                <div
                  key={qIndex}
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  {/* Question Text */}
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Q{qIndex + 1}. {question.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-3 mb-4">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedOption === optionIndex;
                      const isCorrectAnswer =
                        isChecked && optionIndex === question.answerIndex;

                      return (
                        <button
                          key={optionIndex}
                          onClick={() =>
                            !isChecked && handleSelectAnswer(questionKey, optionIndex)
                          }
                          disabled={isChecked}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                            isCorrectAnswer
                              ? 'border-green-500 bg-green-50'
                              : isSelected && isChecked
                              ? 'border-red-500 bg-red-50'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          } ${isChecked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isCorrectAnswer
                                  ? 'border-green-500 bg-green-500'
                                  : isSelected && isChecked
                                  ? 'border-red-500 bg-red-500'
                                  : isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {(isCorrectAnswer ||
                                (isSelected && isChecked)) && (
                                <span className="text-white text-sm">
                                  {isCorrectAnswer ? '✓' : '✗'}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-900">
                              {String.fromCharCode(65 + optionIndex)}.{' '}
                              {option}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Check/Reveal Feedback */}
                  {!isChecked ? (
                    <button
                      onClick={() =>
                        handleCheckAnswer(questionKey, { questions: quiz.questions })
                      }
                      disabled={selectedOption === undefined}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div
                      className={`p-3 rounded-lg ${
                        isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="font-semibold mb-2">
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
