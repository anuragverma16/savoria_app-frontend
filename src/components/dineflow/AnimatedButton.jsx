import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { gsapPress } from '../../utils/gsapPress'

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    })
  }
}

const Interactive = forwardRef(function Interactive(
  { as: Component, children, className = '', onClick, disabled, ...props },
  ref,
) {
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    gsapPress(e.currentTarget)
    onClick?.(e)
  }

  return (
    <Component
      ref={ref}
      className={`df-btn-press relative z-20 pointer-events-auto inline-flex items-center justify-center no-underline ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Component>
  )
})

const AnimatedButton = forwardRef(function AnimatedButton(
  {
    children,
    className = '',
    onClick,
    href,
    to,
    type = 'button',
    disabled,
    ...props
  },
  ref,
) {
  if (to) {
    return (
      <Interactive
        as={Link}
        ref={mergeRefs(ref)}
        to={to}
        className={className}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </Interactive>
    )
  }

  if (href) {
    return (
      <Interactive
        as="a"
        ref={mergeRefs(ref)}
        href={href}
        className={className}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </Interactive>
    )
  }

  return (
    <Interactive
      as="button"
      ref={ref}
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Interactive>
  )
})

export default AnimatedButton
