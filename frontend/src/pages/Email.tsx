import React from 'react';
import GmailBulkMessaging from '../components/GmailBulkMessaging';

const Email: React.FC = () => {
  return (
    <div className="h-full">
      {/* Bulk Messaging - Full Page */}
      <GmailBulkMessaging onClose={() => {}} />
    </div>
  );
};

export default Email;
