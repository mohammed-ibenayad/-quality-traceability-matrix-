import React, { useState } from 'react';
import SlideOutPanel from '../components/Common/SlideOutPanel';

const ComponentTest = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">✅ Component Test</h1>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Open Test Panel
      </button>

      <SlideOutPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Test Panel"
        width="lg"
      >
        <p>🎉 If you see this, it works!</p>
      </SlideOutPanel>
    </div>
  );
};

export default ComponentTest;