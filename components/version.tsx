import { CURRENT_VERSION } from '@/lib/const';

export const Version = () => {
  return (
    <div className={'mx-auto my-2 flex w-full justify-center gap-1 text-xs text-slate-600'}>
      <span>v. {CURRENT_VERSION}</span>
    </div>
  );
};
