
import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { IconClose } from './Icons';
import { useLocalization } from '../hooks/useLocalization';

interface TutorialStep {
    targetId: string;
    title: string;
    content: string;
    isModal?: boolean;
    isFinal?: boolean;
}

const getSteps = (t: (key: string) => string): TutorialStep[] => [
    {
        targetId: 'root',
        title: t('tutorial.step1.title'),
        content: t('tutorial.step1.content'),
        isModal: true,
    },
    {
        targetId: 'main-menu-button',
        title: t('tutorial.step2.title'),
        content: t('tutorial.step2.content'),
    },
    {
        targetId: 'note-list-container',
        title: t('tutorial.step3.title'),
        content: t('tutorial.step3.content'),
    },
    {
        targetId: 'note-editor',
        title: t('tutorial.step4.title'),
        content: t('tutorial.step4.content'),
    },
    {
        targetId: 'app-logo',
        title: t('tutorial.step5.title'),
        content: t('tutorial.step5.content'),
    },
    {
        targetId: 'note-editor-insights',
        title: t('tutorial.step6.title'),
        content: t('tutorial.step6.content'),
    },
    {
        targetId: 'quick-actions-button',
        title: t('tutorial.step7.title'),
        content: t('tutorial.step7.content'),
    },
    {
        targetId: 'chatbot-button',
        title: t('tutorial.step8.title'),
        content: t('tutorial.step8.content'),
    },
    {
        targetId: 'root',
        title: t('tutorial.step9.title'),
        content: t('tutorial.step9.content'),
        isFinal: true,
    },
];

const calculateTooltipPosition = (targetRect: DOMRect, isModal: boolean, isFinal: boolean, tooltipEl: HTMLDivElement | null) => {
    const tooltipWidth = 320;
    const PADDING = 16; 

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 101,
        width: `${tooltipWidth}px`,
        maxWidth: `calc(100vw - ${PADDING * 2}px)`,
        left: '50%',
        transform: 'translateX(-50%)',
        transition: 'top 300ms ease-in-out, opacity 150ms ease-in-out',
        opacity: 0,
    };
    const arrowStyle: React.CSSProperties = {
        position: 'absolute',
        width: 0,
        height: 0,
        transition: 'left 300ms ease-in-out',
        display: 'none',
    };

    if (isModal || isFinal || !tooltipEl) {
        tooltipStyle.top = '50%';
        tooltipStyle.transform = 'translate(-50%, -50%)'; // Override transform for full centering
        tooltipStyle.opacity = 1;
        return { tooltipStyle, arrowStyle };
    }

    arrowStyle.display = 'block';
    const tooltipHeight = tooltipEl.offsetHeight;

    // --- Vertical Positioning ---
    let top;
    let isBelow = true;
    
    // Prefer to place below target if there is enough space
    if (targetRect.bottom + PADDING + tooltipHeight < window.innerHeight) {
        top = targetRect.bottom + PADDING;
        isBelow = true;
    } 
    // Otherwise, try to place above
    else if (targetRect.top - PADDING - tooltipHeight > 0) {
        top = targetRect.top - tooltipHeight - PADDING;
        isBelow = false;
    }
    // If it doesn't fit either way, vertically center and clamp.
    else {
        top = window.innerHeight / 2 - tooltipHeight / 2;
        isBelow = top > targetRect.top;
    }
    
    // Final clamp to ensure it's always visible within the viewport.
    tooltipStyle.top = `${Math.max(PADDING, Math.min(top, window.innerHeight - tooltipHeight - PADDING))}px`;
    tooltipStyle.opacity = 1;


    // --- Arrow Positioning ---
    if (isBelow) {
        arrowStyle.bottom = '100%';
        arrowStyle.borderLeft = '12px solid transparent';
        arrowStyle.borderRight = '12px solid transparent';
        arrowStyle.borderBottom = `12px solid var(--color-secondary)`;
    } else {
        arrowStyle.top = '100%';
        arrowStyle.borderLeft = '12px solid transparent';
        arrowStyle.borderRight = '12px solid transparent';
        arrowStyle.borderTop = `12px solid var(--color-secondary)`;
    }

    // Since the tooltip is centered on screen, calculate the arrow's horizontal position relative to the tooltip.
    const screenCenterX = window.innerWidth / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const tooltipLeftEdgeInScreen = screenCenterX - (tooltipWidth / 2);

    let arrowLeft = targetCenterX - tooltipLeftEdgeInScreen;

    arrowStyle.left = `${arrowLeft}px`;
    arrowStyle.transform = 'translateX(-50%)';
    // Clamp arrow position to prevent it from going off the tooltip
    arrowStyle.left = `${Math.max(12, Math.min(parseFloat(arrowStyle.left), tooltipWidth - 12))}px`;
    
    return { tooltipStyle, arrowStyle };
};

