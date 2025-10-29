// src/components/RevisionDisplay.jsx
export default function RevisionDisplay({ revisionItems }) {
  if (!revisionItems || revisionItems.length === 0)
    return <p>No revision items found.</p>;

  return (
    <div className="space-y-4">
      {revisionItems.map((item, index) => (
        <div
          key={index}
          className="border rounded-xl p-4 shadow-sm hover:shadow-md transition"
        >
          <p className="font-semibold">
            {item.type === "mcq" ? `MCQ ${index + 1}` : `Flashcard ${index + 1}`}
          </p>

          <p className="mt-2 text-lg">{item.question}</p>

          {item.type === "flashcard" ? (
            <p className="mt-2 text-gray-700">
              <strong>Answer:</strong> {item.answer}
            </p>
          ) : (
            <ul className="mt-2 list-disc list-inside text-gray-700">
              {item.options?.map((opt, i) => (
                <li
                  key={i}
                  className={`${
                    i === item.correctOptionIndex
                      ? "font-bold text-green-600"
                      : ""
                  }`}
                >
                  {opt}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
