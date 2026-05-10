import { cn } from '@/lib/utils';

type Props = {
  initials: string;
  className?: string;
};

export default function UserAvatar({ initials, className }: Props) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white',
        className,
      )}
    >
      {initials}
    </div>
  );
}
