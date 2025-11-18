'use client'

import React, { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  value?: string[]
  values?: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  validate?: (tag: string) => string | null
  allowComma?: boolean
  allowEnter?: boolean
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url'
}

export default function TagInput({
  value,
  values,
  onChange,
  placeholder = "Add tags...",
  className = "",
  validate,
  allowComma = true,
  allowEnter = true,
  inputMode = 'text'
}: TagInputProps) {
  const tags = values || value || []
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  console.log('[TagInput] Render - tags:', tags, 'allowEnter:', allowEnter, 'allowComma:', allowComma)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const shouldAddTag =
      (allowEnter && e.key === 'Enter') ||
      (allowComma && e.key === ',')

    console.log('[TagInput] Key pressed:', e.key, 'shouldAddTag:', shouldAddTag, 'inputValue:', inputValue)

    if (shouldAddTag) {
      e.preventDefault()
      e.stopPropagation()

      const newTag = inputValue.trim()
      console.log('[TagInput] Adding tag:', newTag)

      if (!newTag) {
        console.log('[TagInput] Empty tag, showing error')
        setError('Please enter a value')
        return
      }

      // Validate the tag if validation function is provided
      if (validate) {
        const validationError = validate(newTag)
        if (validationError) {
          console.log('[TagInput] Validation failed:', validationError)
          setError(validationError)
          return
        }
      }

      if (tags.includes(newTag)) {
        console.log('[TagInput] Duplicate tag')
        setError('This value is already added')
        return
      }

      console.log('[TagInput] Tag added successfully, calling onChange with:', [...tags, newTag])
      onChange([...tags, newTag])
      setInputValue('')
      setError('')
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      e.preventDefault()
      onChange(tags.slice(0, -1))
    }
  }

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove))
  }

  const borderClasses = error
    ? 'border-red-300 focus-within:ring-red-500 focus-within:border-red-500'
    : 'border-gray-300'

  return (
    <div className={className}>
      <div className={`flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${borderClasses}`}>
        {tags.map((tag, index) => (
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
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          inputMode={inputMode}
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