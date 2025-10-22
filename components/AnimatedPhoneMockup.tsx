'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

export default function AnimatedPhoneMockup() {
  // Temporary placeholder - animated phone mockup without loading 881 missing PNG files
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative"
        style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.4))' }}
      >
        {/* Phone Frame */}
        <div className="relative bg-slate-900 rounded-[3rem] p-3" style={{ width: 300, height: 600 }}>
          {/* Screen */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-[2.5rem] w-full h-full overflow-hidden relative">
            {/* Dynamic content animation */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-emerald-600 rounded-full"></div>
                <div className="h-8 w-8 bg-emerald-100 rounded-full"></div>
              </div>

              {/* Map placeholder */}
              <div className="h-48 bg-emerald-100 rounded-2xl relative overflow-hidden">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-emerald-100"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 bg-emerald-600 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                <div className="h-16 bg-white rounded-xl shadow-sm"></div>
                <div className="h-16 bg-white rounded-xl shadow-sm"></div>
                <div className="h-16 bg-white rounded-xl shadow-sm"></div>
              </div>
            </motion.div>
          </div>

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl"></div>
        </div>
      </motion.div>
    </div>
  )
}
