import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { BrainCircuit } from 'lucide-react';

interface ReasoningViewProps {
  chainOfThought: string;
}

export function ReasoningView({ chainOfThought }: ReasoningViewProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 border-b border-black/[0.02]">
        <CardTitle className="text-[14px] font-bold text-[#86868b] tracking-wider flex items-center">
          <BrainCircuit className="w-5 h-5 mr-3 text-[var(--apple-blue)]" />
          ANALYTIC REASONING
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-8 bg-white min-h-full">
            <p className="whitespace-pre-wrap text-[#1d1d1f] leading-[1.6] text-[15px] font-medium opacity-90">
              {chainOfThought}
            </p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
