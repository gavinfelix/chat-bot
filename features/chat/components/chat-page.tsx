'use client';

import ChatComposer from '../composer/chat-composer';
import ChatAutoScrollButton from './chat-auto-scroll-button';
import ChatAppHeader from './chat-app-header';
import Messages from './messages';
import useChatPage from '../hooks/use-chat-page';

type Props = {
  chatId: string;
};

export default function ChatPage({ chatId }: Props) {
  const {
    scrollContainerRef,
    messagesEndRef,
    composerRef,
    messages,
    status,
    stop,
    regenerateMessage,
    input,
    selectedModel,
    setSelectedModel,
    setInput,
    triggerSend,
    deleteFile,
    uploadFile,
    deleteChat,
    composerHeight,
    composerOverlayHeight,
    messagesBottomPadding,
    streamReserveHeight,
    showScrollControl,
    disclaimerBottomOffset,
    composerBottomOffset,
    scrollToMessagesBottom,
    isGenerating,
  } = useChatPage({ chatId });

  return (
    <div
      ref={scrollContainerRef}
      className="chat-page-scrollbar h-full min-w-0 flex-1 overflow-y-scroll bg-background text-foreground"
    >
      {/* Page header */}
      <ChatAppHeader deleteChatAction={() => void deleteChat()} />

      {/* Main content */}
      <main
        className="min-h-[calc(100%-48px)] px-6 pt-2"
        style={{ paddingBottom: messagesBottomPadding }}
      >
        <Messages messages={messages} status={status} regenerateMessageAction={regenerateMessage} />
        <div ref={messagesEndRef} className="h-px w-full" aria-hidden="true" />
        {streamReserveHeight > 0 ? (
          <div style={{ height: streamReserveHeight }} aria-hidden="true" />
        ) : null}
      </main>

      {/* Composer overlay */}
      <div
        className="pointer-events-none sticky bottom-0 z-20"
        style={{ marginTop: -composerOverlayHeight }}
      >
        <div style={{ height: composerOverlayHeight }} />
        <div
          className="absolute inset-x-0 bottom-0 bg-background"
          style={{ height: composerOverlayHeight }}
        />

        <ChatAutoScrollButton
          show={showScrollControl}
          isGenerating={isGenerating}
          bottomOffset={composerBottomOffset + composerHeight + 50}
          scrollToBottomAction={() =>
            scrollToMessagesBottom({
              reserveAssistantSpace: isGenerating,
              behavior: 'smooth',
            })
          }
        />

        <div className="absolute inset-x-0 px-6" style={{ bottom: composerBottomOffset }}>
          <div ref={composerRef} className="pointer-events-auto mx-auto max-w-3xl">
            <ChatComposer
              sendMessageAction={triggerSend}
              status={status}
              stopGeneratingAction={stop}
              input={input}
              selectedModel={selectedModel}
              setSelectedModelAction={setSelectedModel}
              setInputAction={setInput}
              deleteFileAction={deleteFile}
              uploadFileAction={uploadFile}
            />
          </div>
        </div>

        <div
          className="absolute inset-x-0 z-10 flex justify-center px-6"
          style={{ bottom: disclaimerBottomOffset }}
        >
          <p className="text-center text-[11px] leading-4 text-muted-foreground">
            Chat Bot can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
