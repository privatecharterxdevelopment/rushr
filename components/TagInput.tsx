'use client'

import React, { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  validate?: (tag: string) => string | null
}

export default function TagInput({
  value = [],
  onChange,
  placeholder = "Add tags...",
  className = "",
  validate
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = inputValue.trim()

      if (!newTag) {
        setError('Please enter a value')
        return
      }

      // Validate the tag if validation function is provided
      if (validate) {
        const validationError = validate(newTag)
        if (validationError) {
          setError(validationError)
          return
        }
      }

      if (value.includes(newTag)) {
        setError('This value is already added')
        return
      }

      onChange([...value, newTag])
      setInputValue('')
      setError('')
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove))
  }

  const borderClasses = error
    ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500'
    : 'border-gray-300'

  return (
    <div className={className}>
      <div className={`flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${borderClasses}`}>
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:text-blue-600 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}