/**
 * PaginationEngine.js
 * Isolated DOM measurement, block splitting, caret preservation, and geometry-based bookmark resolution.
 */

export const LOGICAL_PAGE_WIDTH = 794;
export const LOGICAL_PAGE_HEIGHT = 1123;
export const DEFAULT_PAGE_MARGINS = { top: 96, bottom: 96, left: 96, right: 96 };
export const USABLE_PAGE_WIDTH = LOGICAL_PAGE_WIDTH - DEFAULT_PAGE_MARGINS.left - DEFAULT_PAGE_MARGINS.right; // 602px
export const USABLE_PAGE_HEIGHT = LOGICAL_PAGE_HEIGHT - DEFAULT_PAGE_MARGINS.top - DEFAULT_PAGE_MARGINS.bottom; // 931px

/**
 * Capture logical character offset of caret or selection within an element
 */
export function getSelectionOffsets(rootEl) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !rootEl) {
        return { start: 0, end: 0, collapsed: true };
    }

    const range = selection.getRangeAt(0);
    if (!rootEl.contains(range.startContainer) || !rootEl.contains(range.endContainer)) {
        return { start: 0, end: 0, collapsed: true };
    }

    let start = 0;
    let end = 0;
    let foundStart = false;
    let foundEnd = false;
    let charCount = 0;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
    let node = walker.nextNode();

    while (node) {
        if (!foundStart && node === range.startContainer) {
            start = charCount + range.startOffset;
            foundStart = true;
        }
        if (!foundEnd && node === range.endContainer) {
            end = charCount + range.endOffset;
            foundEnd = true;
        }

        charCount += node.textContent.length;

        if (foundStart && foundEnd) break;
        node = walker.nextNode();
    }

    if (!foundStart) start = charCount;
    if (!foundEnd) end = start;

    return {
        start,
        end,
        collapsed: range.collapsed || start === end
    };
}

/**
 * Restore caret or selection range based on logical character offsets
 */
export function restoreSelectionOffsets(rootEl, offsets) {
    if (!rootEl || offsets === null || offsets === undefined) return;

    const selection = window.getSelection();
    if (!selection) return;

    const targetStart = offsets.start || 0;
    const targetEnd = offsets.end !== undefined ? offsets.end : targetStart;

    let charCount = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
    let node = walker.nextNode();
    let lastNode = null;

    while (node) {
        lastNode = node;
        const nodeLen = node.textContent.length;

        if (!startNode && charCount + nodeLen >= targetStart) {
            startNode = node;
            startOffset = Math.max(0, Math.min(targetStart - charCount, nodeLen));
        }

        if (!endNode && charCount + nodeLen >= targetEnd) {
            endNode = node;
            endOffset = Math.max(0, Math.min(targetEnd - charCount, nodeLen));
        }

        charCount += nodeLen;
        if (startNode && endNode) break;

        node = walker.nextNode();
    }

    // Fallbacks if target offset is at or beyond document end
    if (!startNode && lastNode) {
        startNode = lastNode;
        startOffset = lastNode.textContent.length;
    }
    if (!endNode && lastNode) {
        endNode = lastNode;
        endOffset = lastNode.textContent.length;
    }

    if (startNode && endNode) {
        try {
            const range = document.createRange();
            range.setStart(startNode, startOffset);
            range.setEnd(endNode, endOffset);
            selection.removeAllRanges();
            selection.addRange(range);
        } catch (err) {
            console.warn('[PaginationEngine] Caret restoration warning:', err);
        }
    }
}

/**
 * Pure DOM measurement helper: Measures height of a block element in an offscreen container
 */
export function measureBlockHeight(htmlOrText, isHtml = false, width = USABLE_PAGE_WIDTH) {
    const container = document.createElement('div');
    container.style.width = `${width}px`;
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.style.fontSize = '16px';
    container.style.lineHeight = '24px';

    const p = document.createElement('p');
    p.style.margin = '0 0 12px 0';
    p.style.fontSize = '16px';
    p.style.lineHeight = '24px';
    p.style.wordBreak = 'break-word';
    p.style.whiteSpace = 'pre-wrap';

    if (isHtml) {
        p.innerHTML = htmlOrText;
    } else {
        p.textContent = htmlOrText || ' ';
    }

    container.appendChild(p);
    document.body.appendChild(container);

    const height = p.offsetHeight || Math.ceil(p.getBoundingClientRect().height);
    document.body.removeChild(container);

    return height;
}

