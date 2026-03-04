import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EmojiPicker } from 'frimousse';
import { X } from 'lucide-react';

interface EmojiPickerInputProps {
  value: string;
  onChange: (emoji: string) => void;
  placeholder?: string;
}

export function EmojiPickerInput({ value, onChange, placeholder }: EmojiPickerInputProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const locale = i18n.language === 'fr' ? 'fr' : 'en';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-vault-blue border border-vault-yellow-dark rounded px-3 py-1.5 text-sm text-left flex items-center gap-2 hover:border-vault-yellow transition-colors min-h-[34px]"
      >
        {value ? (
          <>
            <span className="text-xl leading-none">{value}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange(''); } }}
              className="ml-auto text-gray-400 hover:text-red-400 cursor-pointer"
            >
              <X size={14} />
            </span>
          </>
        ) : (
          <span className="text-vault-yellow-dark/60">{placeholder ?? t('bestiary.form.emojiPlaceholder')}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0">
          <EmojiPicker.Root
            className="flex h-[320px] w-[320px] flex-col bg-vault-gray border border-vault-yellow-dark rounded-lg shadow-xl"
            locale={locale}
            onEmojiSelect={(emoji) => {
              onChange(emoji.emoji);
              setOpen(false);
            }}
          >
            <EmojiPicker.Search
              className="m-2 rounded-md bg-vault-blue border border-vault-yellow-dark px-2.5 py-1.5 text-sm text-vault-yellow placeholder:text-vault-yellow-dark/60 outline-none focus:border-vault-yellow"
              placeholder={t('common.search')}
            />
            <EmojiPicker.Viewport className="flex-1 overflow-hidden">
              <EmojiPicker.Loading className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t('common.loading')}
              </EmojiPicker.Loading>
              <EmojiPicker.Empty className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t('common.noResults')}
              </EmojiPicker.Empty>
              <EmojiPicker.List
                components={{
                  CategoryHeader: ({ category, ...props }) => (
                    <div className="bg-vault-gray px-3 py-1 text-xs font-medium text-vault-yellow-dark sticky top-0" {...props}>
                      {category.label}
                    </div>
                  ),
                  Row: ({ children, ...props }) => (
                    <div className="px-1" {...props}>{children}</div>
                  ),
                  Emoji: ({ emoji, ...props }) => (
                    <button
                      className="flex size-8 items-center justify-center rounded text-lg hover:bg-vault-blue data-[active]:bg-vault-blue transition-colors"
                      {...props}
                    >
                      {emoji.emoji}
                    </button>
                  ),
                }}
              />
            </EmojiPicker.Viewport>
          </EmojiPicker.Root>
        </div>
      )}
    </div>
  );
}
