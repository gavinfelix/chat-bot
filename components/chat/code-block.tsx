import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type Props = ComponentPropsWithoutRef<'pre'>;

export default function CodeBlock({ children, className, ...props }: Props) {
  return (
    <pre
      {...props}
      className={cn(
        'my-2 overflow-x-auto rounded-lg bg-muted p-3 text-[13px] leading-5 text-foreground',
        '[&_code]:block [&_code]:bg-transparent [&_code]:p-0 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-inherit',
        '[&_.hljs-comment]:text-muted-foreground [&_.hljs-quote]:text-muted-foreground',
        '[&_.hljs-keyword]:font-semibold [&_.hljs-keyword]:text-violet-700 dark:[&_.hljs-keyword]:text-violet-300',
        '[&_.hljs-selector-tag]:font-semibold [&_.hljs-selector-tag]:text-violet-700 dark:[&_.hljs-selector-tag]:text-violet-300',
        '[&_.hljs-string]:text-emerald-700 dark:[&_.hljs-string]:text-emerald-300',
        '[&_.hljs-title]:text-sky-700 dark:[&_.hljs-title]:text-sky-300',
        '[&_.hljs-function]:text-sky-700 dark:[&_.hljs-function]:text-sky-300',
        '[&_.hljs-variable]:text-blue-700 dark:[&_.hljs-variable]:text-blue-300',
        '[&_.hljs-attr]:text-blue-700 dark:[&_.hljs-attr]:text-blue-300',
        '[&_.hljs-number]:text-amber-700 dark:[&_.hljs-number]:text-amber-300',
        '[&_.hljs-literal]:text-amber-700 dark:[&_.hljs-literal]:text-amber-300',
        '[&_.hljs-built_in]:text-rose-700 dark:[&_.hljs-built_in]:text-rose-300',
        '[&_.hljs-type]:text-rose-700 dark:[&_.hljs-type]:text-rose-300',
        className,
      )}
    >
      {children}
    </pre>
  );
}
