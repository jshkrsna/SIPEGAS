import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'

/**
 * usePageTransition — GSAP entrance animation for page content.
 * Attach the returned `ref` to the top-level wrapper of your page/layout.
 *
 * Triggers on every route change (location.pathname).
 */
export function usePageTransition() {
    const ref = useRef(null)
    const location = useLocation()

    useEffect(() => {
        if (!ref.current) return

        // Kill any in-progress tween on this element first
        gsap.killTweensOf(ref.current)

        gsap.fromTo(
            ref.current,
            { opacity: 0, y: 16 },
            {
                opacity: 1,
                y: 0,
                duration: 0.38,
                ease: 'power2.out',
                clearProps: 'transform',
            }
        )
    }, [location.pathname])

    return ref
}

/**
 * animateNavHover — Attach GSAP hover micro-animation to a nav element.
 * Returns { onMouseEnter, onMouseLeave } props to spread on the element.
 */
export function useNavHover() {
    return {
        onMouseEnter: (e) => {
            gsap.to(e.currentTarget, {
                x: 4,
                duration: 0.18,
                ease: 'power1.out',
            })
        },
        onMouseLeave: (e) => {
            gsap.to(e.currentTarget, {
                x: 0,
                duration: 0.22,
                ease: 'power1.inOut',
            })
        },
    }
}
