import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { MessageSquare, User, Wrench, Send } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Reusable correction-thread viewer / composer.
 *
 * props:
 *   open, onOpenChange
 *   video           : the video object (has .corrections array)
 *   as              : 'admin' | 'client' — controls composer role & label
 *   canAdd          : boolean — whether the composer is enabled
 *   onSaved()       : called after a note is appended
 *   composerLabel   : optional label for composer button
 */
export default function CorrectionNotesDialog({ open, onOpenChange, video, as = 'admin', canAdd = false, onSaved, composerLabel }) {
  const [text, setText] = useState('');
  const notes = video?.corrections || [];

  const submit = () => {
    if (!text.trim()) return toast.error('Add a note first');
    const list = video.corrections || (video.corrections = []);
    list.push({
      id: `cn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      from: as, // 'client' or 'admin' (editor)
      note: text.trim(),
    });
    setText('');
    onSaved && onSaved();
    toast.success('Note added to conversation');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a1112] border border-[#243334] text-[#e6f7f6] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#fb923c]" /> Correction Notes</DialogTitle>
          <DialogDescription className="text-[#7c9394]">
            {video?.name} · conversation between client and editor.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6b8788]">No correction notes yet.</div>
          ) : notes.map((n) => (
            <div key={n.id} className={`rounded-lg border p-3 ${n.from === 'client' ? 'border-[#5e3512] bg-[#1e130a]' : 'border-[#1e3a3b] bg-[#0e1f20]'}`}>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
                {n.from === 'client'
                  ? <span className="inline-flex items-center gap-1 text-[#fb923c]"><User className="w-3 h-3" /> Client</span>
                  : <span className="inline-flex items-center gap-1 text-[#5eead4]"><Wrench className="w-3 h-3" /> Editor</span>}
                <span className="text-[#6b8788] ml-auto">{new Date(n.at).toLocaleString()}</span>
              </div>
              <p className="mt-1.5 text-sm text-[#e6f7f6] whitespace-pre-wrap leading-relaxed">{n.note}</p>
            </div>
          ))}
        </div>

        {canAdd && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={as === 'client' ? 'Reply to editor…' : 'Add an editor note (visible to client)…'}
              className="focus-teal w-full px-3 py-2 rounded-lg bg-[#070d0e] border border-[#243334] text-sm text-[#e6f7f6] placeholder-[#4b6162]"
            />
            <DialogFooter>
              <button onClick={() => onOpenChange(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Close</button>
              <button onClick={submit} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2dd4bf] hover:bg-[#26c1ad] text-[#062626] text-sm font-semibold">
                <Send className="w-4 h-4" /> {composerLabel || 'Add note'}
              </button>
            </DialogFooter>
          </>
        )}
        {!canAdd && (
          <DialogFooter>
            <button onClick={() => onOpenChange(false)} className="px-3.5 py-2 rounded-lg border border-[#243334] bg-[#0f1819] text-sm text-[#a8bcbd] hover:bg-[#152223]">Close</button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
