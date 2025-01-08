'use client'

import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

interface Props {
  content: string
}

export default function InfoTooltip({ content }: Props) {
  return (
    <div className="group relative inline-block ml-2">
      <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-sm rounded shadow-lg">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2">
          <div className="border-8 border-transparent border-t-gray-900" />
        </div>
      </div>
    </div>
  )
}