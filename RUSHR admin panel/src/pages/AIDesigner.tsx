import React, { useState } from 'react';
import { Send, Sparkles, Clock, MapPin, Plane } from 'lucide-react';

const AIDesigner = () => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'ai',
      message: 'Hello! I\'m your AI Travel Designer. I can help you plan the perfect charter experience. What kind of trip are you looking for?',
      time: '2:30 PM'
    }
  ]);

  const quickSuggestions = [
    'Looking for the most luxurious experience?',
    'Plan a trip to Aspen?',
    'Need the latest SAF?',
    'Want everything planned seamlessly?'
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, {
        type: 'user',
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          type: 'ai',
          message: 'I\'d be happy to help you with that! Let me suggest some options based on your preferences.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-4 shadow-sm h-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Chat History</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Plane size={14} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Aspen Trip Planning</span>
              </div>
              <p className="text-xs text-gray-600">2 hours ago</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <MapPin size={14} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Miami Weekend</span>
              </div>
              <p className="text-xs text-gray-600">1 day ago</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Clock size={14} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Empty Leg Search</span>
              </div>
              <p className="text-xs text-gray-600">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-9">
        <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">AI Travel Designer</h3>
                <p className="text-sm text-gray-600">Find What Matters, Faster.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4 mb-6">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    chat.type === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{chat.message}</p>
                    <p className={`text-xs mt-1 ${chat.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {chat.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <p className="text-sm text-gray-900">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 bg-gray-50 rounded-lg border-none outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors duration-200"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDesigner;