'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle2, AlertTriangle, XCircle, ArrowLeft, ArrowRight, Save, Trash2, Globe, Building2, MapPin, ChevronRight, FileText, Zap, Shield, X,  } from 'lucide-react';
import { MOCK_COMPANIES, getSeverityCounts, getServiceLines, type Company } from '@/lib/mockData';
import SeverityBadge from '@/components/ui/SeverityBadge';
import ServiceBadge from '@/components/ui/ServiceBadge';
import { toast } from 'sonner';

type ResearchStage =
  | 'idle' |'stage-web' |'stage-reason' |'stage-fact' |'stage-pitch' |'mismatch-warning' |'review' |'saved' |'discarded';

interface LogLine {
  id: string;
  text: string;
  type: 'info' | 'found' | 'warn' | 'check';
}

const STAGES = [
  { id: 'web', label: 'Searching the web', icon: Globe },
  { id: 'reason', label: 'Reasoning about gaps', icon: Zap },
  { id: 'fact', label: 'Fact-checking', icon: Shield },
  { id: 'pitch', label: 'Building pitch', icon: FileText },
];

const STAGE_TO_INDEX: Record<string, number> = {
  'stage-web': 0,
  'stage-reason': 1,
  'stage-fact': 2,
  'stage-pitch': 3,
};

// Mock log lines per stage
const STAGE_LOGS: Record<string, LogLine[][]> = {
  'stage-web': [
    [
      { id: 'l-w-1', text: 'Querying company registry and LinkedIn…', type: 'info' },
      { id: 'l-w-2', text: 'Found company website: confirmed active', type: 'found' },
    ],
    [
      { id: 'l-w-3', text: 'Scraping about page, services, and press releases…', type: 'info' },
      { id: 'l-w-4', text: 'Located 3 source URLs with relevant content', type: 'found' },
    ],
    [
      { id: 'l-w-5', text: 'Cross-referencing industry classification…', type: 'info' },
      { id: 'l-w-6', text: 'Industry: cold storage / logistics — in scope', type: 'found' },
    ],
  ],
  'stage-reason': [
    [
      { id: 'l-r-1', text: 'Mapping operational profile against GND service lines…', type: 'info' },
      { id: 'l-r-2', text: 'Identified Cold Chain Management gap signal', type: 'found' },
    ],
    [
      { id: 'l-r-3', text: 'Checking for real-time monitoring references…', type: 'info' },
      { id: 'l-r-4', text: 'No IoT / sensor integration found in public sources', type: 'warn' },
    ],
    [
      { id: 'l-r-5', text: 'Evaluating compliance tooling maturity…', type: 'info' },
      { id: 'l-r-6', text: 'Platform gap confirmed — compliance reporting absent', type: 'found' },
    ],
  ],
  'stage-fact': [
    [
      { id: 'l-f-1', text: 'Verifying each claim against source URL…', type: 'check' },
      { id: 'l-f-2', text: 'Fact 1 verified — source snippet extracted', type: 'found' },
    ],
    [
      { id: 'l-f-3', text: 'Fact 2 verified — founding year confirmed', type: 'found' },
      { id: 'l-f-4', text: 'Cross-checking gap detail against facts…', type: 'check' },
    ],
    [
      { id: 'l-f-5', text: 'All gaps grounded in cited facts — no fabrications', type: 'found' },
      { id: 'l-f-6', text: 'Fact-checking complete — 2 facts, 3 gaps verified', type: 'found' },
    ],
  ],
  'stage-pitch': [
    [
      { id: 'l-p-1', text: 'Generating pitch angle from gap profile…', type: 'info' },
      { id: 'l-p-2', text: 'Selecting highest-severity gap as lead…', type: 'info' },
    ],
    [
      { id: 'l-p-3', text: 'Drafting opener sentence…', type: 'info' },
      { id: 'l-p-4', text: 'Pitch angle complete — Cold Chain lead identified', type: 'found' },
    ],
    [
      { id: 'l-p-5', text: 'Opener sentence written — ready for review', type: 'found' },
    ],
  ],
};

