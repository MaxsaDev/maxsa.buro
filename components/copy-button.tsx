import { Button } from '@/components/ui/button';
import { CopyIcon } from 'lucide-react';

interface Props {
  text: string;
}

export const CopyButton = ({ text }: Props) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      title="Скопіювати"
      aria-label="Скопіювати"
      className="text-muted-foreground hover:text-foreground h-[25px] w-[25px] cursor-pointer rounded-md px-1.5"
    >
      <CopyIcon className="h-4 w-4" />
    </Button>
  );
};
