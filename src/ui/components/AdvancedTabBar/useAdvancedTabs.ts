// ============================================
// useAdvancedTabs Hook - Advanced Tab State Management
// ============================================

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TabItem, AnimationConfig, GradientConfig, A11yConfig, DEFAULT_ANIMATION_CONFIG, DEFAULT_LIGHT_GRADIENT, DEFAULT_DARK_GRADIENT, DEFAULT_A11Y_CONFIG } from './types';

// ============================================
// Internal State Interfaces
// ============================================

interface TabRefs {
    [key: string]: HTMLButtonElement | null;
}

interface IndicatorPosition {
    x: number;
    width: number;
    opacity: number;
}

interface DragState {
    isDragging: boolean;
    draggedTabId: string | null;
    dropTargetId: string | null;
    originalIndex: number;
    dragOffset: { x: number; y: number };
}

interface KeyboardState {
    focusedIndex: number;
    isTabbing: boolean;
}

// ============================================
// Hook Props Interface
// ============================================

interface UseAdvancedTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onTabsReorder?: ((tabs: TabItem[]) => void) | undefined;
    animation?: Partial<AnimationConfig>;
    gradient?: Partial<GradientConfig>;
    a11y?: Partial<A11yConfig>;
    enableDragDrop?: boolean;
    enableKeyboardNav?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'sm' | 'md' | 'lg';
    enable3D?: boolean;
}

// ============================================
// Return Type
// ============================================

interface UseAdvancedTabsReturn {
    // State
    tabs: TabItem[];
    activeTabId: string;
    focusedTabId: string | null;
    dragState: DragState;
    indicatorPosition: IndicatorPosition;

    // Refs
    tabRefs: React.MutableRefObject<TabRefs>;
    containerRef: React.RefObject<HTMLDivElement | null>;

    // Handlers
    handleTabClick: (tabId: string) => void;
    handleTabMouseEnter: (tabId: string) => void;
    handleTabMouseLeave: () => void;
    handleTabFocus: (tabId: string) => void;
    handleTabBlur: () => void;
    handleKeyDown: (event: React.KeyboardEvent) => void;

    // Drag & Drop Handlers
    handleDragStart: (event: React.DragEvent, tabId: string) => void;
    handleDragEnd: (event: React.DragEvent) => void;
    handleDragOver: (event: React.DragEvent, tabId: string) => void;
    handleDragLeave: (event: React.DragEvent) => void;
    handleDrop: (event: React.DragEvent, targetTabId: string) => void;

    // Setters
    setTabRef: (tabId: string) => (el: HTMLButtonElement | null) => void;

    // Config
    animationConfig: AnimationConfig;
    gradientConfig: GradientConfig;
    a11yConfig: A11yConfig;

    // ARIA
    getTabAttributes: (tabId: string, index: number) => {
        role: 'tab';
        'aria-selected': boolean;
        'aria-disabled': boolean | undefined;
        'aria-controls': string;
        'aria-label': string | undefined;
        tabIndex: number;
    };
}

// ============================================
// Utility Functions
// ============================================

const useSystemTheme = (): 'light' | 'dark' => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light');

        const handler = (e: MediaQueryListEvent) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return theme;
};

const isRTL = (): boolean => {
    return document.documentElement.dir === 'rtl' ||
        document.documentElement.getAttribute('dir') === 'rtl';
};

const announceToScreenReader = (message: string): void => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
    announcer.textContent = message;
    document.body.appendChild(announcer);

    setTimeout(() => {
        document.body.removeChild(announcer);
    }, 1000);
};

// ============================================
// Main Hook
// ============================================

