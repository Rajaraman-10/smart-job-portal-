import React, { useState } from 'react';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RecruiterMessagesPage({ conversations, selectedConversation, onSelectConversation, messages, onSendMessage, loading }) {
  const [localText, setLocalText] = useState('');

  if (loading) {
    return <LoadingSpinner label="Loading messages..." />;
  }

  if (!conversations.length) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Messages will appear here once candidates reach out or you start a conversation."
      />
    );
  }

  return (
    <div className="grid gap-6 font-sans text-[#14181C] lg:grid-cols-[320px_1fr]">
      <div className="border border-[#14181C]/10 bg-white p-4">
        <p className="mb-4 px-2 font-data text-xs tracking-[0.2em] text-[#0E7C66]">CANDIDATES</p>
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation)}
              className={`w-full px-4 py-3 text-left transition ${
                selectedConversation?.id === conversation.id ? 'bg-[#14181C] text-white' : 'text-[#14181C] hover:bg-[#F5F6F3]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{conversation.applicant_name || 'Candidate'}</span>
                {conversation.unread_messages > 0 && (
                  <span className="bg-[#B3402F] px-1.5 py-0.5 font-data text-[10px] font-semibold text-white">{conversation.unread_messages}</span>
                )}
              </div>
              <p className={`mt-1 text-sm ${selectedConversation?.id === conversation.id ? 'text-white/60' : 'text-[#5B6660]'}`}>
                {conversation.job_title}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-[#14181C]/10 bg-white p-4">
        {selectedConversation ? (
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#14181C]/10 pb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#14181C]">{selectedConversation.applicant_name || 'Candidate'}</h2>
                <p className="text-sm text-[#5B6660]">{selectedConversation.job_title}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
              {messages.length === 0 ? (
                <p className="text-sm text-[#5B6660]">Start the conversation with a candidate.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[75%] p-4 ${
                      message.sender === selectedConversation.recruiter ? 'ml-auto bg-[#14181C] text-white' : 'bg-[#F5F6F3] text-[#14181C]'
                    }`}
                  >
                    <p className="text-sm leading-6">{message.content}</p>
                    <p className={`mt-2 font-data text-[11px] ${message.sender === selectedConversation.recruiter ? 'text-white/50' : 'text-[#5B6660]'}`}>
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendMessage(localText);
                setLocalText('');
              }}
              className="space-y-3"
            >
              <textarea
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                rows={3}
                className="w-full border border-[#14181C]/15 bg-[#F5F6F3] px-4 py-3 text-sm text-[#14181C] outline-none focus:border-[#0E7C66]"
                placeholder="Write a message"
              />
              <button type="submit" className="inline-flex items-center bg-[#0E7C66] px-5 py-3 text-sm font-medium text-white hover:bg-[#0B6553]">
                Send message
              </button>
            </form>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-[#5B6660]">
            <p className="text-sm">Select a conversation to view messages.</p>
          </div>
        )}
      </div>
    </div>
  );
}