/**
 * Splits a single long block (text string) into a fitting portion and a remaining portion
 * using binary search over words to find the maximal prefix that fits in availableHeight.
 */
export function splitBlockToFit(text, availableHeight, width = USABLE_PAGE_WIDTH) {
    const words = text.split(/(\s+)/); // Preserves whitespace tokens
    if (words.length <= 1) {
        return { fits: text, remainder: '' };
    }

    // Check if even first word exceeds
    const minHeight = measureBlockHeight(words[0], false, width);
    if (minHeight > availableHeight) {
        // First token itself doesn't fit on this page -> move entire block to next page
        return { fits: '', remainder: text };
    }

    let low = 1;
    let high = words.length;
    let bestSplitIndex = 0;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const prefix = words.slice(0, mid).join('');
        const height = measureBlockHeight(prefix, false, width);

        if (height <= availableHeight) {
            bestSplitIndex = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    if (bestSplitIndex === 0) {
        return { fits: '', remainder: text };
    }

    const fits = words.slice(0, bestSplitIndex).join('');
    const remainder = words.slice(bestSplitIndex).join('');

    return { fits, remainder };
}

/**
 * Computes deterministic pages from an array of raw block descriptors.
 * Handles automatic overflow, single-block splitting across pages, manual page breaks,
 * and backward reflow.
 */
export function paginateBlocks(rawBlocks, usableHeight = USABLE_PAGE_HEIGHT, usableWidth = USABLE_PAGE_WIDTH) {
    const pages = [];
    let currentPage = {
        pageIndex: 0,
        blocks: [],
        height: 0
    };

    let blockQueue = [...rawBlocks];

    while (blockQueue.length > 0) {
        const block = blockQueue.shift();

        // Check for manual page break marker
        if (block.isPageBreak) {
            // Push current page (even if empty, or move to next)
            pages.push(currentPage);
            currentPage = {
                pageIndex: pages.length,
                blocks: [block],
                height: 0
            };
            continue;
        }

        const textContent = block.text || '';
        const blockHeight = measureBlockHeight(textContent, block.isHtml, usableWidth);
        const remainingSpace = usableHeight - currentPage.height;

        if (blockHeight <= remainingSpace) {
            // Entire block fits on the current page
            currentPage.blocks.push({
                ...block,
                measuredHeight: blockHeight
            });
            currentPage.height += blockHeight;
        } else {
            // Block does not fit in remaining space
            if (remainingSpace > 36 && textContent.length > 20) {
                // Try splitting long paragraph to fill remainder of current page
                const { fits, remainder } = splitBlockToFit(textContent, remainingSpace, usableWidth);

                if (fits && fits.trim().length > 0 && remainder && remainder.trim().length > 0) {
                    const fitHeight = measureBlockHeight(fits, block.isHtml, usableWidth);
                    currentPage.blocks.push({
                        ...block,
                        text: fits,
                        isSplitHead: true,
                        measuredHeight: fitHeight
                    });
                    currentPage.height += fitHeight;

                    // Push remainder to the front of queue to start next page
                    blockQueue.unshift({
                        ...block,
                        id: `${block.id || 'blk'}-rem-${pages.length}`,
                        text: remainder,
                        isSplitTail: true
                    });

                    pages.push(currentPage);
                    currentPage = {
                        pageIndex: pages.length,
                        blocks: [],
                        height: 0
                    };
                    continue;
                }
            }

            // If current page already has content, push it and start a new page
            if (currentPage.blocks.length > 0) {
                pages.push(currentPage);
                currentPage = {
                    pageIndex: pages.length,
                    blocks: [],
                    height: 0
                };
                // Put block back to process on fresh page
                blockQueue.unshift(block);
            } else {
                // Fresh page but block is taller than entire page -> must place it and split rest
                const { fits, remainder } = splitBlockToFit(textContent, usableHeight, usableWidth);
                if (fits && remainder) {
                    const fitHeight = measureBlockHeight(fits, block.isHtml, usableWidth);
                    currentPage.blocks.push({
                        ...block,
                        text: fits,
                        isSplitHead: true,
                        measuredHeight: fitHeight
                    });
                    currentPage.height += fitHeight;
                    pages.push(currentPage);

                    currentPage = {
                        pageIndex: pages.length,
                        blocks: [],
                        height: 0
                    };
                    blockQueue.unshift({
                        ...block,
                        id: `${block.id || 'blk'}-rem-${pages.length}`,
                        text: remainder,
                        isSplitTail: true
                    });
                } else {
                    // Fallback: place block anyway to prevent infinite loop
                    currentPage.blocks.push({
                        ...block,
                        measuredHeight: blockHeight
                    });
                    currentPage.height += blockHeight;
                    pages.push(currentPage);
                    currentPage = {
                        pageIndex: pages.length,
                        blocks: [],
                        height: 0
                    };
                }
            }
        }
    }

    if (currentPage.blocks.length > 0 || pages.length === 0) {
        pages.push(currentPage);
    }

    // Re-index pages
    return pages.map((p, idx) => ({ ...p, pageIndex: idx }));
}

/**
 * Geometric Bookmark Resolution using authoritatively rendered DOM bounding rects.
 * Traverses text nodes for anchorText, queries rendered PageContainers,
 * verifies exact bounding rect intersection/containment, and returns scroll coordinates.
 */
export function resolveBookmarkGeometry(documentRoot, viewportEl, anchorText) {
    if (!documentRoot || !viewportEl || !anchorText) {
        return null;
    }

    // 1. Locate TextNode containing anchorText
    const walker = document.createTreeWalker(documentRoot, NodeFilter.SHOW_TEXT, null, false);
    let targetNode = null;
    let matchOffset = -1;
    let node = walker.nextNode();

    while (node) {
        const idx = node.textContent.indexOf(anchorText);
        if (idx !== -1) {
            targetNode = node;
            matchOffset = idx;
            break;
        }
        node = walker.nextNode();
    }

    if (!targetNode) {
        return null;
    }

    // 2. Create Range for bounding rect
    const range = document.createRange();
    range.setStart(targetNode, matchOffset);
    range.setEnd(targetNode, matchOffset + anchorText.length);
    const anchorRect = range.getBoundingClientRect();

    // 3. Query all rendered PageContainer elements
    const pageContainers = Array.from(documentRoot.querySelectorAll('.PageContainer'));
    let containingPageIndex = -1;
    let maxOverlap = -1;

    pageContainers.forEach((pageEl, idx) => {
        const pageRect = pageEl.getBoundingClientRect();

        // Check if anchorRect vertical midpoint is inside pageRect
        const anchorMidY = (anchorRect.top + anchorRect.bottom) / 2;
        if (anchorMidY >= pageRect.top && anchorMidY <= pageRect.bottom) {
            containingPageIndex = idx;
        }

        // Overlap calculation as fallback
        const overlapTop = Math.max(anchorRect.top, pageRect.top);
        const overlapBottom = Math.min(anchorRect.bottom, pageRect.bottom);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        if (overlapHeight > maxOverlap) {
            maxOverlap = overlapHeight;
            if (containingPageIndex === -1) {
                containingPageIndex = idx;
            }
        }
    });

    if (containingPageIndex === -1 && pageContainers.length > 0) {
        containingPageIndex = 0;
    }

    // 4. Calculate target scroll offset relative to viewport
    const viewportRect = viewportEl.getBoundingClientRect();
    const targetScrollTop = viewportEl.scrollTop + (anchorRect.top - viewportRect.top) - 40;

    return {
        targetNode,
        anchorRect,
        containingPageIndex,
        targetScrollTop: Math.max(0, targetScrollTop),
        range
    };
}