export const useAdvancedTabs = ({
    tabs: initialTabs,
    activeTab,
    onTabChange,
    onTabsReorder,
    animation = {},
    gradient = {},
    a11y = {},
    enableDragDrop = false,
    enableKeyboardNav = true,
    theme = 'auto',
}: UseAdvancedTabsProps): UseAdvancedTabsReturn => {
    // ============================================
    // State
    // ============================================

    const [tabs, setTabs] = useState<TabItem[]>(initialTabs);
    const [focusedTabId, setFocusedTabId] = useState<string | null>(null);
    const [indicatorPosition, setIndicatorPosition] = useState<IndicatorPosition>({
        x: 0,
        width: 0,
        opacity: 0,
    });
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedTabId: null,
        dropTargetId: null,
        originalIndex: -1,
        dragOffset: { x: 0, y: 0 },
    });
    const [keyboardState, setKeyboardState] = useState<KeyboardState>({
        focusedIndex: -1,
        isTabbing: false,
    });

    // ============================================
    // Refs
    // ============================================

    const tabRefs = useRef<TabRefs>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const animationFrameId = useRef<number | null>(null);

    // ============================================
    // Config
    // ============================================

    const systemTheme = useSystemTheme();
    const currentTheme = theme === 'auto' ? systemTheme : theme;

    const animationConfig = useMemo(() => ({
        ...DEFAULT_ANIMATION_CONFIG,
        ...animation,
    }), [animation]);

    const gradientConfig = useMemo(() => ({
        ...(currentTheme === 'dark' ? DEFAULT_DARK_GRADIENT : DEFAULT_LIGHT_GRADIENT),
        ...gradient,
    }), [currentTheme, gradient]);

    const a11yConfig = useMemo(() => ({
        ...DEFAULT_A11Y_CONFIG,
        ...a11y,
    }), [a11y]);

    // ============================================
    // Indicator Position Update
    // ============================================

    const updateIndicatorPosition = useCallback((animate: boolean = true) => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        animationFrameId.current = requestAnimationFrame(() => {
            const activeTabRef = tabRefs.current[activeTab];
            const containerRefCurrent = containerRef.current;

            if (!activeTabRef || !containerRefCurrent) {
                setIndicatorPosition(prev => ({ ...prev, opacity: 0 }));
                return;
            }

            const containerRect = containerRefCurrent.getBoundingClientRect();
            const tabRect = activeTabRef.getBoundingClientRect();

            const rtl = isRTL();

            // Calculate position relative to container
            let x: number;
            if (rtl) {
                x = containerRect.right - tabRect.right;
            } else {
                x = tabRect.left - containerRect.left;
            }

            // Account for container padding
            const containerStyle = window.getComputedStyle(containerRefCurrent);
            const paddingLeft = parseFloat(containerStyle.paddingLeft);
            const paddingRight = parseFloat(containerStyle.paddingRight);

            if (rtl) {
                x -= paddingRight;
            } else {
                x -= paddingLeft;
            }

            setIndicatorPosition({
                x,
                width: tabRect.width,
                opacity: animate ? 1 : 0,
            });
        });
    }, [activeTab]);

    // Update indicator when active tab changes
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // Initial position without animation
            setTimeout(() => updateIndicatorPosition(false), 0);
            setTimeout(() => setIndicatorPosition(prev => ({ ...prev, opacity: 1 })), 50);
        } else {
            updateIndicatorPosition(true);
        }
    }, [activeTab, updateIndicatorPosition]);

    // Update indicator on resize with ResizeObserver for better performance
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = requestAnimationFrame(() => updateIndicatorPosition(false));
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [updateIndicatorPosition]);

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    // ============================================
    // Tab Click Handler
    // ============================================

    const handleTabClick = useCallback((tabId: string) => {
        if (tabId === activeTab) return;

        const tab = tabs.find(t => t.id === tabId);
        if (tab?.disabled) return;

        onTabChange(tabId);

        if (a11yConfig.announceChanges && a11yConfig.announcementFormatter) {
            const label = tab?.label || tabId;
            announceToScreenReader(a11yConfig.announcementFormatter(label));
        }
    }, [activeTab, tabs, onTabChange, a11yConfig]);

    // ============================================
    // Mouse Event Handlers
    // ============================================

    const handleTabMouseEnter = useCallback((_tabId: string) => {
        // Optional: Add hover effect logic here
    }, []);

    const handleTabMouseLeave = useCallback(() => {
        // Optional: Remove hover effect logic here
    }, []);

    // ============================================
    // Focus Event Handlers
    // ============================================

    const handleTabFocus = useCallback((tabId: string) => {
        setFocusedTabId(tabId);
        const index = tabs.findIndex(t => t.id === tabId);
        setKeyboardState(prev => ({ ...prev, focusedIndex: index }));
    }, [tabs]);

    const handleTabBlur = useCallback(() => {
        setFocusedTabId(null);
    }, []);

    // ============================================
    // Keyboard Navigation
    // ============================================

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (!enableKeyboardNav) return;

        const { key } = event;
        const rtl = isRTL();
        const currentIndex = tabs.findIndex(t => t.id === activeTab);
        let newIndex = currentIndex;

        const enabledTabs = tabs.filter(t => !t.disabled);
        const enabledIndex = enabledTabs.findIndex(t => t.id === activeTab);

        switch (key) {
            case 'ArrowLeft':
                event.preventDefault();
                if (rtl) {
                    // In RTL, left goes to next
                    newIndex = (enabledIndex + 1) % enabledTabs.length;
                } else {
                    // In LTR, left goes to previous
                    newIndex = (enabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
                }
                break;

            case 'ArrowRight':
                event.preventDefault();
                if (rtl) {
                    // In RTL, right goes to previous
                    newIndex = (enabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
                } else {
                    // In LTR, right goes to next
                    newIndex = (enabledIndex + 1) % enabledTabs.length;
                }
                break;

            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;

            case 'End':
                event.preventDefault();
                newIndex = enabledTabs.length - 1;
                break;

            case 'Enter':
            case ' ':
                event.preventDefault();
                handleTabClick(activeTab);
                return;

            default:
                // Typeahead search
                if (key.length === 1 && /[a-zA-Z0-9\u0600-\u06FF]/.test(key)) {
                    const searchChar = key.toLowerCase();
                    const matchingTab = enabledTabs.find((tab, idx) => {
                        if (idx <= enabledIndex) return false;
                        return tab.label.toLowerCase().startsWith(searchChar);
                    }) || enabledTabs.find(tab =>
                        tab.label.toLowerCase().startsWith(searchChar)
                    );

                    if (matchingTab) {
                        const matchIndex = tabs.findIndex(t => t.id === matchingTab.id);
                        newIndex = matchIndex;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
        }

        const targetTab = enabledTabs[newIndex];
        if (targetTab && targetTab.id !== activeTab) {
            handleTabClick(targetTab.id);

            // Focus the new tab
            setTimeout(() => {
                tabRefs.current[targetTab.id]?.focus();
            }, 0);
        }
    }, [activeTab, tabs, enableKeyboardNav, handleTabClick]);

    // ============================================
    // Drag & Drop Handlers
    // ============================================

    const handleDragStart = useCallback((event: React.DragEvent, tabId: string) => {
        if (!enableDragDrop) return;

        const index = tabs.findIndex(t => t.id === tabId);

        setDragState({
            isDragging: true,
            draggedTabId: tabId,
            dropTargetId: null,
            originalIndex: index,
            dragOffset: { x: 0, y: 0 },
        });

        // Set drag image
        const draggedElement = tabRefs.current[tabId];
        if (draggedElement) {
            const rect = draggedElement.getBoundingClientRect();
            event.dataTransfer.setDragImage(draggedElement, rect.width / 2, rect.height / 2);
        }

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', tabId);
    }, [enableDragDrop, tabs]);

    const handleDragEnd = useCallback((_event: React.DragEvent) => {
        if (!enableDragDrop) return;

        setDragState({
            isDragging: false,
            draggedTabId: null,
            dropTargetId: null,
            originalIndex: -1,
            dragOffset: { x: 0, y: 0 },
        });
    }, [enableDragDrop]);

    const handleDragOver = useCallback((event: React.DragEvent, tabId: string) => {
        if (!enableDragDrop || !dragState.isDragging) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        if (tabId !== dragState.draggedTabId && tabId !== dragState.dropTargetId) {
            setDragState(prev => ({ ...prev, dropTargetId: tabId }));
        }
    }, [enableDragDrop, dragState.isDragging, dragState.draggedTabId, dragState.dropTargetId]);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        if (!enableDragDrop) return;

        // Check if we're actually leaving the tab (not just entering a child)
        const relatedTarget = event.relatedTarget as HTMLElement;
        const currentTarget = event.currentTarget as HTMLElement;

        if (!currentTarget.contains(relatedTarget)) {
            setDragState(prev => ({ ...prev, dropTargetId: null }));
        }
    }, [enableDragDrop]);

    const handleDrop = useCallback((event: React.DragEvent, targetTabId: string) => {
        if (!enableDragDrop || !dragState.isDragging || !dragState.draggedTabId) return;

        event.preventDefault();

        const draggedId = dragState.draggedTabId;

        if (draggedId !== targetTabId) {
            const newTabs = [...tabs];
            const draggedIndex = newTabs.findIndex(t => t.id === draggedId);
            const targetIndex = newTabs.findIndex(t => t.id === targetTabId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [removed] = newTabs.splice(draggedIndex, 1);
                newTabs.splice(targetIndex, 0, removed);

                setTabs(newTabs);
                onTabsReorder?.(newTabs);

                // Announce reorder
                if (a11yConfig.announceChanges) {
                    announceToScreenReader(`Tab moved to position ${targetIndex + 1}`);
                }
            }
        }

        setDragState({
            isDragging: false,
            draggedTabId: null,
            dropTargetId: null,
            originalIndex: -1,
            dragOffset: { x: 0, y: 0 },
        });
    }, [enableDragDrop, dragState.isDragging, dragState.draggedTabId, tabs, onTabsReorder, a11yConfig]);

    // ============================================
    // Ref Setter
    // ============================================

    const setTabRef = useCallback((tabId: string) => {
        return (el: HTMLButtonElement | null) => {
            tabRefs.current[tabId] = el;
        };
    }, []);

    // ============================================
    // ARIA Attributes Generator
    // ============================================

    const getTabAttributes = useCallback((tabId: string, _index: number) => {
        const tab = tabs.find(t => t.id === tabId);
        const isActive = tabId === activeTab;
        const isFocused = tabId === focusedTabId;

        return {
            role: 'tab' as const,
            'aria-selected': isActive,
            'aria-disabled': tab?.disabled,
            'aria-controls': `tabpanel-${tabId}`,
            'aria-label': tab?.tooltip,
            tabIndex: isActive || (isFocused && keyboardState.isTabbing) ? 0 : -1,
        };
    }, [tabs, activeTab, focusedTabId, keyboardState.isTabbing]);

    // ============================================
    // Sync tabs prop with internal state
    // ============================================

    useEffect(() => {
        setTabs(initialTabs);
    }, [initialTabs]);

    // ============================================
    // Return
    // ============================================

    return {
        tabs,
        activeTabId: activeTab,
        focusedTabId,
        dragState,
        indicatorPosition,
        tabRefs,
        containerRef,
        handleTabClick,
        handleTabMouseEnter,
        handleTabMouseLeave,
        handleTabFocus,
        handleTabBlur,
        handleKeyDown,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        setTabRef,
        animationConfig,
        gradientConfig,
        a11yConfig,
        getTabAttributes,
    };
};

export default useAdvancedTabs;
