interface Props {
  content: string
  x: number
  y: number
}

export default function AnnotationPreview({ content, x, y }: Props) {
  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-sm text-sm text-gray-700 pointer-events-none"
      style={{ top: y + 8, left: x }}
    >
      {content}
    </div>
  )
}
