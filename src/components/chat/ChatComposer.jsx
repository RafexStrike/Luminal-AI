'use client';
import ChatInputBox from './ChatInputBox';
import SendButton from './buttons/SendButton';

export default function ChatComposer({ inputValue, onInputChange, onSendMessage }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(inputValue);
    }
  };

  const handleSend = () => {
    onSendMessage(inputValue);
  };

  return (
    <div className="bg-base-100  border-t mb-20 border-base-300 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 ">
            <ChatInputBox
              value={inputValue}
              onChange={onInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
            />
          </div>
          {/* <SendButton onClick={handleSend} disabled={!inputValue.trim()} /> */}
        </div>
        <div className="text-xs text-base-content/60 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}
