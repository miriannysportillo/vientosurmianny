import React from 'react';
import { Profile } from '../../store/messageStore';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: Profile[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users }) => {
  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].username} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].username} and ${users[1].username} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center mb-4"
    >
      <div className="rounded-2xl px-4 py-2 bg-white shadow-sm text-gray-600 text-sm flex items-center">
        <div className="flex space-x-1 mr-2">
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.2 }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          />
        </div>
        {getTypingText()}
      </div>
    </motion.div>
  );
};

export default TypingIndicator;