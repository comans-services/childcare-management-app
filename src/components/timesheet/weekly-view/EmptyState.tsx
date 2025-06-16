
import React from "react";

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="text-center py-8 animate-in fade-in-50">
      <p className="text-gray-500">{message}</p>
    </div>
  );
};

export default EmptyState;
