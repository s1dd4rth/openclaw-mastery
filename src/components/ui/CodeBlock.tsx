import { useState, type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps extends ComponentPropsWithoutRef<'pre'> {
  children?: ReactNode;
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return extractText(props?.children);
  }
  return '';
}

export const CodeBlock = ({ children, className, ...rest }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = extractText(children).replace(/\n+$/, '');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the code is still selectable manually
    }
  };

  return (
    <div className="relative group">
      <pre className={className} {...rest}>{children}</pre>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        title={copied ? 'Copied' : 'Copy'}
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/5 text-emerald-200 border border-white/10 hover:bg-white/10 hover:text-emerald-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        {copied ? (
          <>
            <Check size={12} strokeWidth={3} />
            Copied
          </>
        ) : (
          <>
            <Copy size={12} strokeWidth={2.5} />
            Copy
          </>
        )}
      </button>
    </div>
  );
};
