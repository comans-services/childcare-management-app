
import React from "react";

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 animate-in fade-in-50">
      <p className="text-gray-500">No projects found. Please create a project first.</p>
    </div>
  );
};

export default EmptyState;
