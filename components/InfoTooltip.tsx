'use client'

import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface Props {
  content: string
}

export default function InfoTooltip({ content }: Props) {
  return (
    <div className="group relative inline-block ml-2">
      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-help" />
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-gray-900 text-white text-xs rounded-md shadow-lg z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2 border-[6px] border-transparent border-t-gray-900" />
      </div>
    </div>
  )
}