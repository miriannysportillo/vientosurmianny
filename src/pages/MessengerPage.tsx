import React, { Suspense, lazy } from 'react';
import { AuthProvider as MensajeriaAuthProvider } from '../contexts/AuthContext.mensajeria';
import '../index.mensajeria.css';

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
