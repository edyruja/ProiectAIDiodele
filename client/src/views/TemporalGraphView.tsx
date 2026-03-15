import React, { useState, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, History, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import TopBar from '../TopBar';

// --- Mock Data Structure ---
const START_TIME = 1710460800; // 2024-03-15 00:00:00 UTC
const DAY = 86400;

interface TransactionEdge extends Edge {
  timestamp: number;
  dateString: string;
}

const mockNodes: Node[] = [
  {
    id: 'A',
    data: { label: 'Shell Corp A' },
    position: { x: 400, y: 100 },
    style: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--sidebar-border)', borderRadius: '12px', padding: '10px', color: 'var(--text-primary)', backdropFilter: 'blur(10px)' },
  },
  {
    id: 'B',
    data: { label: 'Offshore Account B' },
    position: { x: 700, y: 300 },
    style: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--sidebar-border)', borderRadius: '12px', padding: '10px', color: 'var(--text-primary)', backdropFilter: 'blur(10px)' },
  },
  {
    id: 'C',
    data: { label: 'Shell Corp C' },
    position: { x: 100, y: 300 },
    style: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--sidebar-border)', borderRadius: '12px', padding: '10px', color: 'var(--text-primary)', backdropFilter: 'blur(10px)' },
  },
];

const mockEdges: TransactionEdge[] = [
  {
    id: 'e1',
    source: 'A',
    target: 'B',
    label: '$45,000',
    timestamp: START_TIME,
    dateString: '2024-03-15 09:00',
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--apple-blue)' },
    style: { stroke: 'var(--apple-blue)', strokeWidth: 2 },
  },
  {
    id: 'e2',
    source: 'B',
    target: 'C',
    label: '$44,800',
    timestamp: START_TIME + DAY,
    dateString: '2024-03-16 11:30',
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--apple-blue)' },
    style: { stroke: 'var(--apple-blue)', strokeWidth: 2 },
  },
  {
    id: 'e3',
    source: 'C',
    target: 'A',
    label: '$44,500',
    timestamp: START_TIME + 2 * DAY,
    dateString: '2024-03-17 14:15',
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--risk-high)' },
    animated: true,
    style: { stroke: 'var(--risk-high)', strokeWidth: 2.5 },
  },
  {
    id: 'e4',
    source: 'A',
    target: 'C',
    label: '$10,000 (Noise)',
    timestamp: START_TIME + 0.5 * DAY,
    dateString: '2024-03-15 21:00',
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
    style: { stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 1, strokeDasharray: '5,5' },
  },
];

// Sort edges by timestamp for initial state
const sortedEdges = [...mockEdges].sort((a, b) => a.timestamp - b.timestamp);