// Demo company to simulate researching — always uses co-001 (Frostbite)
const DEMO_RESULT = MOCK_COMPANIES[0];
// Simulate a mismatch company name
const MISMATCH_TRIGGER = 'accenture';

export default function LiveResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(initialQuery);
  const [stage, setStage] = useState<ResearchStage>('idle');
  const [activeStageIdx, setActiveStageIdx] = useState(-1);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [isMismatch, setIsMismatch] = useState(false);
  const [reviewCompany, setReviewCompany] = useState<Company | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      timerRef.current = setTimeout(resolve, ms);
    });
  }

  async function addLogs(newLogs: LogLine[]) {
    for (const log of newLogs) {
      await delay(400);
      setLogs((prev) => [...prev, log]);
    }
  }

  async function runResearch(name: string) {
    const isLikelyMismatch = name.toLowerCase().includes(MISMATCH_TRIGGER);
    setCompanyName(name);
    setLogs([]);
    setProgressPct(0);
    setActiveStageIdx(-1);

    // Stage 0: web
    setStage('stage-web');
    setActiveStageIdx(0);
    for (const batch of STAGE_LOGS['stage-web']) {
      await addLogs(batch);
      setProgressPct((p) => Math.min(p + 8, 25));
    }
    setProgressPct(25);
    await delay(300);

    // Stage 1: reason
    setStage('stage-reason');
    setActiveStageIdx(1);
    for (const batch of STAGE_LOGS['stage-reason']) {
      await addLogs(batch);
      setProgressPct((p) => Math.min(p + 8, 50));
    }
    setProgressPct(50);
    await delay(300);

    if (isLikelyMismatch) {
      setStage('mismatch-warning');
      return;
    }

    // Stage 2: fact
    setStage('stage-fact');
    setActiveStageIdx(2);
    for (const batch of STAGE_LOGS['stage-fact']) {
      await addLogs(batch);
      setProgressPct((p) => Math.min(p + 8, 75));
    }
    setProgressPct(75);
    await delay(300);

    // Stage 3: pitch
    setStage('stage-pitch');
    setActiveStageIdx(3);
    for (const batch of STAGE_LOGS['stage-pitch']) {
      await addLogs(batch);
      setProgressPct((p) => Math.min(p + 6, 98));
    }
    setProgressPct(100);
    await delay(400);

    setReviewCompany(DEMO_RESULT);
    setStage('review');
  }

  function handleStart() {
    if (!inputValue.trim()) return;
    runResearch(inputValue.trim());
  }

  function handleMismatchConfirm() {
    // Continue despite mismatch
    setIsMismatch(false);
    // Resume from stage-fact
    (async () => {
      setStage('stage-fact');
      setActiveStageIdx(2);
      for (const batch of STAGE_LOGS['stage-fact']) {
        await addLogs(batch);
        setProgressPct((p) => Math.min(p + 8, 75));
      }
      setProgressPct(75);
      await delay(300);
      setStage('stage-pitch');
      setActiveStageIdx(3);
      for (const batch of STAGE_LOGS['stage-pitch']) {
        await addLogs(batch);
        setProgressPct((p) => Math.min(p + 6, 98));
      }
      setProgressPct(100);
      await delay(400);
      setReviewCompany(DEMO_RESULT);
      setStage('review');
    })();
  }

  function handleSave() {
    // Backend integration point: POST /api/companies with reviewCompany data
    toast.success(`"${reviewCompany?.company_name}" saved to directory`, {
      description: `${reviewCompany?.gaps.length} gaps · ${reviewCompany?.facts.length} facts`,
    });
    setStage('saved');
  }

  function handleDiscard() {
    toast('Research discarded', { description: 'Nothing was saved.' });
    setStage('discarded');
  }

  function handleReset() {
    setStage('idle');
    setInputValue('');
    setLogs([]);
    setProgressPct(0);
    setActiveStageIdx(-1);
    setReviewCompany(null);
    setCompanyName('');
  }

  const isRunning = ['stage-web', 'stage-reason', 'stage-fact', 'stage-pitch'].includes(stage);
  const currentStageIdx = STAGE_TO_INDEX[stage] ?? -1;

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/" className="btn-ghost text-xs py-1 px-2">
              <ArrowLeft size={14} />
              Directory
            </Link>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="section-label text-2xs">Live Research</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Live Research Flow</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter a company name to surface gaps, sourced facts, and a pitch — ready in under 30 seconds.
          </p>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left: search + progress */}
          <div className="xl:col-span-3 space-y-5">
            {/* Search input */}
            <div className="kraft-card p-5">
              <label className="section-label text-2xs block mb-3">Company Name</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isRunning && handleStart()}
                    placeholder="e.g. Snowman Logistics, Frigo-Trans, Riviera Cold Chain…"
                    disabled={isRunning}
                    className="input-field pl-9 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleStart}
                  disabled={!inputValue.trim() || isRunning}
                  className="btn-primary flex-shrink-0"
                >
                  {isRunning ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Researching…
                    </>
                  ) : (
                    <>
                      <Search size={15} />
                      Research
                    </>
                  )}
                </button>
              </div>
              {stage === 'idle' && (
                <p className="text-xs text-muted-foreground mt-2.5 font-mono">
                  Works best with cold storage operators, logistics firms, and pharma distributors. Try &quot;Frostbite Cold Storage&quot; for a demo.
                </p>
              )}
            </div>

            {/* Stage progress */}
            {stage !== 'idle' && stage !== 'discarded' && (
              <div className="kraft-card p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <span className="section-label text-2xs">Research Progress</span>
                  {isRunning && (
                    <span className="flex items-center gap-1.5 text-xs text-primary font-mono animate-pulse-amber">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Live
                    </span>
                  )}
                  {(stage === 'review' || stage === 'saved') && (
                    <span className="flex items-center gap-1.5 text-xs text-severity-low font-mono">
                      <CheckCircle2 size={13} />
                      Complete
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{companyName}</span>
                    <span className="text-xs font-mono tabular-nums text-primary">{progressPct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Stage indicators */}
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {STAGES.map((s, idx) => {
                    const IconComp = s.icon;
                    const isDone =
                      (stage === 'review' || stage === 'saved') ||
                      (isRunning && currentStageIdx > idx) ||
                      (stage === 'mismatch-warning' && idx < 2);
                    const isActive = isRunning && currentStageIdx === idx;
                    const isPending = !isDone && !isActive;

                    return (
                      <div
                        key={`stage-indicator-${s.id}`}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded border transition-all duration-300 ${
                          isDone
                            ? 'bg-severity-low border-severity-low'
                            : isActive
                            ? 'bg-primary/10 border-primary/30' :'bg-muted/50 border-border'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-severity-low" />
                        ) : isActive ? (
                          <Loader2 size={16} className="text-primary animate-spin" />
                        ) : (
                          <IconComp size={16} className="text-muted-foreground" />
                        )}
                        <span
                          className={`text-2xs font-mono text-center leading-tight ${
                            isDone
                              ? 'text-severity-low'
                              : isActive
                              ? 'text-primary' :'text-muted-foreground'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Live log */}
                {logs.length > 0 && (
                  <div className="bg-background border border-border rounded p-3 max-h-48 overflow-y-auto scrollbar-thin font-mono text-xs space-y-1">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 log-line-enter ${
                          log.type === 'found' ?'text-severity-low'
                            : log.type === 'warn' ?'text-severity-medium'
                            : log.type === 'check' ?'text-primary' :'text-muted-foreground'
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {log.type === 'found' ? '✓' : log.type === 'warn' ? '⚠' : log.type === 'check' ? '→' : '·'}
                        </span>
                        <span>{log.text}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                )}
              </div>
            )}

            {/* Mismatch warning */}
            {stage === 'mismatch-warning' && (
              <div className="kraft-card border-l-4 border-l-severity-medium p-5 animate-slide-up">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-severity-medium flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      Industry match uncertain
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      <strong className="text-foreground">&quot;{companyName}&quot;</strong> does not appear to be a cold storage operator, logistics firm, or pharma distributor based on initial web results. The gap analysis may not be relevant.
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mb-4">
                      Detected industry signal: Management consulting / professional services
                    </p>
                    <div className="flex items-center gap-3">
                      <button onClick={handleMismatchConfirm} className="btn-secondary text-sm">
                        Continue anyway
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={14} />
                        Cancel and search again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review actions */}
            {stage === 'review' && reviewCompany && (
              <div className="kraft-card p-5 animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="section-label text-2xs block mb-0.5">Review Required</span>
                    <h3 className="text-base font-bold text-foreground">
                      Research ready — save to directory?
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleDiscard} className="btn-secondary text-sm">
                      <Trash2 size={14} />
                      Discard
                    </button>
                    <button onClick={handleSave} className="btn-primary text-sm">
                      <Save size={14} />
                      Save to Directory
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  This report will not be stored until you explicitly save it. Review the full report on the right before deciding.
                </p>
              </div>
            )}

            {/* Saved / discarded state */}
            {stage === 'saved' && (
              <div className="kraft-card border-l-4 border-l-severity-low p-5 animate-slide-up">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-severity-low flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">Saved to directory</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      &quot;{reviewCompany?.company_name}&quot; is now in your company directory.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/company-report?id=${reviewCompany?.id}`} className="btn-primary text-sm">
                      Open Report
                      <ChevronRight size={14} />
                    </Link>
                    <button onClick={handleReset} className="btn-secondary text-sm">
                      New Research
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stage === 'discarded' && (
              <div className="kraft-card p-5 animate-slide-up">
                <div className="flex items-center gap-3">
                  <XCircle size={20} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">Research discarded</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Nothing was saved to the directory.</p>
                  </div>
                  <button onClick={handleReset} className="btn-secondary text-sm">
                    Research Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: preview / instructions */}
          <div className="xl:col-span-2 space-y-4">
            {stage === 'idle' ? (
              <ResearchGuide />
            ) : stage === 'review' && reviewCompany ? (
              <ReviewPreview company={reviewCompany} />
            ) : stage === 'saved' && reviewCompany ? (
              <ReviewPreview company={reviewCompany} />
            ) : (
              <ResearchGuide minimal />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearchGuide({ minimal = false }: { minimal?: boolean }) {
  return (
    <div className="kraft-card p-5 space-y-4">
      {!minimal && (
        <>
          <span className="section-label text-2xs block">How It Works</span>
          <div className="space-y-3">
            {[
              {
                id: 'hw-1',
                step: '01',
                title: 'Enter company name',
                desc: 'Type any cold-chain operator, logistics firm, or pharma distributor.',
              },
              {
                id: 'hw-2',
                step: '02',
                title: 'Live research runs',
                desc: 'The tool searches public sources, reasons about gaps, and fact-checks every claim.',
              },
              {
                id: 'hw-3',
                step: '03',
                title: 'Review before saving',
                desc: "Nothing is stored until you explicitly approve it — you control the directory.",
              },
              {
                id: 'hw-4',
                step: '04',
                title: 'Open the report',
                desc: 'Use the sourced gaps and pitch opener right before your call.',
              },
            ].map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-primary/60 w-6 flex-shrink-0">{item.step}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="pt-3 border-t border-border">
        <span className="section-label text-2xs block mb-2">GND Service Lines</span>
        <div className="space-y-1.5">
          {[
            { id: 'sl-cold', name: 'Cold Chain Management', label: 'ThinxFresh' as const, desc: 'Real-time temp monitoring, alerts, compliance' },
            { id: 'sl-wms', name: 'Warehouse Management', label: 'Warehouse Management' as const, desc: 'WMS with sensor integration' },
            { id: 'sl-asset', name: 'Asset Tracking & Monitoring', label: 'Asset Tracking & Monitoring' as const, desc: 'Fleet and equipment telematics' },
            { id: 'sl-eng', name: 'Product Engineering', label: 'Product Engineering' as const, desc: 'Custom IoT hardware development' },
            { id: 'sl-platform', name: 'Platform', label: 'Platform' as const, desc: 'API, dashboards, data integration' },
          ].map((svc) => (
            <div key={svc.id} className="flex items-center gap-2">
              <ServiceBadge service={svc.label} size="sm" />
              <span className="text-2xs text-muted-foreground truncate">{svc.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {!minimal && (
        <div className="pt-3 border-t border-border">
          <span className="section-label text-2xs block mb-2">Recently Researched</span>
          <div className="space-y-1.5">
            {MOCK_COMPANIES.slice(0, 4).map((co) => {
              const sc = getSeverityCounts(co);
              return (
                <Link
                  key={`recent-${co.id}`}
                  href={`/company-report?id=${co.id}`}
                  className="flex items-center gap-2 py-1 hover:bg-secondary rounded px-1.5 transition-colors group"
                >
                  <Building2 size={12} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{co.company_name}</span>
                  {sc.high > 0 && <SeverityBadge severity="high" size="sm" />}
                  <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewPreview({ company }: { company: Company }) {
  const sevCounts = getSeverityCounts(company);
  const serviceLines = getServiceLines(company);

  return (
    <div className="kraft-card p-5 space-y-4 animate-slide-up">
      <span className="section-label text-2xs block">Report Preview</span>

      {/* Company header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground leading-tight">{company.company_name}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{company.industry}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin size={11} className="text-muted-foreground" />
            <span className="text-2xs text-muted-foreground font-mono">{company.hq}</span>
          </div>
        </div>
      </div>

      {/* Gap summary */}
      <div>
        <span className="section-label text-2xs block mb-2">Gaps Found</span>
        <div className="flex items-center gap-2 mb-3">
          {sevCounts.high > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono font-semibold bg-severity-high text-severity-high border border-severity-high px-2 py-0.5 rounded-sm">
              {sevCounts.high} High
            </span>
          )}
          {sevCounts.medium > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono font-semibold bg-severity-medium text-severity-medium border border-severity-medium px-2 py-0.5 rounded-sm">
              {sevCounts.medium} Medium
            </span>
          )}
          {sevCounts.low > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono font-semibold bg-severity-low text-severity-low border border-severity-low px-2 py-0.5 rounded-sm">
              {sevCounts.low} Low
            </span>
          )}
        </div>
        <div className="space-y-2">
          {company.gaps.slice(0, 3).map((gap) => (
            <div
              key={`preview-gap-${gap.id}`}
              className={`p-2.5 rounded border-l-2 bg-background ${
                gap.severity === 'high' ?'border-l-severity-high'
                  : gap.severity === 'medium' ?'border-l-severity-medium' :'border-l-severity-low'
              }`}
            >
              <div className="flex items-start gap-2">
                <SeverityBadge severity={gap.severity} size="sm" />
                <p className="text-xs font-medium text-foreground leading-snug">{gap.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service lines */}
      <div>
        <span className="section-label text-2xs block mb-2">GND Service Lines Hit</span>
        <div className="flex flex-wrap gap-1.5">
          {serviceLines.map((svc) => (
            <ServiceBadge key={`preview-svc-${svc}`} service={svc} size="sm" />
          ))}
        </div>
      </div>

      {/* Pitch opener preview */}
      <div className="bg-primary/5 border border-primary/20 rounded p-3">
        <span className="section-label text-2xs block mb-1.5">Pitch Opener</span>
        <p className="text-xs text-foreground leading-relaxed italic">&ldquo;{company.pitch.opener}&rdquo;</p>
      </div>

      {/* Facts count */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <FileText size={13} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-mono">
          {company.facts.length} sourced facts — all claims traceable to URLs
        </span>
      </div>
    </div>
  );
}