"use client";
import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useCompose } from '@/hooks/useCompose';
import { X, Send, Paperclip, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AttachmentDropzone } from './AttachmentDropzone';
import styles from './EmailComposer.module.css';

export const EmailComposer = () => {
  const { isOpen, state, isSending, updateState, closeCompose, sendEmail } = useCompose();
  const [minimized, setMinimized] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: state.html,
    onUpdate: ({ editor }) => {
      updateState({ html: editor.getHTML(), text: editor.getText() });
    },
  });

  // Keep editor synced if state changes externally (e.g. reply)
  React.useEffect(() => {
    if (editor && state.html !== editor.getHTML()) {
      editor.commands.setContent(state.html);
    }
  }, [state.html, editor]);

  if (!isOpen) return null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val && val.includes('@')) {
        updateState({ [field]: [...state[field], val] });
        e.currentTarget.value = '';
      }
    }
  };

  const removeChip = (field: 'to' | 'cc' | 'bcc', index: number) => {
    const newArr = [...state[field]];
    newArr.splice(index, 1);
    updateState({ [field]: newArr });
  };

  const renderField = (field: 'to' | 'cc' | 'bcc', label: string) => (
    <div className={styles.fieldRow}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chipContainer}>
        {state[field].map((email, idx) => (
          <div key={idx} className={styles.chip}>
            {email}
            <button onClick={() => removeChip(field, idx)}><X size={12} /></button>
          </div>
        ))}
        <input 
          type="text" 
          placeholder={state[field].length === 0 ? `Add ${label}...` : ''}
          onKeyDown={(e) => handleInputKeyDown(e, field)}
          className={styles.input}
        />
      </div>
      {field === 'to' && !showCcBcc && (
        <button className={styles.ccBtn} onClick={() => setShowCcBcc(true)}>Cc/Bcc</button>
      )}
    </div>
  );

  const handleSend = async () => {
    if (state.to.length === 0 || (!state.subject && !state.text)) {
      alert("Please add a recipient and subject/body.");
      return;
    }
    await sendEmail();
  };

  return (
    <div className={`${styles.composerModal} ${minimized ? styles.minimized : ''}`}>
      <div className={styles.header} onClick={() => setMinimized(!minimized)}>
        <h4 className={styles.title}>New Message</h4>
        <div className={styles.headerActions}>
          <button onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}>
            {minimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); closeCompose(); }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className={styles.body}>
          <div className={styles.fields}>
            {renderField('to', 'To')}
            {showCcBcc && (
              <>
                {renderField('cc', 'Cc')}
                {renderField('bcc', 'Bcc')}
              </>
            )}
            <div className={styles.fieldRow}>
              <input 
                type="text" 
                placeholder="Subject" 
                value={state.subject}
                onChange={e => updateState({ subject: e.target.value })}
                className={styles.subjectInput}
              />
            </div>
          </div>

          <div className={styles.editorContainer}>
            <EditorContent editor={editor} className={styles.tiptap} />
          </div>

          <div className={styles.attachmentSection}>
            <AttachmentDropzone 
              files={state.attachments} 
              onFilesChange={files => updateState({ attachments: files })} 
            />
          </div>

          <div className={styles.footer}>
            <Button onClick={handleSend} isLoading={isSending} leftIcon={<Send size={16} />}>
              Send
            </Button>
            <div className={styles.footerActions}>
              <button className={styles.iconBtn}><Paperclip size={18} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
