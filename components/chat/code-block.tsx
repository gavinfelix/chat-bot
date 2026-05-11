'use client';

import { Check, Code2, Copy } from 'lucide-react';
import {
  Children,
  isValidElement,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

type Props = ComponentPropsWithoutRef<'pre'>;

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }

  return '';
}

function getCodeClassName(children: ReactNode) {
  const child = Children.toArray(children)[0];

  if (!isValidElement<{ className?: string }>(child)) {
    return '';
  }

  return child.props.className ?? '';
}

function getLanguage(className: string) {
  const language = className.match(/(?:^|\s)language-([^\s]+)/)?.[1];

  if (!language || ['plaintext', 'txt', 'text'].includes(language.toLowerCase())) {
    return 'Text';
  }

  const labelByLanguage: Record<string, string> = {
    bash: 'Bash',
    css: 'CSS',
    html: 'HTML',
    js: 'JavaScript',
    javascript: 'JavaScript',
    json: 'JSON',
    jsx: 'JSX',
    md: 'Markdown',
    markdown: 'Markdown',
    py: 'Python',
    python: 'Python',
    sh: 'Shell',
    ts: 'TypeScript',
    tsx: 'TSX',
    typescript: 'TypeScript',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
  };

  const normalizedLanguage = language.toLowerCase();

  return (
    labelByLanguage[normalizedLanguage] ??
    normalizedLanguage
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

export default function CodeBlock({ children, className, ...props }: Props) {
  const [copied, setCopied] = useState(false);
  const code = getNodeText(children).replace(/\n$/, '');
  const language = getLanguage(getCodeClassName(children));

  const copyCode = async () => {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="chat-code-block my-2 rounded-3xl bg-sidebar-accent text-foreground shadow-sm ring-1 ring-border/60 dark:bg-[#181818] dark:text-white dark:ring-white/10">
      <div className="sticky top-0 z-10 flex h-10 items-center justify-between rounded-t-3xl bg-sidebar-accent pt-1 pr-3 pl-5 dark:bg-[#181818]">
        <div className="flex min-w-0 items-center gap-2.5">
          <Code2
            className="h-3.5 w-3.5 shrink-0 text-foreground dark:text-white"
            aria-hidden="true"
          />
          <span className="truncate text-sm font-semibold tracking-normal text-foreground dark:text-white">
            {language}
          </span>
        </div>
        <button
          type="button"
          aria-label={copied ? 'Copied code' : 'Copy code'}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-muted-foreground/15 dark:text-white dark:hover:bg-white/10"
          onClick={() => void copyCode()}
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <pre
        {...props}
        className={cn(
          'chat-code-scrollbar max-h-[60vh] overflow-auto rounded-b-3xl bg-sidebar-accent px-0 pt-1 pb-3 text-[13px] leading-6 dark:bg-[#181818]',
          '[&_code]:block [&_code]:!bg-transparent [&_code]:!p-0 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-inherit',
          '[&_code]:min-w-max [&_code]:!pr-5 [&_code]:!pl-5',
          className,
        )}
      >
        {children}
      </pre>
    </div>
  );
}
