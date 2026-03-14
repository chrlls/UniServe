/**
 * app-modal.jsx
 *
 * Thin wrapper around @heroui/modal that maps the project's CSS design tokens
 * so every modal matches the existing light/dark theme automatically.
 *
 * Usage:
 *   import { AppModal, AppModalHeader, AppModalBody, AppModalFooter } from '@/components/ui/app-modal';
 *
 *   <AppModal isOpen={open} onClose={() => setOpen(false)} title="My Modal">
 *     <AppModalBody> … </AppModalBody>
 *     <AppModalFooter> … </AppModalFooter>
 *   </AppModal>
 */

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';

/* Minimal blur — noticeable but not heavy */
const backdropClass = 'bg-black/40 backdrop-blur-[2px]';

const baseClass = [
  // sizing
  'max-h-[90dvh] overflow-hidden',
  // surface — use CSS vars so light/dark both work
  'bg-[var(--color-card)] text-[var(--color-foreground)]',
  'border border-[var(--color-border)]',
  'shadow-[var(--shadow-xl)]',
  'rounded-2xl',
].join(' ');

const headerClass = [
  'border-b border-[var(--color-border)]',
  'px-6 py-4',
  'text-base font-semibold tracking-tight',
  'text-[var(--color-foreground)]',
].join(' ');

const bodyClass = [
  'px-6 py-5',
  'overflow-y-auto',
  'text-[var(--color-foreground)]',
].join(' ');

const footerClass = [
  'border-t border-[var(--color-border)]',
  'bg-[var(--color-muted)]/40',
  'px-6 py-4',
  'flex items-center justify-end gap-2',
].join(' ');

/* ─── Size map ────────────────────────────────────────────────────── */
const SIZE_MAP = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',   // 32rem
  lg: 'lg',   // 48rem
  xl: 'xl',   // 64rem
  '2xl': '2xl',
  full: 'full',
};

/* ─── AppModal ─────────────────────────────────────────────────────── */
/**
 * @param {object} props
 * @param {boolean}       props.isOpen
 * @param {function}      props.onClose
 * @param {string}        [props.title]       — shown in the header slot
 * @param {React.ReactNode} props.children    — AppModalBody + AppModalFooter
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'full'} [props.size='md']
 * @param {boolean}       [props.isDismissable=true]
 * @param {boolean}       [props.hideCloseButton=false]
 * @param {string}        [props.scrollBehavior='inside'] — 'inside' | 'outside'
 * @param {string}        [props.className]   — extra classes on the modal wrapper
 */
export function AppModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  isDismissable = true,
  hideCloseButton = false,
  scrollBehavior = 'inside',
  className = '',
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={SIZE_MAP[size] ?? 'md'}
      isDismissable={isDismissable}
      hideCloseButton={hideCloseButton}
      scrollBehavior={scrollBehavior}
      backdrop="opaque"
      // Cut heroui's spring animation down so it feels instant
      motionProps={{
        variants: {
          enter: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.12, ease: [0.16, 1, 0.3, 1] },
          },
          exit: {
            opacity: 0,
            scale: 0.97,
            y: 4,
            transition: { duration: 0.08, ease: [0.4, 0, 1, 1] },
          },
        },
      }}
      classNames={{
        backdrop: backdropClass,
        base: `${baseClass} ${className}`,
        header: headerClass,
        body: bodyClass,
        footer: footerClass,
        closeButton: [
          'absolute right-4 top-4',
          'rounded-lg p-1.5',
          'text-[var(--color-muted-foreground)]',
          'hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
          'transition-colors',
        ].join(' '),
      }}
    >
      <ModalContent>
        {() => (
          <>
            {title != null && (
              <ModalHeader>{title}</ModalHeader>
            )}
            {children}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

/* ─── Re-exports for direct slot use ──────────────────────────────── */
export { ModalBody as AppModalBody, ModalFooter as AppModalFooter };
