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
    {/* min-w-0 is required so this flex child can shrink below its content width.
        Without it, long <pre> code blocks expand the parent past its container
        and overflow the card horizontally. */}
    <div className="md-prose text-sm min-w-0 flex-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ pre: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  </div>
);
