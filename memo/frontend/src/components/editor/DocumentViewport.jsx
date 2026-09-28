import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
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

const stringToBlocks = (str) => {
    if (!str && str !== '') return [];
    if (str === '') return [{ id: `b-${Date.now()}`, text: '' }];
    return str.split('\n').map((line, idx) => {
        if (line.trim() === '--- Page Break ---') {
            return { id: `pb-init-${idx}`, isPageBreak: true };
        }
        return { id: `b-init-${idx}`, text: line };
    });
};

const blocksToString = (blocks) => {
    return blocks.map(b => b.isPageBreak ? '--- Page Break ---' : b.text).join('\n');
};

export default function DocumentViewport({
    content,
    onChange,
    scale = 1.0,
    isHighlighted,
    bookmarkTarget = null,
    onNavigateComplete,
    onPageStatsChange,
    documentRootRefPassed,
    viewportRefPassed
}) {
    // We maintain internal blocks state for quick local update, but sync with `content` prop if it changes heavily 
    // Usually standard controlled input pattern applies, but due to caret/reflow we need careful DOM syncing.
    const [rawBlocks, setRawBlocks] = useState([]);
    const [pages, setPages] = useState([]);
    
    const viewportRef = viewportRefPassed || useRef(null);
    const documentRootRef = documentRootRefPassed || useRef(null);
    
    const savedCaretOffsetsRef = useRef(null);

    // Initialize/Sync blocks from external content ONLY when content fundamentally changes 
    // (not during active typing to avoid cyclic reset destroying caret)
    const contentHash = useMemo(() => {
        // Fast hash to detect external resets (like loading a new document)
        return (content || "").substring(0, 100) + (content || "").length;
    }, [content]);

    useEffect(() => {
        // Only trigger on mount or large external change, not per-keystroke.
        // We know if we're generating the change we don't need to rebuild from `content` string.
        const currentString = blocksToString(rawBlocks);
        if (content !== currentString) {
            const blocks = stringToBlocks(content);
            setRawBlocks(blocks);
            executePagination(blocks);
        }
    }, [contentHash]);

    const executePagination = useCallback((blocks) => {
        const computedPages = paginateBlocks(blocks, USABLE_PAGE_HEIGHT, USABLE_PAGE_WIDTH);
        setPages(computedPages);
        
        if (onPageStatsChange) {
            onPageStatsChange({
                pageCount: computedPages.length,
                blockCount: blocks.length
            });
        }
    }, [onPageStatsChange]);

    useLayoutEffect(() => {
        if (savedCaretOffsetsRef.current && documentRootRef.current) {
            restoreSelectionOffsets(documentRootRef.current, savedCaretOffsetsRef.current);
            savedCaretOffsetsRef.current = null;
        }
    }, [pages]);

    // Navigate to bookmark when bookmarkTarget prop changes
    useEffect(() => {
        if (bookmarkTarget && documentRootRef.current && viewportRef.current) {
            const result = resolveBookmarkGeometry(documentRootRef.current, viewportRef.current, bookmarkTarget.anchorText);
            
            if (result) {
                if (typeof viewportRef.current.scrollTo === 'function') {
                    viewportRef.current.scrollTo({ top: result.targetScrollTop, behavior: 'smooth' });
                } else {
                    viewportRef.current.scrollTop = result.targetScrollTop;
                }
                
                if (onNavigateComplete) {
                    onNavigateComplete(true, result.targetNode); // pass success and target node for highlighting logic
                }
                
                // Set temporary caret on target
                try {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(result.range);
                } catch(e) {}
            } else {
                if (onNavigateComplete) onNavigateComplete(false, null);
            }
        }
    }, [bookmarkTarget]);

    const handleInput = (e) => {
        if (documentRootRef.current) {
            savedCaretOffsetsRef.current = getSelectionOffsets(documentRootRef.current);
        }

        const root = documentRootRef.current;
        if (!root) return;

        // Iterate over block descendants and extract
        const blockElements = Array.from(root.querySelectorAll('.doc-block, .page-break-marker'));
        const updatedBlocks = [];

        blockElements.forEach((el, idx) => {
            if (el.dataset.pageBreak === 'true') {
                updatedBlocks.push({ id: `pb-${idx}`, isPageBreak: true });
            } else {
                // To support <br> or multiple lines in a single doc-block, innerText is usually best, 
                // but textContent gives raw text. We'll use textContent or innerText appropriately.
                // We use `.textContent` to capture spaces properly, though browsers sometimes inject <br>
                let text = el.innerText || el.textContent || '';
                // Handle Firefox/Chrome `<br>` insertion for new lines inside contenteditable
                if (text === '\n') text = '';
                updatedBlocks.push({ id: el.dataset.blockId || `b-${idx}`, text });
            }
        });

        setRawBlocks(updatedBlocks);
        executePagination(updatedBlocks);
        
        // Notify parent
        if (onChange) {
            onChange(blocksToString(updatedBlocks));
        }
    };

    return (
        <div
            ref={viewportRef}
            className="flex-1 overflow-y-auto overflow-x-auto bg-slate-100 flex flex-col items-center relative py-8 px-4"
            style={{ scrollBehavior: 'smooth' }}
        >
            <div
                className={`transition-all duration-300 ${isHighlighted ? "ring-4 ring-amber-300 bg-amber-50" : ""}`}
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '100%'
                }}
            >
                <div
                    ref={documentRootRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    style={{ outline: 'none', cursor: 'text', width: `${LOGICAL_PAGE_WIDTH}px` }}
                >
                    {pages.map((page, pageIdx) => (
                        <div
                            key={`page-${pageIdx}`}
                            className="bg-white"
                            data-page-index={pageIdx}
                            style={{
                                width: `${LOGICAL_PAGE_WIDTH}px`,
                                height: `${LOGICAL_PAGE_HEIGHT}px`,
                                padding: '96px',
                                boxSizing: 'border-box',
                                boxShadow: '0 4px 24px -2px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                                marginBottom: pageIdx === pages.length - 1 ? '0' : '32px',
                                position: 'relative',
                                overflow: 'hidden' // Strict: no internal scroll
                            }}
                        >
                            {/* Page header — lives inside PageContainer so it never decouples */}
                            <div className="absolute top-8 left-24 right-24 flex justify-between items-center text-[11px] text-slate-400 pointer-events-none select-none border-b border-slate-100 pb-1">
                                <span className="font-semibold tracking-wide text-brand-600">CuratoCV Memo</span>
                                <span>Page {pageIdx + 1} of {pages.length}</span>
                            </div>

                            <div 
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    overflow: 'hidden',
                                    fontFamily: '"Inter", sans-serif',
                                    fontSize: '16px',
                                    lineHeight: '24px',
                                    color: '#0f172a',
                                    outline: 'none'
                                }}
                            >
                                {page.blocks.length === 0 && (
                                    <p data-block-id={`empty-${pageIdx}`} className="doc-block" style={{ margin: '0 0 12px 0', minHeight: '24px' }}>
                                        <br />
                                    </p>
                                )}
                                {page.blocks.map((block, blockIdx) => {
                                    if (block.isPageBreak) {
                                        return (
                                            <div
                                                key={block.id || `pb-${blockIdx}`}
                                                data-page-break="true"
                                                contentEditable={false}
                                                className="page-break-marker flex items-center justify-center my-4 py-1.5 border border-dashed border-slate-300 bg-slate-50 rounded text-xs text-slate-500 select-none font-mono"
                                            >
                                                --- Page Break ---
                                            </div>
                                        );
                                    }

                                    return (
                                        <p
                                            key={block.id || `blk-${blockIdx}`}
                                            data-block-id={block.id}
                                            className={`doc-block ${block.isSplitTail ? 'mt-0' : 'mb-3'}`}
                                            style={{
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap',
                                                minHeight: '24px' // Ensure empty blocks are typed into correctly
                                            }}
                                        >
                                            {/* Fix for empty blocks collapsing height dynamically - inject br if empty */}
                                            {block.text === '' ? <br /> : block.text}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
