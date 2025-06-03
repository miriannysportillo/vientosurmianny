import React, { Suspense, lazy } from 'react';
import { AuthProvider as MensajeriaAuthProvider } from '../../mensajeria-main/src/contexts/AuthContext';
import '../../mensajeria-main/src/index.css';

const Messenger = lazy(() => import('./MessengerProxy'));

const MessengerWrapper: React.FC = () => {
  return (
    <MensajeriaAuthProvider>
      <Suspense fallback={<div>Cargando mensajería...</div>}>
        <Messenger />
      </Suspense>
    </MensajeriaAuthProvider>
  );
};

export default MessengerWrapper;