const TemporalGraphView: React.FC = () => {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(sortedEdges[0].timestamp);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Dynamic timeline bounds based on the current month
  const [timelineBounds, setTimelineBounds] = useState({
    min: new Date(2024, 2, 1).getTime() / 1000, // March 1st default
    max: new Date(2024, 2, 31, 23, 59, 59).getTime() / 1000,
  });

  // Derived variable: Shift mock data timestamps into the currently selected investigation month
  // and then filter by currentTimestamp
  const visibleEdges = useMemo(() => {
    // Get the start of the currently selected month to use as a base
    const currentMonthStart = timelineBounds.min;
    const shift = currentMonthStart - 1709251200; // Shift relative to start of March 2024
    
    return mockEdges
      .map(edge => ({
        ...edge,
        timestamp: edge.timestamp + shift
      }))
      .filter(edge => edge.timestamp <= currentTimestamp);
  }, [currentTimestamp, timelineBounds.min]);

  // Derived variable: only return nodes that are involved in at least one visible edge
  const visibleNodes = useMemo(() => {
    const activeNodeIds = new Set<string>();
    visibleEdges.forEach(edge => {
      activeNodeIds.add(edge.source);
      activeNodeIds.add(edge.target);
    });
    return mockNodes.filter(node => activeNodeIds.has(node.id));
  }, [visibleEdges]);

  // Format current date for display
  const currentDateDisplay = useMemo(() => {
    const date = new Date(currentTimestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [currentTimestamp]);

  // Handle auto-playback
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTimestamp(prev => {
          const next = prev + 3600; // Increment by 1 hour every tick
          if (next >= timelineBounds.max) {
            setIsPlaying(false);
            return timelineBounds.max;
          }
          return next;
        });
      }, 50); // Fast tick for smooth playback
    }

    return () => clearInterval(intervalId);
  }, [isPlaying, timelineBounds.max]);

  const togglePlayback = () => {
    if (currentTimestamp >= timelineBounds.max) {
      setCurrentTimestamp(timelineBounds.min);
    }
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    setIsPlaying(false);
    setCurrentTimestamp(timelineBounds.min);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--main-bg)]">
      <TopBar entityName="Investigation Canvas" riskLevel="HIGH">
        <div className="ml-auto flex items-center gap-4 text-sm text-[var(--text-secondary)] font-medium">
          Temporal Analysis Mode
        </div>
      </TopBar>

      <div className="flex-1 p-8 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-8">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                <History className="w-8 h-8 text-[var(--apple-blue)]" />
                Circular Payment Detection
              </h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1 opacity-80">
                Visualize capital flow chronologically to identify complex laundering cycles.
              </p>
            </div>
            
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Card className="bg-white/5 border-white/5 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all hover:border-white/10 group">
                  <CardContent className="py-3 px-6 flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--apple-blue)] transition-colors">Current Timeline</span>
                      <span className="text-[16px] font-bold text-[var(--text-primary)] font-mono">{currentDateDisplay}</span>
                    </div>
                    <CalendarIcon className="w-5 h-5 text-[var(--apple-blue)] opacity-60 group-hover:opacity-100 transition-all" />
                  </CardContent>
                </Card>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[var(--card-bg)] border-[var(--sidebar-border)] backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden" align="end">
                <Calendar
                  mode="single"
                  selected={new Date(currentTimestamp * 1000)}
                  onSelect={(date) => {
                    if (date) {
                      setIsPlaying(false);
                      // Set to end of the day (23:59:59) to include all transactions on that date
                      const endOfDay = new Date(date);
                      endOfDay.setHours(23, 59, 59, 999);
                      
                      // Calculate full month bounds for the selected date
                      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
                      
                      setTimelineBounds({
                        min: startOfMonth.getTime() / 1000,
                        max: endOfMonth.getTime() / 1000
                      });
                      
                      setCurrentTimestamp(endOfDay.getTime() / 1000);
                      setIsCalendarOpen(false); // Auto-close on selection
                    }
                  }}
                  initialFocus
                  className="p-3"
                  classNames={{
                    head_cell: "text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-wider",
                    cell: "text-center p-0 relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-[var(--text-primary)] hover:bg-white/10 rounded-lg transition-colors",
                    day_selected: "bg-[var(--apple-blue)] text-white hover:bg-[var(--apple-blue)] hover:text-white focus:bg-[var(--apple-blue)] focus:text-white rounded-lg",
                    day_today: "bg-white/5 text-[var(--apple-blue)] font-bold",
                    day_outside: "text-[var(--text-secondary)] opacity-30",
                    nav_button: "border-white/5 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] rounded-lg transition-all",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Graph Canvas */}
          <Card className="flex-1 overflow-hidden border-white/5 bg-black/20 relative shadow-2xl rounded-[32px]">
            <ReactFlowProvider>
              <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                fitView
                className=" investigation-canvas"
              >
                <Background color="rgba(255,255,255,0.03)" gap={20} size={1} />
                <Controls className="!bg-[var(--card-bg)] !border-[var(--card-border)] !shadow-xl !text-[var(--text-primary)] !rounded-xl overflow-hidden" />
              </ReactFlow>
            </ReactFlowProvider>

            {/* Overlay Info */}
            <div className="absolute top-6 left-6 pointer-events-none">
              <div className="flex flex-col gap-2">
                <div className="px-4 py-2 bg-[var(--risk-high-bg)] text-[var(--risk-high)] text-[11px] font-bold uppercase rounded-full border border-[var(--risk-high-border)] backdrop-blur-md">
                   Potential Circular Loop Detected
                </div>
                <div className="px-4 py-2 bg-white/5 text-[var(--text-secondary)] text-[11px] font-bold uppercase rounded-full border border-white/5 backdrop-blur-md inline-block">
                {visibleEdges.length} Active Records
                </div>
              </div>
            </div>
          </Card>

          {/* Temporal Controls Footer */}
          <Card className="bg-[var(--card-bg)] border-[var(--card-border)] backdrop-blur-[var(--apple-blur)] rounded-[24px] shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-8">
                {/* Play/Pause Button */}
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={togglePlayback}
                  className="w-14 h-14 rounded-full border-[var(--sidebar-border)] bg-white/5 hover:bg-white/10 text-[var(--text-primary)] transition-all active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </Button>

                {/* Reset Button */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={resetView}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
                  title="Reset Timeline"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>

                {/* Timeline Slider */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">
                    <span>{new Date(timelineBounds.min * 1000).toLocaleDateString()}</span>
                    <span className="text-[var(--apple-blue)]">
                      {new Date(currentTimestamp * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric' })} Investigation Window
                    </span>
                    <span>{new Date(timelineBounds.max * 1000).toLocaleDateString()}</span>
                  </div>
                  
                  <Slider
                    value={[currentTimestamp]}
                    min={timelineBounds.min}
                    max={timelineBounds.max}
                    step={3600}
                    onValueChange={(val) => {
                      setIsPlaying(false);
                      setCurrentTimestamp(val[0]);
                    }}
                    className="hover:cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemporalGraphView;
