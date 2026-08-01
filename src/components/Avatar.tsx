interface AvatarProps {
  url?: string | null
  initials?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-14 w-14 text-xl md:h-16 md:w-16',
}

export function Avatar({ url, initials = 'Rh', size = 'md', className = '' }: AvatarProps) {
  const label = (initials || 'Rh').slice(0, 2)
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#1F2937] bg-white font-bold text-[#1F2937] shadow-[3px_3px_0_#1F2937] ${sizes[size]} ${className}`}
    >
      {url ? (
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span>{label}</span>
      )}
    </div>
  )
}
