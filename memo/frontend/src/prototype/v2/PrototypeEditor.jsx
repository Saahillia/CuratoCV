import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
    LOGICAL_PAGE_WIDTH,
    LOGICAL_PAGE_HEIGHT,
    USABLE_PAGE_HEIGHT,
    USABLE_PAGE_WIDTH,
    getSelectionOffsets,
    restoreSelectionOffsets,
    paginateBlocks,
    resolveBookmarkGeometry
} from './PaginationEngine';
import './prototype.css';

// Initial sample content demonstrating multi-block document
const INITIAL_CONTENT = [
    { id: 'b-1', text: 'CuratoCV Memo V2 Architecture Prototype' },
    { id: 'b-2', text: 'This isolated prototype demonstrates Architecture A: a single root contenteditable editing context distributing blocks across fixed-size logical pages (794×1123 px at 96 DPI) via deterministic DOM element measurement.' },
    { id: 'b-3', text: 'Type continuously to observe automatic page creation when content exceeds usable page height. As you type, the caret position is captured, the DOM reflows, and the selection is restored to the exact character offset across page boundaries without losing focus.' }
];

export default function PrototypeEditor() {
    // Document State
    const [rawBlocks, setRawBlocks] = useState(INITIAL_CONTENT);
    const [pages, setPages] = useState([]);
    const [scale, setScale] = useState(1.0);
    const [activeBookmarkAnchor, setActiveBookmarkAnchor] = useState('Architecture A');
    const [bookmarkStatus, setBookmarkStatus] = useState(null);

    // Autosave State Machine: idle | dirty | saving | saved | error
    const [saveState, setSaveState] = useState('idle');
    const [simulateSaveError, setSimulateSaveError] = useState(false);
    const autosaveTimerRef = useRef(null);

    // Performance Metrics
    const [metrics, setMetrics] = useState({
        renderPassMs: 0,
        pageCount: 1,
        blockCount: 3,
        domNodeCount: 0
    });

    // DOM Refs
    const viewportRef = useRef(null);
    const documentRootRef = useRef(null);
    const savedCaretOffsetsRef = useRef(null);
    const isTypingRef = useRef(false);

    // Execute Pagination and Measure Performance
    const executePagination = useCallback((blocks) => {
        const startTime = performance.now();
        const computedPages = paginateBlocks(blocks, USABLE_PAGE_HEIGHT, USABLE_PAGE_WIDTH);
        const duration = performance.now() - startTime;

        setPages(computedPages);
        setMetrics(prev => ({
            ...prev,
            renderPassMs: Math.round(duration * 100) / 100,
            pageCount: computedPages.length,
            blockCount: blocks.length
        }));
    }, []);

    // Initial Pagination pass
    useEffect(() => {
        executePagination(rawBlocks);
    }, []);

    // Restore caret position after pagination updates the DOM
    useLayoutEffect(() => {
        if (savedCaretOffsetsRef.current && documentRootRef.current) {
            restoreSelectionOffsets(documentRootRef.current, savedCaretOffsetsRef.current);
            savedCaretOffsetsRef.current = null;
        }

        // Count DOM nodes
        if (documentRootRef.current) {
            const count = documentRootRef.current.getElementsByTagName('*').length;
            setMetrics(prev => ({ ...prev, domNodeCount: count }));
        }
    }, [pages]);

    // Handle User Input inside Contenteditable Root
    const handleInput = (e) => {
        isTypingRef.current = true;

        // 1. Capture logical caret offset before DOM re-renders
        if (documentRootRef.current) {
            savedCaretOffsetsRef.current = getSelectionOffsets(documentRootRef.current);
        }

        // 2. Extract updated block text from current DOM
        const root = documentRootRef.current;
        if (!root) return;

        const blockElements = Array.from(root.querySelectorAll('.doc-block, .page-break-marker'));
        const updatedBlocks = [];

        blockElements.forEach((el, idx) => {
            if (el.dataset.pageBreak === 'true') {
                updatedBlocks.push({
                    id: `pb-${idx}`,
                    isPageBreak: true
                });
            } else {
                // If it's a split tail, we may merge it conceptually with the head or treat as block
                updatedBlocks.push({
                    id: el.dataset.blockId || `b-${idx}`,
                    text: el.innerText || el.textContent || ''
                });
            }
        });

        // Trigger Autosave State Machine
        setSaveState('dirty');
        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = setTimeout(() => {
            setSaveState('saving');
            // Simulate API put
            setTimeout(() => {
                if (simulateSaveError) {
                    setSaveState('error');
                } else {
                    setSaveState('saved');
                }
            }, 400);
        }, 800);

        setRawBlocks(updatedBlocks);
        executePagination(updatedBlocks);
    };

    // Manual Save Retry for Autosave State Machine
    const handleRetrySave = () => {
        setSaveState('saving');
        setTimeout(() => {
            setSaveState('saved');
        }, 300);
    };

    // Add Page / Page Break at current caret
    const handleAddPageBreak = () => {
        if (documentRootRef.current) {
            savedCaretOffsetsRef.current = getSelectionOffsets(documentRootRef.current);
        }

        const newBlocks = [...rawBlocks, { id: `pb-${Date.now()}`, isPageBreak: true }, { id: `b-${Date.now()}`, text: 'Start of new page content...' }];
        setRawBlocks(newBlocks);
        executePagination(newBlocks);
    };

    // Delete Page Break
    const handleDeletePageBreak = () => {
        const breakIndex = rawBlocks.findIndex(b => b.isPageBreak);
        if (breakIndex !== -1) {
            const newBlocks = rawBlocks.filter((_, i) => i !== breakIndex);
            setRawBlocks(newBlocks);
            executePagination(newBlocks);
        }
    };

    // Bookmark Navigation via Authoritative DOM Geometry
    const handleNavigateBookmark = (anchor) => {
        if (!documentRootRef.current || !viewportRef.current) return;

        const result = resolveBookmarkGeometry(documentRootRef.current, viewportRef.current, anchor);

        if (result) {
            setBookmarkStatus({
                found: true,
                pageIndex: result.containingPageIndex + 1,
                scrollTop: Math.round(result.targetScrollTop),
                anchorRect: `${Math.round(result.anchorRect.top)}px, ${Math.round(result.anchorRect.left)}px`
            });

            // Smooth scroll DocumentViewport
            if (typeof viewportRef.current.scrollTo === 'function') {
                viewportRef.current.scrollTo({ top: result.targetScrollTop, behavior: 'smooth' });
            } else {
                viewportRef.current.scrollTop = result.targetScrollTop;
            }

            // Apply 1200ms highlight ring
            if (result.targetNode && result.targetNode.parentElement) {
                const parent = result.targetNode.parentElement;
                parent.classList.remove('bookmark-highlight-ring');
                void parent.offsetWidth; // force reflow
                parent.classList.add('bookmark-highlight-ring');
                setTimeout(() => {
                    parent.classList.remove('bookmark-highlight-ring');
                }, 1200);
            }
        } else {
            setBookmarkStatus({ found: false });
        }
    };

    // Test Data Loaders
    const loadDocumentPreset = (preset) => {
        let blocks = [];
        if (preset === '1-page') {
            blocks = [
                { id: 'b-1', text: 'Single Page Document Test' },
                { id: 'b-2', text: 'This document fits cleanly on Page 1 without overflowing.' },
                { id: 'b-3', text: 'Bookmark Target: SinglePageAnchor is located here.' }
            ];
        } else if (preset === 'single-long-paragraph') {
            // Very long single paragraph (1200 words) to verify single-block splitting
            const paragraph = Array(35).fill('Resilient software systems require exact DOM element measurements to guarantee desktop-grade visual pagination, continuous native caret traversal, and backward reflow on deletion without data loss or duplication.').join(' ');
            blocks = [
                { id: 'b-head', text: 'Long Single Block Splitting Proof' },
                { id: 'b-long', text: paragraph },
                { id: 'b-tail', text: 'Final conclusion block following the split paragraph. Bookmark Target: EndOfLongDocument.' }
            ];
        } else if (preset === '5-page') {
            blocks = [];
            for (let i = 1; i <= 25; i++) {
                blocks.push({
                    id: `b-5p-${i}`,
                    text: `Section ${i}: Standard block paragraph demonstrating 5-page continuous document structure with deterministic pagination. ` +
                          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
                });
                if (i === 12) {
                    blocks.push({ id: `b-anchor-5`, text: 'Anchor text for test: MiddleFivePageAnchor.' });
                }
            }
        } else if (preset === '10-page') {
            blocks = [];
            for (let i = 1; i <= 50; i++) {
                blocks.push({
                    id: `b-10p-${i}`,
                    text: `Chapter ${i}: Scaled benchmark paragraph for 10-page stress testing. ` +
                          'Testing DOM layout latency, tree traversal overhead, and scroll responsiveness in large document contexts.'
                });
                if (i === 45) {
                    blocks.push({ id: `b-anchor-10`, text: 'Anchor text for test: TenthPageDeepAnchor.' });
                }
            }
        }

        setRawBlocks(blocks);
        executePagination(blocks);
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Top Control Bar (Minimal Prototype Controls) */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800 border-b border-slate-700 shadow-md">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tracking-wide text-blue-400 uppercase">Phase 2 Prototype</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">Architecture A</span>
                </div>

                {/* Document Presets */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Presets:</span>
                    <button
                        onClick={() => loadDocumentPreset('1-page')}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded transition"
                    >
                        1 Page
                    </button>
                    <button
                        onClick={() => loadDocumentPreset('single-long-paragraph')}
                        className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded transition"
                        title="Splits a single long paragraph across pages"
                    >
                        Split Long Paragraph
                    </button>
                    <button
                        onClick={() => loadDocumentPreset('5-page')}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded transition"
                    >
                        5 Pages
                    </button>
                    <button
                        onClick={() => loadDocumentPreset('10-page')}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded transition"
                    >
                        10 Pages
                    </button>
                </div>

                {/* Page Operations */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddPageBreak}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 rounded transition"
                    >
                        + Add Page Break
                    </button>
                    <button
                        onClick={handleDeletePageBreak}
                        className="px-2.5 py-1 text-xs font-medium bg-rose-800 hover:bg-rose-700 rounded transition"
                    >
                        - Delete Page Break
                    </button>
                </div>

                {/* Responsive Scale Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Scale:</span>
                    <button
                        onClick={() => setScale(1.0)}
                        className={`px-2 py-0.5 text-xs rounded ${scale === 1.0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                        100% (Desktop)
                    </button>
                    <button
                        onClick={() => setScale(0.75)}
                        className={`px-2 py-0.5 text-xs rounded ${scale === 0.75 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                        75% (Tablet)
                    </button>
                    <button
                        onClick={() => setScale(0.5)}
                        className={`px-2 py-0.5 text-xs rounded ${scale === 0.5 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                    >
                        50% (Mobile)
                    </button>
                </div>

                {/* Autosave State Machine Indicator */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Autosave:</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        saveState === 'saved' ? 'bg-emerald-900 text-emerald-300' :
                        saveState === 'saving' ? 'bg-amber-900 text-amber-300 animate-pulse' :
                        saveState === 'dirty' ? 'bg-blue-900 text-blue-300' :
                        saveState === 'error' ? 'bg-rose-900 text-rose-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                        {saveState}
                    </span>
                    {saveState === 'error' && (
                        <button
                            onClick={handleRetrySave}
                            className="px-2 py-0.5 text-xs bg-rose-700 hover:bg-rose-600 rounded text-white"
                        >
                            Retry
                        </button>
                    )}
                    <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer ml-1">
                        <input
                            type="checkbox"
                            checked={simulateSaveError}
                            onChange={(e) => setSimulateSaveError(e.target.checked)}
                            className="rounded bg-slate-700 border-slate-600"
                        />
                        Simulate Error
                    </label>
                </div>
            </div>

            {/* Bookmark Navigator Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-850 border-b border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">Bookmark Anchor:</span>
                    <input
                        type="text"
                        value={activeBookmarkAnchor}
                        onChange={(e) => setActiveBookmarkAnchor(e.target.value)}
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs w-56"
                        placeholder="Anchor text..."
                    />
                    <button
                        onClick={() => handleNavigateBookmark(activeBookmarkAnchor)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white font-medium transition"
                    >
                        Resolve & Scroll to Page
                    </button>
                </div>

                {bookmarkStatus && (
                    <div className="text-xs font-mono">
                        {bookmarkStatus.found ? (
                            <span className="text-emerald-400">
                                ✓ Resolved to Page {bookmarkStatus.pageIndex} (Target Scroll: {bookmarkStatus.scrollTop}px, Rect: {bookmarkStatus.anchorRect})
                            </span>
                        ) : (
                            <span className="text-rose-400">✗ Anchor not found in DOM</span>
                        )}
                    </div>
                )}
            </div>

            {/* Main Document Viewport (ONLY SCROLL CONTAINER) */}
            <div
                ref={viewportRef}
                className="DocumentViewport flex-1"
            >
                <div
                    className="DocumentScaleWrapper"
                    style={{ transform: `scale(${scale})` }}
                >
                    {/* Single Contenteditable Root */}
                    <div
                        ref={documentRootRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleInput}
                        className="DocumentRoot"
                    >
                        {pages.map((page, pageIdx) => (
                            <div
                                key={`page-${pageIdx}`}
                                className="PageContainer"
                                data-page-index={pageIdx}
                            >
                                <div className="PageHeaderArea">
                                    <span>CuratoCV Memo</span>
                                    <span>Page {pageIdx + 1} of {pages.length}</span>
                                </div>

                                <div className="PageContent">
                                    {page.blocks.map((block, blockIdx) => {
                                        if (block.isPageBreak) {
                                            return (
                                                <div
                                                    key={block.id || `pb-${blockIdx}`}
                                                    data-page-break="true"
                                                    contentEditable={false}
                                                    className="page-break-marker"
                                                >
                                                    --- Manual Page Break ---
                                                </div>
                                            );
                                        }

                                        return (
                                            <p
                                                key={block.id || `blk-${blockIdx}`}
                                                data-block-id={block.id}
                                                className={`doc-block ${block.isSplitTail ? 'split-tail' : ''}`}
                                            >
                                                {block.text}
                                            </p>
                                        );
                                    })}
                                </div>

                                <div className="PageFooterArea">
                                    <span>Logical Size: {LOGICAL_PAGE_WIDTH} × {LOGICAL_PAGE_HEIGHT} px</span>
                                    <span>Scale: {Math.round(scale * 100)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between px-6 py-2 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
                <div className="flex items-center gap-6">
                    <span className="font-medium text-slate-200">
                        Page {metrics.pageCount > 0 ? '1' : '0'} of {metrics.pageCount}
                    </span>
                    <span>Blocks: {metrics.blockCount}</span>
                    <span>DOM Nodes: {metrics.domNodeCount}</span>
                </div>

                <div className="flex items-center gap-6">
                    <span>Pagination Pass: <strong className="text-slate-200">{metrics.renderPassMs}ms</strong></span>
                    <span>Logical: {LOGICAL_PAGE_WIDTH}×{LOGICAL_PAGE_HEIGHT}px</span>
                    <span>Usable: {USABLE_PAGE_WIDTH}×{USABLE_PAGE_HEIGHT}px</span>
                </div>
            </div>
        </div>
    );
}
