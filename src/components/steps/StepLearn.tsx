import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen } from 'lucide-react';
import { CodeBlock } from '../ui/CodeBlock';

interface StepLearnProps {
  content: string;
}

export const StepLearn = ({ content }: StepLearnProps) => (
  <div className="flex gap-3">
    <BookOpen size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
    <div className="md-prose text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ pre: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  </div>
);
