import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { BrainCircuit } from 'lucide-react';

interface ReasoningViewProps {
  chainOfThought: string;
}

export function ReasoningView({ chainOfThought }: ReasoningViewProps) {
  return (
    <Card className="shadow-sm border-slate-200 h-full flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-100">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center">
          <BrainCircuit className="w-4 h-4 mr-2" />
          Explanation (Chain of Thought)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-64 md:h-full w-full rounded-md">
          <div className="p-4 bg-slate-50 min-h-full">
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">
              {chainOfThought}
            </p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
