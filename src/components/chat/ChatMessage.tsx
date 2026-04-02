import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  auto?: boolean;
  stepTitle?: string;
}

export const ChatMessage = ({ role, content, auto, stepTitle }: ChatMessageProps) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
          isUser
            ? 'bg-openclaw-red text-white rounded-br-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
        }`}
      >
        {isUser && auto && stepTitle && (
          <div className={`text-xs mb-1 ${isUser ? 'text-red-200' : 'text-slate-400'}`}>
            (auto, {stepTitle})
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="md-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
