/**
 * Owns Memo's folder navigation and document overview while the root shell only mounts the product route.
 * Folder and note records remain user-scoped through the authenticated Memo API.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronsDownUp,
    FilePlus2,
    FileText,
    Folder,
    FolderPlus,
    LoaderCircle,
    Menu,
    NotebookPen,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@curatocv/api-client";
import AccountMenu from "@curatocv/platform-frontend/components/common/AccountMenu";
import BrandLockup from "@curatocv/platform-frontend/components/common/BrandLockup";
import Button from "@curatocv/platform-frontend/components/common/Button";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
    { value: "name-asc", label: "Name (A–Z)" },
    { value: "name-desc", label: "Name (Z–A)" },
    { value: "updated-desc", label: "Newest first" },
    { value: "updated-asc", label: "Oldest first" },
];

const getErrorMessage = (error) =>
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

const formatCreatedAt = (dateValue) => {
    if (!dateValue) return "Date unavailable";
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const InlineCreateInput = ({ type, onEnter, onCancel }) => {
    const [value, setValue] = useState("");

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter") {
                e.preventDefault();
                if (value.trim()) onEnter(value.trim());
                else onCancel();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [value, onEnter, onCancel]);

    return (
        <li className="flex min-w-0 items-center gap-0.5">
            <span className="size-5 shrink-0" aria-hidden="true" />
            <div className="flex min-h-8 w-full min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-brand-50/60 px-1.5 py-1 text-xs">
                {type === "folder" ? (
                    <Folder className="shrink-0 text-brand-600" size={14} />
                ) : (
                    <FileText className="shrink-0 text-brand-600" size={14} />
                )}
                <input
                    autoFocus
                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-brand-300 text-slate-800"
                    placeholder={type === "folder" ? "Folder name..." : "File name..."}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={onCancel}
                    aria-label={type === "folder" ? "New folder name" : "New file name"}
                    role="textbox"
                />
            </div>
        </li>
    );
};

const FolderRowActions = ({ onNewFile, onNewFolder, onDelete }) => (
    <div className="ml-auto hidden items-center gap-0.5 group-hover:flex">
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNewFile(); }}
            className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="New File here"
            title="New File..."
        >
            <FilePlus2 size={12} />
        </button>
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNewFolder(); }}
            className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="New Folder here"
            title="New Folder..."
        >
            <FolderPlus size={12} />
        </button>
        {onDelete && (
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
                className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-red-600"
                aria-label="Delete folder"
                title="Delete folder"
            >
                <Trash2 size={12} />
            </button>
        )}
    </div>
);

const FolderTree = ({
    folders,
    documents,
    selectedFolderId,
    selectedDocumentId,
    expandedFolderIds,
    sortMode = "name-asc",
    onSelect,
    onSelectDocument,
    onToggle,
    onDeleteDocument,
    onDeleteFolder,
    onLoadMore,
    hasMoreDocuments,
    isLoadingDocuments,
    inlineCreate,
    onInlineCreateSubmit,
    onInlineCreateCancel,
    onInlineCreateStart,
}) => {
    const childrenByParent = useMemo(() => {
        const groups = new Map();
        folders.forEach((folder) => {
            const parentKey = folder.parentId || "";
            const siblings = groups.get(parentKey) || [];
            siblings.push(folder);
            groups.set(parentKey, siblings);
        });
        groups.forEach((siblings) => {
            siblings.sort((first, second) => {
                if (sortMode === "name-desc") return second.name.localeCompare(first.name);
                if (sortMode === "updated-desc") return new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0);
                if (sortMode === "updated-asc") return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
                return first.name.localeCompare(second.name);
            });
        });
        return groups;
    }, [folders, sortMode]);

    const documentsByFolder = useMemo(() => {
        const groups = new Map();
        const legacyFoldersByName = new Map(
            folders.filter((folder) => folder.isLegacy).map((folder) => [folder.name.toLocaleLowerCase(), folder.id]),
        );

        documents.forEach((document) => {
            const legacyFolderId = document.folder
                ? legacyFoldersByName.get(document.folder.toLocaleLowerCase())
                : null;
            const parentId = document.folderId ? String(document.folderId) : legacyFolderId || "";
            const siblings = groups.get(parentId) || [];
            siblings.push(document);
            groups.set(parentId, siblings);
        });
        groups.forEach((siblings) => {
            siblings.sort((first, second) => {
                if (sortMode === "name-desc") return second.title.localeCompare(first.title);
                if (sortMode === "updated-desc") return new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0);
                if (sortMode === "updated-asc") return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
                return first.title.localeCompare(second.title);
            });
        });
        return groups;
    }, [documents, folders, sortMode]);

    // Render a single document as a <li> item for use inside a shared children list.
    const renderDocumentItem = (document) => {
        const isSelected = selectedDocumentId === String(document._id);
        return (
            <li key={document._id} className="group/doc flex min-w-0 items-center gap-0.5">
                <span className="size-5 shrink-0" aria-hidden="true" />
                <button
                    type="button"
                    onClick={() => onSelectDocument(document)}
                    className={`flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs transition ${
                        isSelected
                            ? "bg-brand-50 font-semibold text-brand-700"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                    aria-current={isSelected ? "true" : undefined}
                    title={document.title}
                >
                    <FileText aria-hidden="true" className="shrink-0 text-slate-500" size={14} />
                    <span className="truncate">{document.title}</span>
                </button>
                {onDeleteDocument && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteDocument(document._id); }}
                        className="hidden size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-red-600 group-hover/doc:flex"
                        aria-label={`Delete ${document.title}`}
                        title="Delete document"
                    >
                        <Trash2 size={12} />
                    </button>
                )}
            </li>
        );
    };

    // Recursive renderer: each call produces one <ul> whose <li> children are the DIRECT
    // children of `parentId` — both subfolders and documents — rendered as siblings in a
    // single unified list. Subfolders recurse inline before continuing to the next sibling,
    // so the tree always reflects true parent-child relationships rather than two separate
    // passes (folders first, then all documents after the subtree).
    const renderChildren = (parentId = null, depth = 0) => {
        const subfolders = childrenByParent.get(parentId || "") || [];
        const docs = documentsByFolder.get(parentId || "") || [];
        const showInlineHere = Boolean(inlineCreate && inlineCreate.parentId === (parentId || null));

        return (
            <ul className={depth === 0 ? "space-y-0.5" : "mt-0.5 space-y-0.5 border-l border-slate-200 ml-2.5 pl-2"}>
                {/* Subfolders first (alphabetical), each recursing into their own children inline */}
                {subfolders.map((folder) => {
                    const isInlineCreatingHere = Boolean(inlineCreate && inlineCreate.parentId === folder.id);
                    const folderHasChildren = childrenByParent.has(folder.id) || documentsByFolder.has(folder.id) || isInlineCreatingHere;
                    const isExpanded = expandedFolderIds.has(folder.id) || isInlineCreatingHere;
                    const isSelected = selectedFolderId === folder.id;

                    return (
                        <li key={folder.id}>
                            <div className="group flex min-w-0 items-center gap-0.5">
                                {folderHasChildren ? (
                                    <button
                                        type="button"
                                        onClick={() => onToggle(folder.id)}
                                        className="inline-flex size-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${folder.name}`}
                                        aria-expanded={isExpanded ? "true" : "false"}
                                    >
                                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>
                                ) : (
                                    <span className="size-5 shrink-0" aria-hidden="true" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => onSelect(folder.id)}
                                    className={`flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs transition ${
                                        isSelected
                                            ? "bg-brand-50 font-semibold text-brand-700"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                    aria-current={isSelected ? "page" : undefined}
                                >
                                    <Folder aria-hidden="true" className="shrink-0 text-brand-600" size={14} />
                                    <span className="truncate font-medium">{folder.name}</span>
                                </button>
                                <FolderRowActions
                                    onNewFile={() => onInlineCreateStart("file", folder.id)}
                                    onNewFolder={() => onInlineCreateStart("folder", folder.id)}
                                    onDelete={!folder.isLegacy && onDeleteFolder ? () => onDeleteFolder(folder.id) : undefined}
                                />
                            </div>
                            {/* Recurse into this folder's children (subfolders + documents) inline,
                                so "return to parent" happens naturally after this <li> closes */}
                            {folderHasChildren && isExpanded && renderChildren(folder.id, depth + 1)}
                        </li>
                    );
                })}
                {/* Documents that are direct children of this parent — rendered as siblings
                    of folder <li> items, not in a separate subtree appended afterward */}
                {docs.map(renderDocumentItem)}
                {/* Inline creation input appears at this level when active */}
                {showInlineHere && (
                    <InlineCreateInput
                        type={inlineCreate.type}
                        onEnter={(val) => onInlineCreateSubmit(val, inlineCreate.type, parentId || null)}
                        onCancel={onInlineCreateCancel}
                    />
                )}
            </ul>
        );
    };

    return (
        <>
            {renderChildren()}
        </>
    );
};

const ExplorerAction = ({ label, onClick, children }) => (
    <span className="group relative inline-flex">
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="cv-touch-target inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
            {children}
        </button>
        <span
            role="tooltip"
            className="pointer-events-none invisible absolute left-1/2 top-full z-40 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:visible group-focus-within:visible"
        >
            {label}
        </span>
    </span>
);

const MemoWorkspace = () => {
    const [documents, setDocuments] = useState([]);
    const [explorerDocuments, setExplorerDocuments] = useState([]);
    const [folders, setFolders] = useState([]);
    const [legacyFolders, setLegacyFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const [expandedFolderIds, setExpandedFolderIds] = useState(() => new Set());
    const [title, setTitle] = useState("");
    const [folderName, setFolderName] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [explorerPage, setExplorerPage] = useState(1);
    const [explorerPages, setExplorerPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingFolders, setIsLoadingFolders] = useState(true);
    const [isLoadingExplorer, setIsLoadingExplorer] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [backendSearchResults, setBackendSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [explorerError, setExplorerError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [folderLoadError, setFolderLoadError] = useState("");
    const [createError, setCreateError] = useState("");
    const [folderCreateError, setFolderCreateError] = useState("");
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showDocumentForm, setShowDocumentForm] = useState(false);
    const [inlineCreate, setInlineCreate] = useState(null);
    const [sortMode, setSortMode] = useState("name-asc");
    const navigate = useNavigate();
    const [showSortMenu, setShowSortMenu] = useState(false);
    const sortMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
                setShowSortMenu(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowSortMenu(false);
            }
        };
        if (showSortMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showSortMenu]);

    const folderEntries = useMemo(() => {
        const storedFolders = folders.map((folder) => ({
            id: String(folder._id),
            name: folder.name,
            parentId: folder.parentId ? String(folder.parentId) : null,
            updatedAt: folder.updatedAt,
            isLegacy: false,
        }));
        const storedRootNames = new Set(
            storedFolders.filter((folder) => !folder.parentId).map((folder) => folder.name.toLocaleLowerCase()),
        );
        const legacyEntries = legacyFolders
            .filter((name) => !storedRootNames.has(name.toLocaleLowerCase()))
            .map((name) => ({
                id: `legacy:${name}`,
                name,
                parentId: null,
                isLegacy: true,
            }));

        return [...storedFolders, ...legacyEntries];
    }, [folders, legacyFolders]);

    const activeFolder = folderEntries.find((folder) => folder.id === selectedFolderId) || null;
    const currentDirectFolders = useMemo(() => {
        const targetParentId = selectedFolderId || null;
        const filtered = folderEntries.filter((folder) => folder.parentId === targetParentId);
        return [...filtered].sort((first, second) => {
            if (sortMode === "name-desc") return second.name.localeCompare(first.name);
            if (sortMode === "updated-desc") return new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0);
            if (sortMode === "updated-asc") return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
            return first.name.localeCompare(second.name);
        });
    }, [folderEntries, selectedFolderId, sortMode]);

    const currentDirectDocuments = useMemo(() => {
        const targetFolderId = selectedFolderId || null;
        let filtered = [];
        const sourceDocs = documents.length > 0 ? documents : explorerDocuments;
        if (activeFolder && activeFolder.isLegacy) {
            filtered = sourceDocs.filter((doc) => doc.folder && doc.folder.toLocaleLowerCase() === activeFolder.name.toLocaleLowerCase());
        } else {
            filtered = sourceDocs.filter((doc) => (doc.folderId ? String(doc.folderId) : null) === targetFolderId);
        }
        return [...filtered].sort((first, second) => {
            if (sortMode === "name-desc") return second.title.localeCompare(first.title);
            if (sortMode === "updated-desc") return new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0);
            if (sortMode === "updated-asc") return new Date(first.updatedAt || 0) - new Date(second.updatedAt || 0);
            return first.title.localeCompare(second.title);
        });
    }, [documents, explorerDocuments, selectedFolderId, activeFolder, sortMode]);
    const knownDocuments = useMemo(() => {
        const uniqueDocuments = new Map();
        [...explorerDocuments, ...documents].forEach((document) => uniqueDocuments.set(String(document._id), document));
        return [...uniqueDocuments.values()];
    }, [documents, explorerDocuments]);

    const isSearchActive = searchTerm.trim().length > 0;

    const searchMatchingFolders = useMemo(() => {
        if (!isSearchActive) return [];
        const term = searchTerm.toLowerCase();
        return folderEntries.filter((folder) => folder.name.toLowerCase().includes(term));
    }, [folderEntries, searchTerm, isSearchActive]);

    const searchMatchingDocuments = useMemo(() => {
        if (!isSearchActive) return [];
        const term = searchTerm.toLowerCase();
        const localMatches = knownDocuments.filter((doc) => (doc.title || "").toLowerCase().includes(term));
        const mergedMap = new Map();
        localMatches.forEach((doc) => mergedMap.set(String(doc._id), doc));
        backendSearchResults.forEach((doc) => mergedMap.set(String(doc._id), doc));
        return Array.from(mergedMap.values());
    }, [knownDocuments, backendSearchResults, searchTerm, isSearchActive]);
    const selectedDocument = knownDocuments.find((document) => String(document._id) === selectedDocumentId) || null;
    const breadcrumbFolders = useMemo(() => {
        const foldersById = new Map(folderEntries.map((folder) => [folder.id, folder]));
        const ancestors = [];
        const visited = new Set();
        let currentId = selectedFolderId;

        if (!currentId && selectedDocument) {
            if (selectedDocument.folderId) {
                currentId = String(selectedDocument.folderId);
            } else if (selectedDocument.folder) {
                const legacyFolder = folderEntries.find((f) => f.isLegacy && f.name.toLocaleLowerCase() === selectedDocument.folder.toLocaleLowerCase());
                if (legacyFolder) currentId = legacyFolder.id;
            }
        }

        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const folder = foldersById.get(currentId);
            if (!folder) break;
            ancestors.unshift(folder);
            currentId = folder.parentId;
        }
        return ancestors;
    }, [folderEntries, selectedFolderId, selectedDocument]);


    const loadExplorerData = useCallback(async (signal) => {
        setIsLoadingExplorer(true);
        setExplorerError("");
        try {
            const [explorerRes, foldersRes] = await Promise.all([
                api.get("/notes/explorer", { signal }),
                api.get("/notes/folders", { signal }).catch(() => null),
            ]);
            const eData = explorerRes.data?.data;
            if (Array.isArray(eData?.documents)) {
                setExplorerDocuments(eData.documents);
            }
            if (Array.isArray(eData?.folders)) {
                setFolders(eData.folders);
                setExpandedFolderIds((current) => {
                    if (current.size > 0) return current;
                    return new Set([
                        ...eData.folders.filter((folder) => !folder.parentId).map((folder) => String(folder._id)),
                    ]);
                });
            }
            if (foldersRes?.data?.data?.legacyFolders && Array.isArray(foldersRes.data.data.legacyFolders)) {
                setLegacyFolders(foldersRes.data.data.legacyFolders);
            }
        } catch (error) {
            if (!signal?.aborted) setExplorerError(getErrorMessage(error));
        } finally {
            if (!signal?.aborted) {
                setIsLoadingExplorer(false);
                setIsLoadingFolders(false);
            }
        }
    }, []);

    const loadDocuments = useCallback(async (requestedPage = 1, append = false, signal) => {
        setIsLoading(true);
        setLoadError("");

        try {
            // Keep legacy text folders readable, while new folders filter by their owner-checked persistent ID.
            const folderFilter = activeFolder
                ? activeFolder.isLegacy
                    ? { folder: activeFolder.name }
                    : { folderId: activeFolder.id }
                : {};
            const response = await api.get("/notes", {
                params: { page: requestedPage, limit: PAGE_SIZE, ...folderFilter },
                signal,
            });
            const result = response.data?.data;
            const loadedDocuments = Array.isArray(result?.notes) ? result.notes : [];

            // Append only the next requested page; the backend caps each result to keep large workspaces bounded.
            setDocuments((current) => append ? [...current, ...loadedDocuments] : loadedDocuments);
            setPage(Number(result?.page) || requestedPage);
            setPages(Math.max(1, Number(result?.pages) || 1));
            setTotal(Number(result?.total) || 0);
        } catch (error) {
            if (!signal?.aborted) setLoadError(getErrorMessage(error));
        } finally {
            if (!signal?.aborted) setIsLoading(false);
        }
    }, [activeFolder]);

    const handleDeleteDocument = useCallback(async (documentId) => {
        const idStr = String(documentId);
        // Optimistic removal
        setExplorerDocuments((current) => current.filter((doc) => String(doc._id) !== idStr));
        setDocuments((current) => current.filter((doc) => String(doc._id) !== idStr));
        if (selectedDocumentId === idStr) {
            setSelectedDocumentId(null);
        }
        try {
            await api.delete(`/notes/${idStr}`);
        } catch (error) {
            setExplorerError(getErrorMessage(error));
            loadExplorerData();
            loadDocuments(1);
        }
    }, [selectedDocumentId, loadExplorerData, loadDocuments]);

    const [folderToDelete, setFolderToDelete] = useState(null);
    const [isDeletingFolder, setIsDeletingFolder] = useState(false);
    const [deleteFolderError, setDeleteFolderError] = useState("");

    const handleDeleteFolder = useCallback(async (folderId, forcePermanent = false) => {
        const idStr = String(folderId);
        const endpoint = forcePermanent ? `/notes/folders/${idStr}/permanent` : `/notes/folders/${idStr}`;

        if (forcePermanent) {
            setIsDeletingFolder(true);
            setDeleteFolderError("");
        }

        // Optimistic removal
        setFolders((current) => current.filter((f) => String(f._id) !== idStr));
        if (selectedFolderId === idStr) {
            setSelectedFolderId(null);
        }
        try {
            await api.delete(endpoint);
            setFolderToDelete(null);
            setDeleteFolderError("");
            loadExplorerData();
            loadDocuments(1);
        } catch (error) {
            const errMessage = getErrorMessage(error);
            // If standard delete failed because folder is not empty, prompt for permanent delete confirmation modal
            if (!forcePermanent && error?.response?.status === 400) {
                // Restore folder state in UI
                loadExplorerData();
                setFolderToDelete({ id: idStr, name: folders.find(f => f.id === idStr)?.name || "Folder" });
                setDeleteFolderError("");
                return;
            }
            if (forcePermanent) {
                setDeleteFolderError(errMessage);
            } else {
                setExplorerError(errMessage);
            }
            loadExplorerData();
        } finally {
            if (forcePermanent) {
                setIsDeletingFolder(false);
            }
        }
    }, [selectedFolderId, loadExplorerData, loadDocuments, folders]);

    useEffect(() => {
        const controller = new AbortController();
        loadExplorerData(controller.signal);
        return () => controller.abort();
    }, [loadExplorerData]);

    useEffect(() => {
        const term = searchTerm.trim();
        if (!term) {
            setBackendSearchResults([]);
            setSearchError("");
            setIsSearchLoading(false);
            return;
        }

        setIsSearchLoading(true);
        setSearchError("");
        const controller = new AbortController();

        const timeoutId = setTimeout(async () => {
            try {
                const response = await api.get(`/notes?search=${encodeURIComponent(term)}`, {
                    signal: controller.signal
                });
                setBackendSearchResults(response.data?.data?.notes || []);
            } catch (error) {
                if (error.name === "CanceledError") return;
                setSearchError(getErrorMessage(error));
            } finally {
                setIsSearchLoading(false);
            }
        }, 250);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [searchTerm]);

    useEffect(() => {
        if (isLoadingFolders) return;
        const controller = new AbortController();
        loadDocuments(1, false, controller.signal);
        return () => controller.abort();
    }, [loadDocuments, isLoadingFolders]);

    useEffect(() => {
        if (!mobileSidebarOpen) return undefined;
        const handleEscape = (event) => {
            if (event.key === "Escape") setMobileSidebarOpen(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [mobileSidebarOpen]);

    const openFolderForm = () => {
        setShowFolderForm(true);
        setShowDocumentForm(false);
        setFolderCreateError("");
        setMobileSidebarOpen(false);
    };

    const openDocumentForm = () => {
        setShowDocumentForm(true);
        setShowFolderForm(false);
        setMobileSidebarOpen(false);
    };

    const handleInlineCreateStart = useCallback((type, parentId) => {
        const normalizedParentId = parentId || null;
        setInlineCreate({ type, parentId: normalizedParentId });
        setShowFolderForm(false);
        setShowDocumentForm(false);
        setMobileSidebarOpen(false);
    }, []);

    const handleInlineCreateSubmit = useCallback(async (name, type, parentId) => {
        const cleanName = name.trim();
        if (!cleanName) {
            setInlineCreate(null);
            return;
        }
        if (type === "folder") {
            setIsCreatingFolder(true);
            setFolderCreateError("");
            try {
                const parentIdArg = parentId || undefined;
                const response = await api.post("/notes/folders", {
                    name: cleanName,
                    ...(parentIdArg ? { parentId: parentIdArg } : {}),
                });
                const newFolder = response.data?.data?.folder;
                if (!newFolder?._id) throw new Error("The server did not return the created folder.");
                const createdFolder = { ...newFolder, parentId: newFolder.parentId || null };
                setFolders((current) => [...current, createdFolder]);
                setExpandedFolderIds((current) => new Set([
                    ...current,
                    ...(createdFolder.parentId ? [String(createdFolder.parentId)] : []),
                    String(createdFolder._id),
                ]));
                setSelectedFolderId(String(createdFolder._id));
                setFolderName("");
            } catch (error) {
                setFolderCreateError(getErrorMessage(error));
            } finally {
                setIsCreatingFolder(false);
            }
        } else {
            setIsCreating(true);
            setCreateError("");
            try {
                const folderData = parentId
                    ? { folderId: parentId }
                    : {};
                const response = await api.post("/notes/create", { title: cleanName, content: "", ...folderData });
                const createdDocument = response.data?.data?.note;
                if (createdDocument?._id) {
                    navigate(`/products/memo/editor?id=${createdDocument._id}`);
                }
                setTitle("");
            } catch (error) {
                setCreateError(getErrorMessage(error));
            } finally {
                setIsCreating(false);
            }
        }
        setInlineCreate(null);
    }, [folderEntries]);

    const handleInlineCreateCancel = useCallback(() => {
        setInlineCreate(null);
    }, []);

    const handleCreateFolder = async (event) => {
        event.preventDefault();
        const cleanName = folderName.trim();
        if (!cleanName) {
            setFolderCreateError("Enter a folder name to continue.");
            return;
        }

        setIsCreatingFolder(true);
        setFolderCreateError("");
        try {
            // A selected persisted folder becomes the parent; legacy virtual folders remain readable but cannot be parents.
            const parentId = activeFolder && !activeFolder.isLegacy ? activeFolder.id : undefined;
            const response = await api.post("/notes/folders", {
                name: cleanName,
                ...(parentId ? { parentId } : {}),
            });
            const newFolder = response.data?.data?.folder;
            if (!newFolder?._id) throw new Error("The server did not return the created folder.");

            const createdFolder = { ...newFolder, parentId: newFolder.parentId || null };
            setFolders((current) => [...current, createdFolder]);
            setExpandedFolderIds((current) => new Set([
                ...current,
                ...(createdFolder.parentId ? [String(createdFolder.parentId)] : []),
                String(createdFolder._id),
            ]));
            setSelectedFolderId(String(createdFolder._id));
            setFolderName("");
            setShowFolderForm(false);
            setMobileSidebarOpen(false);
        } catch (error) {
            setFolderCreateError(getErrorMessage(error));
        } finally {
            setIsCreatingFolder(false);
        }
    };

    const handleCreateDocument = async (event) => {
        event.preventDefault();
        const cleanTitle = title.trim();
        if (!cleanTitle) {
            setCreateError("Enter a document title to continue.");
            return;
        }

        setIsCreating(true);
        setCreateError("");
        try {
            // Folder IDs are used for newly created folders; legacy folders keep the existing text-only API behavior.
            const folderData = activeFolder
                ? activeFolder.isLegacy
                    ? { folder: activeFolder.name }
                    : { folderId: activeFolder.id }
                : {};
            const response = await api.post("/notes/create", { title: cleanTitle, content: "", ...folderData });
            const createdDocument = response.data?.data?.note;
            if (createdDocument?._id) {
                navigate(`/products/memo/editor?id=${createdDocument._id}`);
            }
            setTitle("");
            setShowDocumentForm(false);
            // Refresh in the background so the optimistic insert stays visible immediately.
            loadDocuments(1);
            loadExplorerData();
        } catch (error) {
            setCreateError(getErrorMessage(error));
        } finally {
            setIsCreating(false);
        }
    };

    const selectFolder = (folderId) => {
        setSelectedFolderId(folderId);
        setSelectedDocumentId(null);
        if (folderId) {
            const foldersById = new Map(folderEntries.map((folder) => [folder.id, folder]));
            const ancestors = new Set();
            let currentId = folderId;
            while (currentId && !ancestors.has(currentId)) {
                ancestors.add(currentId);
                currentId = foldersById.get(currentId)?.parentId || null;
            }
            setExpandedFolderIds((current) => new Set([...current, ...ancestors]));
        }
        setPage(1);
        setMobileSidebarOpen(false);
    };

    const selectDocument = (document) => {
        setSelectedDocumentId(String(document._id));
        if (document.folderId) {
            setSelectedFolderId(String(document.folderId));
        } else if (document.folder) {
            const legacyFolder = folderEntries.find((f) => f.isLegacy && f.name.toLocaleLowerCase() === document.folder.toLocaleLowerCase());
            if (legacyFolder) setSelectedFolderId(legacyFolder.id);
        } else {
            setSelectedFolderId(null);
        }
        navigate(`/products/memo/editor?id=${document._id}`);
    };

    const refreshExplorer = () => {
        loadExplorerData();
        loadDocuments(1);
    };

    const toggleFolderExpanded = (folderId) => {
        setExpandedFolderIds((current) => {
            const next = new Set(current);
            if (next.has(folderId)) next.delete(folderId);
            else next.add(folderId);
            return next;
        });
    };

    const sidebarContents = (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-1 border-b border-slate-200 px-3 py-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Explorer</p>
                    <h2 className="truncate text-sm font-bold text-brand-800">Memo</h2>
                </div>
                <div className="flex shrink-0 items-center gap-0" role="toolbar" aria-label="Memo Explorer actions">
                    <ExplorerAction label="New Folder" onClick={() => handleInlineCreateStart("folder", selectedFolderId)}><FolderPlus aria-hidden="true" size={16} /></ExplorerAction>
                    <ExplorerAction label="New File" onClick={() => handleInlineCreateStart("file", selectedFolderId)}><FilePlus2 aria-hidden="true" size={16} /></ExplorerAction>
                    <ExplorerAction label="Refresh Explorer" onClick={refreshExplorer}><RefreshCw aria-hidden="true" size={15} /></ExplorerAction>
                    <ExplorerAction label="Collapse All Folders" onClick={() => setExpandedFolderIds(new Set())}><ChevronsDownUp aria-hidden="true" size={16} /></ExplorerAction>
                </div>
            </div>
            <nav aria-label="Memo Explorer" className="flex-1 overflow-y-auto px-3 py-3">
                <div className="relative mb-3">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="text-slate-400" size={16} aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search folders and documents..."
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setSearchTerm("");
                        }}
                        aria-label="Search folders and documents"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                            aria-label="Clear search"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                {isSearchActive ? (
                    <div className="space-y-4 py-2" role="region" aria-label="Search results">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search Results</h3>
                            {isSearchLoading && <LoaderCircle size={14} className="animate-spin text-brand-600" aria-label="Loading search results" />}
                        </div>

                        {searchError && (
                            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700" role="alert">{searchError}</p>
                        )}

                        {!isSearchLoading && searchMatchingFolders.length === 0 && searchMatchingDocuments.length === 0 && !searchError && (
                            <p className="px-2 py-4 text-center text-xs text-slate-400">No matching folders or documents found.</p>
                        )}

                        {searchMatchingFolders.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Folders</p>
                                <ul className="space-y-0.5">
                                    {searchMatchingFolders.map((folder) => (
                                        <li key={folder.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectFolder(folder.id);
                                                    setSearchTerm("");
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                                            >
                                                <Folder size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                                                <span className="truncate">{folder.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {searchMatchingDocuments.length > 0 && (
                            <div className="space-y-1">
                                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Documents</p>
                                <ul className="space-y-0.5">
                                    {searchMatchingDocuments.map((doc) => (
                                        <li key={doc._id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    selectDocument(doc);
                                                    setSearchTerm("");
                                                }}
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition"
                                            >
                                                <FileText size={14} className="shrink-0 text-brand-600" aria-hidden="true" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">{doc.title || "Untitled"}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{doc.folder || "General"}</p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                <button
                    type="button"
                    onClick={() => selectFolder(null)}
                    className={`mb-4 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition ${
                        !selectedFolderId ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    aria-current={!selectedFolderId ? "page" : undefined}
                >
                    <NotebookPen aria-hidden="true" size={16} />
                    All documents
                </button>
                <div className="mb-2 flex items-center justify-between px-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Folders &amp; files</h3>
                    <div className="relative" ref={sortMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowSortMenu((prev) => !prev)}
                            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${
                                showSortMenu
                                    ? "border-brand-300 bg-brand-50 text-brand-700 shadow-2xs"
                                    : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                            }`}
                            aria-label="Sort folders and documents"
                            aria-expanded={showSortMenu}
                            aria-haspopup="listbox"
                        >
                            <ArrowUpDown size={12} className={showSortMenu ? "text-brand-600" : "text-slate-400"} aria-hidden="true" />
                            <span>Sort</span>
                        </button>
                        {showSortMenu && (
                            <div
                                role="listbox"
                                aria-label="Sort options"
                                className="absolute right-0 top-full z-30 mt-1.5 w-36 rounded-lg border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5"
                            >
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Sort by
                                </div>
                                {SORT_OPTIONS.map((option) => {
                                    const isSelected = sortMode === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            onClick={() => {
                                                setSortMode(option.value);
                                                setShowSortMenu(false);
                                            }}
                                            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                                                isSelected
                                                    ? "bg-brand-50 font-semibold text-brand-700"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && (
                                                <Check size={13} className="shrink-0 text-brand-600" aria-hidden="true" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {isLoadingFolders && <p className="px-2 py-3 text-xs text-slate-400">Loading folders…</p>}
                {folderLoadError && <p className="px-2 py-3 text-xs text-red-700" role="alert">{folderLoadError}</p>}
                {explorerError && <p className="px-2 py-3 text-xs text-red-700" role="alert">{explorerError}</p>}
                {!isLoadingFolders && !folderLoadError && folderEntries.length === 0 && explorerDocuments.length === 0 && (
                    <p className="px-2 py-3 text-xs leading-5 text-slate-400">Create a folder or file to begin organizing your workspace.</p>
                )}
                <FolderTree
                    folders={folderEntries}
                    documents={explorerDocuments}
                    selectedFolderId={selectedFolderId}
                    selectedDocumentId={selectedDocumentId}
                    expandedFolderIds={expandedFolderIds}
                    sortMode={sortMode}
                    onSelect={selectFolder}
                    onSelectDocument={selectDocument}
                    onToggle={toggleFolderExpanded}
                    onDeleteDocument={handleDeleteDocument}
                    onDeleteFolder={handleDeleteFolder}
                    inlineCreate={inlineCreate}
                    onInlineCreateSubmit={handleInlineCreateSubmit}
                    onInlineCreateCancel={handleInlineCreateCancel}
                    onInlineCreateStart={handleInlineCreateStart}
                />
                {isLoadingExplorer && explorerDocuments.length === 0 && <p className="px-2 py-2 text-xs text-slate-400">Loading files…</p>}
                    </>
                )}
            </nav>
            <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-400">
                Your folders and documents are private to your account.
            </div>
        </div>
    );

    return (
        <div className="min-h-svh bg-[#F5F8FB] text-slate-900">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-2 px-1 py-3 sm:px-4 sm:py-4">
                    <div className="flex min-w-0 items-center gap-0 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setMobileSidebarOpen(true)}
                            className="cv-touch-target inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50 md:hidden"
                            aria-label="Open Memo folder sidebar"
                            aria-expanded={mobileSidebarOpen}
                            aria-controls="memo-mobile-sidebar"
                        >
                            <Menu aria-hidden="true" size={20} />
                        </button>
                        <BrandLockup />
                        <div className="ml-3 hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                                <NotebookPen aria-hidden="true" size={23} />
                            </span>
                            <div>
                                <h1 className="text-lg font-semibold text-slate-800">Memo</h1>
                                <p className="text-xs text-slate-500">Your personal workspace</p>
                            </div>
                        </div>
                    </div>
                    <nav aria-label="Memo actions" className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <Link to="/products" className="hidden min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 sm:inline-flex">
                            <ArrowLeft aria-hidden="true" size={16} /> Products
                        </Link>
                        <AccountMenu />
                    </nav>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 sm:hidden">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <NotebookPen aria-hidden="true" size={21} />
                        </span>
                        Memo workspace
                    </div>
                    <Link to="/products" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand-700 hover:bg-brand-50">
                        <ArrowLeft aria-hidden="true" size={15} /> Products
                    </Link>
                </div>
            </header>

            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Memo folder sidebar">
                    <button
                        type="button"
                        className="absolute inset-0 size-full cursor-default bg-slate-950/40"
                        onClick={() => setMobileSidebarOpen(false)}
                        aria-label="Close Memo folder sidebar"
                    />
                    <aside id="memo-mobile-sidebar" className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <BrandLockup />
                            <button
                                type="button"
                                className="cv-touch-target inline-flex size-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                                onClick={() => setMobileSidebarOpen(false)}
                                aria-label="Close folder sidebar"
                            >
                                <X aria-hidden="true" size={19} />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1">{sidebarContents}</div>
                    </aside>
                </div>
            )}

            <div className="mx-auto flex min-h-[calc(100svh-73px)] max-w-[1600px]">
                <aside aria-label="Folder sidebar" className="hidden w-60 shrink-0 border-r border-slate-200 bg-white md:block lg:w-64">
                    {sidebarContents}
                </aside>

                <main className="memo-workspace-main min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-5 lg:px-9">
                    <section className="memo-workspace-hero cv-short-landscape-compact relative isolate mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#17375F] via-[#214C70] to-[#267A83] px-4 py-4 text-white shadow-lg sm:mb-5 sm:px-6 sm:py-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)] lg:items-center lg:gap-8">
                        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
                        <div className="max-w-2xl">
                            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-50">
                                <Sparkles aria-hidden="true" size={13} /> YOUR PERSONAL KNOWLEDGE SPACE
                            </p>
                            <h2 className="mt-2 text-xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                                Think it. Save it. Find it again.
                            </h2>
                            <p className="memo-workspace-intro-copy mt-2 max-w-xl text-xs leading-5 text-blue-50 sm:text-sm sm:leading-6">
                                Capture ideas in documents today. Memo is growing into a calm workspace for writing, organizing, and drawing—one useful feature at a time.
                            </p>
                            <Button variant="secondary" size="sm" onClick={openDocumentForm} className="mt-3 rounded-lg">
                                <Plus aria-hidden="true" size={17} /> Start a document
                            </Button>
                        </div>
                        <aside aria-label="Memo workspace roadmap" className="memo-workspace-roadmap mt-3 grid grid-cols-3 gap-1.5 sm:gap-2 lg:mt-0 lg:grid-cols-1">
                            <div className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 p-2 text-center backdrop-blur-sm sm:flex-row sm:gap-3 sm:p-3 sm:text-left">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:size-9"><FileText aria-hidden="true" size={16} /></span>
                                <div className="min-w-0"><p className="text-[10px] font-semibold leading-tight sm:text-sm">Documents</p><p className="mt-0.5 hidden text-xs text-blue-100 sm:block">Available now</p></div>
                            </div>
                            <div className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 p-2 text-center backdrop-blur-sm sm:flex-row sm:gap-3 sm:p-3 sm:text-left">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:size-9"><Folder aria-hidden="true" size={16} /></span>
                                <div className="min-w-0"><p className="text-[10px] font-semibold leading-tight sm:text-sm">Folders</p><p className="mt-0.5 hidden text-xs text-blue-100 sm:block">Nested and private</p></div>
                            </div>
                            <div className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 p-2 text-center backdrop-blur-sm sm:flex-row sm:gap-3 sm:p-3 sm:text-left">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 sm:size-9"><NotebookPen aria-hidden="true" size={16} /></span>
                                <div className="min-w-0"><p className="text-[10px] font-semibold leading-tight sm:text-sm">Pen &amp; canvas</p><p className="mt-0.5 hidden text-xs text-blue-100 sm:block">Planned for later</p></div>
                            </div>
                        </aside>
                    </section>
                    <div className="memo-workspace-title mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0">
                            <nav aria-label="Breadcrumb" className="mb-1 max-w-full overflow-x-auto text-xs text-slate-500">
                                <ol className="flex min-w-max items-center gap-1">
                                    <li><button type="button" onClick={() => selectFolder(null)} className="rounded px-1 py-1 font-medium text-brand-700 hover:bg-brand-50">Memo</button></li>
                                    {breadcrumbFolders.map((folder, index) => (
                                        <li key={folder.id} className="flex items-center gap-1">
                                            <ChevronRight aria-hidden="true" size={13} />
                                            {index === breadcrumbFolders.length - 1 && !selectedDocument ? (
                                                <span aria-current="page" className="max-w-36 truncate px-1 py-1 font-medium text-slate-700">{folder.name}</span>
                                            ) : (
                                                <button type="button" onClick={() => selectFolder(folder.id)} className="max-w-36 truncate rounded px-1 py-1 hover:bg-brand-50 hover:text-brand-700">{folder.name}</button>
                                            )}
                                        </li>
                                    ))}
                                    {selectedDocument ? (
                                        <li className="flex min-w-0 items-center gap-1">
                                            <ChevronRight aria-hidden="true" size={13} />
                                            <span aria-current="page" className="max-w-40 truncate px-1 py-1 font-medium text-slate-700">{selectedDocument.title}</span>
                                        </li>
                                    ) : breadcrumbFolders.length === 0 ? (
                                        <li className="flex items-center gap-1"><ChevronRight aria-hidden="true" size={13} /><span aria-current="page" className="px-1 py-1">All documents</span></li>
                                    ) : null}
                                </ol>
                            </nav>
                            <h2 className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                {selectedDocument?.title || activeFolder?.name || "Your documents"}
                            </h2>
                        </div>
                    </div>

                    {(showFolderForm || showDocumentForm) && (
                        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="memo-create-heading">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 id="memo-create-heading" className="font-semibold text-slate-900">
                                        {showFolderForm ? "Create a folder" : "Create a document"}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {showFolderForm
                                            ? activeFolder && !activeFolder.isLegacy ? `Inside ${activeFolder.name}` : "At the top level of your workspace"
                                            : activeFolder ? `In ${activeFolder.name}` : "In your general workspace"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setShowFolderForm(false); setShowDocumentForm(false); }}
                                    className="cv-touch-target inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                                    aria-label="Close create form"
                                >
                                    <X aria-hidden="true" size={17} />
                                </button>
                            </div>

                            {showFolderForm ? (
                                <form onSubmit={handleCreateFolder} className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <label className="sr-only" htmlFor="memo-folder-name">Folder name</label>
                                    <input
                                        id="memo-folder-name"
                                        value={folderName}
                                        onChange={(event) => { setFolderName(event.target.value); setFolderCreateError(""); }}
                                        maxLength={50}
                                        placeholder="e.g. Interview preparation"
                                        className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        aria-describedby={folderCreateError ? "memo-folder-error" : undefined}
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={isCreatingFolder} className="rounded-lg">
                                        {isCreatingFolder ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <FolderPlus aria-hidden="true" size={17} />}
                                        {isCreatingFolder ? "Creating…" : "Create folder"}
                                    </Button>
                                    {folderCreateError && <p id="memo-folder-error" role="alert" className="text-sm text-red-700 sm:basis-full">{folderCreateError}</p>}
                                </form>
                            ) : (
                                <form onSubmit={handleCreateDocument} className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <label className="sr-only" htmlFor="memo-document-title">Document title</label>
                                    <input
                                        id="memo-document-title"
                                        name="title"
                                        value={title}
                                        onChange={(event) => { setTitle(event.target.value); setCreateError(""); }}
                                        maxLength={200}
                                        placeholder="Give your document a title"
                                        className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        aria-describedby={createError ? "memo-create-error" : undefined}
                                        autoFocus
                                    />
                                    <Button type="submit" disabled={isCreating} className="rounded-lg disabled:cursor-wait">
                                        {isCreating ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Plus aria-hidden="true" size={17} />}
                                        {isCreating ? "Creating…" : "New document"}
                                    </Button>
                                    {createError && <p id="memo-create-error" role="alert" className="text-sm text-red-700 sm:basis-full">{createError}</p>}
                                </form>
                            )}
                        </section>
                    )}

                    {selectedDocument ? (
                        <div className="mx-auto flex min-h-[calc(100svh-73px)] max-w-[1600px] flex-row">
                            <main className="min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-5 lg:px-9">
                                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedDocumentId(null)} className="h-8 w-8 rounded-lg !p-0 text-slate-500 hover:text-slate-700" aria-label="Back to folder">
                                                <ArrowLeft size={18} />
                                            </Button>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{selectedDocument.title}</h3>
                                                <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{selectedDocument.folder || activeFolder?.name || "General"}</p>
                                            </div>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteDocument(selectedDocument._id); }} className="text-red-700 hover:bg-red-50">
                                            <Trash2 size={16} className="mr-1.5" /> Delete
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                        <h1 className="mb-6 text-3xl font-bold text-slate-900">{selectedDocument.title}</h1>
                                        <textarea
                                            className="min-h-[60vh] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                            defaultValue={selectedDocument.content || ""}
                                            onChange={(e) => {
                                                // Placeholder: in production this updates server/content state
                                                // Here we provide editable surface as requested
                                            }}
                                        />
                                    </div>
                                </div>
                                        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                                            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-brand-800">Back to top</button>
                                            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow">Page 1 / 1</span>
                                        </div>
                            </main>
                            <aside aria-label="Memo right sidebar" className="hidden w-64 shrink-0 border-l border-slate-200 bg-white lg:block xl:w-72">
                                <div className="flex h-full flex-col">
                                    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
                                        <BrandLockup />
                                        <h2 className="text-sm font-bold text-brand-800">Memo Editor</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-3 py-3">
                                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sections</div>
                                        <div className="flex flex-col gap-2">
                                            <button type="button" onClick={() => {}} className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"><Folder size={16} /> File Explorer</button>
                                            <button type="button" onClick={() => {}} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"><FileText size={16} /> Text Editor</button>
                                            <button type="button" onClick={() => {}} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"><NotebookPen size={16} /> Drawing</button>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">{activeFolder ? `Contents of ${activeFolder.name}` : "Workspace root"}</h3>
                                    <p className="mt-0.5 text-sm text-slate-500" aria-live="polite">
                                        {currentDirectFolders.length} {currentDirectFolders.length === 1 ? "folder" : "folders"}, {currentDirectDocuments.length} {currentDirectDocuments.length === 1 ? "document" : "documents"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!isLoadingExplorer && (
                                        <Button variant="quiet" size="sm" onClick={refreshExplorer} className="rounded-lg">
                                            <RefreshCw aria-hidden="true" size={15} /> Refresh
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {isLoadingExplorer && currentDirectFolders.length === 0 && currentDirectDocuments.length === 0 && (
                                <div role="status" aria-label="Loading Memo documents" aria-busy="true" className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    <span className="sr-only">Loading Memo documents…</span>
                                    {[0, 1, 2].map((card) => (
                                        <div key={card} aria-hidden="true" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                                            <div className="h-24 w-full animate-pulse rounded-xl bg-slate-100" />
                                            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {explorerError && (
                                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
                                    <p className="text-sm font-medium text-red-800">Could not load workspace items</p>
                                    <p className="mt-1 text-sm text-red-700">{explorerError}</p>
                                    <Button type="button" onClick={refreshExplorer} className="mt-3 rounded-lg">Try again</Button>
                                </div>
                            )}

                            {currentDirectFolders.length === 0 && currentDirectDocuments.length === 0 && !isLoadingExplorer && (
                                <div className="memo-workspace-empty-grid grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                    <button
                                        type="button"
                                        onClick={() => handleInlineCreateStart("folder", selectedFolderId)}
                                        className="memo-workspace-empty-card group flex min-h-24 flex-row items-center justify-start gap-3 rounded-2xl border border-dashed border-brand-300 bg-white p-3 text-left shadow-sm transition hover:border-brand-600 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:min-h-32 sm:flex-col sm:justify-center sm:gap-2 sm:p-4 sm:text-center"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white sm:size-11">
                                            <FolderPlus aria-hidden="true" size={20} />
                                        </span>
                                        <span className="min-w-0"><span className="block font-semibold text-slate-800">Create a subfolder</span><span className="mt-0.5 block text-xs text-slate-500 sm:text-sm">Build a tree for your notes.</span></span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleInlineCreateStart("file", selectedFolderId)}
                                        className="memo-workspace-empty-card group flex min-h-24 flex-row items-center justify-start gap-3 rounded-2xl border border-dashed border-brand-300 bg-white p-3 text-left shadow-sm transition hover:border-brand-600 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:min-h-32 sm:flex-col sm:justify-center sm:gap-2 sm:p-4 sm:text-center"
                                    >
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white sm:size-11">
                                            <FilePlus2 aria-hidden="true" size={20} />
                                        </span>
                                        <span className="min-w-0"><span className="block font-semibold text-slate-800">Create a document</span><span className="mt-0.5 block text-xs text-slate-500 sm:text-sm">Start writing right here.</span></span>
                                    </button>
                                </div>
                            )}

                            {(currentDirectFolders.length > 0 || currentDirectDocuments.length > 0) && (
                                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {currentDirectFolders.map((folder) => (
                                        <li key={folder.id} className="folder-card-container group">
                                            <div className="folder-tab" aria-hidden="true" />
                                            <div className="folder-paper-sheet sheet-1" aria-hidden="true">
                                                <div className="sheet-line w-full" />
                                                <div className="sheet-line w-2/3" />
                                            </div>
                                            <div className="folder-paper-sheet sheet-2" aria-hidden="true">
                                                <div className="sheet-line w-full" />
                                                <div className="sheet-line w-3/4" />
                                            </div>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => selectFolder(folder.id)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectFolder(folder.id); }}
                                                className="relative folder-shape flex h-full min-h-44 flex-col justify-between rounded-2xl rounded-tl-none p-4 pt-6 transition hover:shadow-lg sm:p-5 sm:pt-7 cursor-pointer text-white"
                                            >
                                                <div className="flex items-start justify-between gap-3 relative z-10">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white border border-white/30 shadow-xs backdrop-blur-xs">
                                                        <Folder aria-hidden="true" size={20} />
                                                    </span>
                                                    {!folder.isLegacy && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                                            className="rounded-lg p-1.5 text-teal-100/80 opacity-70 transition hover:bg-white/20 hover:text-white group-hover:opacity-100 shrink-0"
                                                            aria-label={`Delete folder ${folder.name}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mt-4 relative z-10">
                                                    <h4 className="truncate font-bold text-white drop-shadow-xs">{folder.name}</h4>
                                                    <p className="mt-0.5 text-xs font-semibold text-teal-100/90">Folder</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    {currentDirectDocuments.map((document) => (
                                        <li key={document._id} className="document-card-container">
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => selectDocument(document)}
                                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectDocument(document); }}
                                                className="group relative document-shape flex h-full min-h-52 flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-1 hover:shadow-lg sm:p-5 cursor-pointer text-slate-800"
                                            >
                                                <div className="flex items-start justify-between gap-3 relative z-10">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700 border border-slate-300/80 shadow-xs">
                                                            <FileText aria-hidden="true" size={19} />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <h4 className="truncate font-semibold text-slate-900" title={document.title}>{document.title}</h4>
                                                            <p className="mt-1 text-xs font-medium text-slate-500">{document.folder || activeFolder?.name || "General"}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(document._id); }}
                                                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 shrink-0"
                                                        aria-label={`Delete document ${document.title}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <p className="mt-4 line-clamp-3 min-h-[3.75rem] flex-1 whitespace-pre-wrap text-sm leading-5 text-slate-600 relative z-10">
                                                    {document.content || "No content yet. Click to start writing."}
                                                </p>
                                                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs text-slate-500 relative z-10">
                                                    <span>Created <time dateTime={document.createdAt || undefined}>{formatCreatedAt(document.createdAt)}</time></span>
                                                    <span className="flex items-center gap-1 font-semibold text-brand-600 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
                                                        Read note <ArrowRight size={13} />
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Permanent Delete Confirmation Modal */}
            {folderToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h3 id="delete-modal-title" className="text-lg font-semibold text-slate-900">Permanently delete folder?</h3>
                                <p className="text-sm text-slate-500">"{folderToDelete.name}" is not empty. Deleting it will permanently remove all nested subfolders and documents inside it.</p>
                            </div>
                        </div>

                        {deleteFolderError && (
                            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                                {deleteFolderError}
                            </div>
                        )}

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFolderToDelete(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleDeleteFolder(folderToDelete.id, true)}
                                isLoading={isDeletingFolder}
                            >
                                Permanently Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemoWorkspace;
