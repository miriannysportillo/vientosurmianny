import React, { useEffect, Suspense, lazy } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ConversationList = lazy(() => import('../components/messenger/ConversationList'));
const ChatArea = lazy(() => import('../components/messenger/ChatArea'));

const Messenger: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { t } = useTranslation();

  useEffect(() => {
    if (isMobile && !conversationId) {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobile, conversationId]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>{t('Cargando...')}</div>}>
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-white to-indigo-200">
          <header className="bg-white/80 backdrop-blur border-b border-indigo-200 py-3 px-4 flex justify-between items-center shadow-sm">
            <h1 className="text-2xl font-bold text-indigo-700 tracking-tight flex items-center gap-2">
              <span role="img" aria-label="chat">💬</span> Mensajes
            </h1>
          </header>
          <div className="flex-1 flex overflow-hidden rounded-lg shadow-lg m-2 bg-white/90">
            {(!isMobile || !conversationId) && (
              <div className="border-r border-indigo-100 bg-gradient-to-b from-indigo-50 to-white/80 w-full md:w-80 lg:w-96">
                <ConversationList />
              </div>
            )}
            {(!isMobile || conversationId) && (
              <div className="flex-1 bg-white/80">
                <ChatArea />
              </div>
            )}
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
};

export default Messenger;