import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

type Props = {
  content: string;
};

const markdownComponents: Components = {
  a({ children, ...props }) {
    return (
      <a
        {...props}
        className="font-medium text-foreground underline underline-offset-4"
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-border pl-4 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  code({ children, className, ...props }) {
    const isBlockCode = Boolean(className);

    return (
      <code
        {...props}
        className={cn(
          'font-mono',
          isBlockCode
            ? 'text-inherit'
            : 'rounded bg-muted px-1 py-0.5 text-[0.92em] text-foreground',
          className,
        )}
      >
        {children}
      </code>
    );
  },
  h1({ children }) {
    return <h1 className="mt-6 first:mt-0 text-xl leading-8 font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mt-5 first:mt-0 text-lg leading-8 font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-5 first:mt-0 text-base leading-7 font-semibold">{children}</h3>;
  },
  hr() {
    return <hr className="border-border" />;
  },
  li({ children, className, ...props }) {
    return (
      <li {...props} className={cn('pl-1', className)}>
        {children}
      </li>
    );
  },
  ol({ children }) {
    return <ol className="list-decimal space-y-1 pl-5">{children}</ol>;
  },
  p({ children }) {
    return <p className="whitespace-pre-wrap">{children}</p>;
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm text-foreground">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
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
      <th className="border border-border bg-muted px-3 py-2 text-left font-medium align-top">
        {children}
      </th>
    );
  },
  ul({ children }) {
    return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
  },
};

export default function MarkdownContent({ content }: Props) {
  return (
    <ReactMarkdown
      components={markdownComponents}
      remarkPlugins={[remarkGfm]}
      skipHtml
      unwrapDisallowed
    >
      {content}
    </ReactMarkdown>
  );
}