const InteractiveTutorial: React.FC<{ isOpen: boolean; onComplete: () => void; }> = ({ isOpen, onComplete }) => {
    const { t } = useLocalization();
    const [stepIndex, setStepIndex] = useState(0);
    const [styles, setStyles] = useState<{ tooltipStyle: React.CSSProperties, arrowStyle: React.CSSProperties, targetRect: DOMRect | null }>({
        tooltipStyle: { opacity: 0, position: 'fixed' },
        arrowStyle: {},
        targetRect: null,
    });
    const tooltipRef = useRef<HTMLDivElement>(null);
    
    const steps = useMemo(() => getSteps(t), [t]);
    const currentStep = steps[stepIndex];

    useLayoutEffect(() => {
        if (!isOpen || !currentStep) return;

        const updatePosition = () => {
             // RAF ensures we run this after browser paint to get correct dimensions.
            requestAnimationFrame(() => {
                const element = document.getElementById(currentStep.targetId);
                const tooltipEl = tooltipRef.current;
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const { tooltipStyle, arrowStyle } = calculateTooltipPosition(rect, !!currentStep.isModal, !!currentStep.isFinal, tooltipEl);
                    setStyles({ tooltipStyle, arrowStyle, targetRect: rect });
                } else {
                    console.warn(`Tutorial target not found: #${currentStep.targetId}`);
                    if (stepIndex < steps.length - 1) {
                       setStepIndex(s => s + 1);
                    } else {
                       onComplete();
                    }
                }
            });
        };
        
        // A small timeout allows the component to render with the new step's content,
        // so we can measure its height accurately before positioning.
        const timerId = setTimeout(updatePosition, 50);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        
        return () => {
            clearTimeout(timerId);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };

    }, [isOpen, stepIndex, onComplete, steps]);

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            // Fade out before changing step
            setStyles(s => ({ ...s, tooltipStyle: { ...s.tooltipStyle, opacity: 0 }}));
            setTimeout(() => setStepIndex(stepIndex + 1), 150);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (stepIndex > 0) {
            // Fade out before changing step
            setStyles(s => ({ ...s, tooltipStyle: { ...s.tooltipStyle, opacity: 0 }}));
            setTimeout(() => setStepIndex(stepIndex - 1), 150);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[100]">
             <div 
                className="absolute inset-0 bg-black/70"
                style={{
                    clipPath: !styles.targetRect || currentStep.isFinal || currentStep.isModal ? 'none' : `path(evenodd, 'M0 0 H ${window.innerWidth} V ${window.innerHeight} H 0 Z M ${styles.targetRect.x - 5} ${styles.targetRect.y - 5} H ${styles.targetRect.right + 5} V ${styles.targetRect.bottom + 5} H ${styles.targetRect.x - 5} Z')`,
                    transition: 'clip-path 0.4s ease-in-out'
                }}
                onClick={handleNext}
             ></div>
            
            <div 
                ref={tooltipRef}
                className="bg-secondary text-light p-4 rounded-lg shadow-2xl max-w-xs w-full"
                style={styles.tooltipStyle}
                role="tooltip"
            >
                <div style={styles.arrowStyle}></div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-highlight">{currentStep.title}</h3>
                    <button onClick={onComplete} className="p-1 -mr-2 -mt-1 rounded-full hover:bg-tertiary">
                      <IconClose className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-light/90 mb-4 whitespace-pre-wrap">{currentStep.content}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-subtle">{stepIndex + 1} / {steps.length}</span>
                    <div>
                        {stepIndex > 0 && (
                            <button onClick={handlePrev} className="text-sm px-3 py-1 rounded-md hover:bg-tertiary">
                                {t('tutorial.buttons.prev')}
                            </button>
                        )}
                        <button onClick={handleNext} className="text-sm font-semibold px-4 py-1.5 rounded-md bg-accent hover:bg-highlight ml-2">
                            {stepIndex === steps.length - 1 ? t('tutorial.buttons.finish') : t('tutorial.buttons.next')}
                        </button>
                    </div>
                </div>
            </div>
            <style>
            {`
              :root {
                --color-secondary: #1F2937;
              }
            `}
            </style>
        </div>
    );
};

export default InteractiveTutorial;