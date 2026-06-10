import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'

/**
 * usePageTransition — GSAP wireframe entrance animation for page content.
 * Creates a minimal "lines drawing in" effect using clip-path + stagger.
 * Attach the returned `ref` to the top-level wrapper of your page/layout.
 */
export function usePageTransition() {
    const ref = useRef(null)
    const location = useLocation()

    useEffect(() => {
        if (!ref.current) return

        gsap.killTweensOf(ref.current)

        // Wireframe reveal: slide up from below with clip-path sweep
        gsap.fromTo(
            ref.current,
            {
                opacity: 0,
                y: 20,
                clipPath: 'inset(100% 0% 0% 0%)',
            },
            {
                opacity: 1,
                y: 0,
                clipPath: 'inset(0% 0% 0% 0%)',
                duration: 0.42,
                ease: 'power3.out',
                clearProps: 'clipPath,transform',
            }
        )

        // Stagger direct children for a wireframe "draw in" feel
        const children = ref.current.querySelectorAll(':scope > *')
        if (children.length > 0) {
            gsap.fromTo(
                children,
                { opacity: 0, y: 10 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.32,
                    ease: 'power2.out',
                    stagger: 0.045,
                    delay: 0.08,
                    clearProps: 'transform',
                }
            )
        }
    }, [location.pathname])

    return ref
}

/**
 * useNavHover — GSAP hover micro-animation for nav items.
 * Subtle x-slide with a wireframe underline pulse effect.
 */
export function useNavHover() {
    return {
        onMouseEnter: (e) => {
            gsap.to(e.currentTarget, {
                x: 5,
                duration: 0.16,
                ease: 'power2.out',
            })
        },
        onMouseLeave: (e) => {
            gsap.to(e.currentTarget, {
                x: 0,
                duration: 0.22,
                ease: 'power2.inOut',
            })
        },
    }
}

/**
 * animateTabSwitch — Call this when switching tabs within a page.
 * Pass the container ref and direction ('left' | 'right').
 */
export function animateTabSwitch(containerEl, direction = 'right') {
    if (!containerEl) return
    const fromX = direction === 'right' ? 24 : -24
    gsap.fromTo(
        containerEl,
        { opacity: 0, x: fromX },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform' }
    )
}
