import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {Copy, Check} from 'lucide-react';
import {toast} from 'react-toastify';

interface CopyTextProps {
  text: string;
}

export function CopyText({text}: CopyTextProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="inline-flex items-center space-x-2 border rounded px-2 bg-white">
      <span className="text-sm font-mono">{text}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={ev => {
                ev.stopPropagation();
                navigator.clipboard
                  .writeText(text)
                  .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  })
                  .catch(err => {
                    toast('Ошибка копирования:' + JSON.stringify(err), {
                      type: 'error',
                    });
                  });
              }}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Скопировать</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {copied ? 'Скопировано!' : 'Скопировать текст'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
