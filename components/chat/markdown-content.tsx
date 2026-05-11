import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import CodeBlock from './code-block';

type Props = {
  content: string;
};

const markdownComponents: Components = {
  a({ children, ...props }) {
    return (
      <a
        {...props}
        className="font-medium text-foreground underline decoration-foreground/35 underline-offset-4 transition-colors hover:decoration-foreground"
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-2 border-border pl-4 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  code({ children, className, ...props }) {
    const isBlockCode = className?.includes('hljs') || className?.includes('language-');

    return (
      <code
        {...props}
        className={cn(
          isBlockCode
            ? 'font-mono'
            : 'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground',
          className,
        )}
      >
        {children}
      </code>
    );
  },
  h1({ children }) {
    return <h1 className="mt-4 mb-1.5 first:mt-0 text-lg leading-7 font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mt-4 mb-1.5 first:mt-0 text-base leading-7 font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-3 mb-1 first:mt-0 text-sm leading-6 font-semibold">{children}</h3>;
  },
  hr() {
    return <hr className="my-4 border-border" />;
  },
  li({ children, className, ...props }) {
    return (
      <li
        {...props}
        className={cn('pl-1 marker:text-muted-foreground [&>p]:my-0', className)}
      >
        {children}
      </li>
    );
  },
  ol({ children }) {
    return <ol className="my-1.5 list-decimal space-y-0.5 pl-5 marker:text-muted-foreground">{children}</ol>;
  },
  p({ children }) {
    return <p className="my-1.5 whitespace-pre-wrap first:mt-0 last:mb-0">{children}</p>;
  },
  pre({ children }) {
    return <CodeBlock>{children}</CodeBlock>;
  },
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-border">{children}</tbody>;
  },
  td({ children }) {
    return <td className="border border-border px-3 py-2 align-top">{children}</td>;
  },
  th({ children }) {
    return (
      <th className="border border-border bg-muted px-3 py-2 text-left font-semibold align-top">
        {children}
      </th>
    );
  },
  strong({ children }) {
    return <strong className="font-semibold text-foreground">{children}</strong>;
  },
  ul({ children }) {
    return <ul className="my-1.5 list-disc space-y-0.5 pl-5 marker:text-muted-foreground">{children}</ul>;
  },
};

export default function MarkdownContent({ content }: Props) {
  return (
    <div className="text-sm leading-6 text-foreground">
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeHighlight]}
        remarkPlugins={[remarkGfm]}
        skipHtml
        unwrapDisallowed
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
