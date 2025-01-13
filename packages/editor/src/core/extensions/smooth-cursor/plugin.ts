import { type Selection, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { type EditorView, Decoration, DecorationSet } from "@tiptap/pm/view";
import { codeMarkPluginKey } from "@/extensions/code-mark/utils";

export const PROSEMIRROR_SMOOTH_CURSOR_CLASS = "prosemirror-smooth-cursor";
const BLINK_DELAY = 750;

export function smoothCursorPlugin(): Plugin {
  let smoothCursor: HTMLElement | null = typeof document === "undefined" ? null : document.createElement("div");
  let rafId: number | undefined;
  let blinkTimeoutId: number | undefined;
  let isEditorFocused = false;
  let lastCursorPosition = { x: 0, y: 0 };

  function isCodemarkCursorActive(view: EditorView) {
    const codemarkState = codeMarkPluginKey.getState(view.state);
    return codemarkState?.active === true;
  }

  function updateCursor(view?: EditorView, cursor?: HTMLElement) {
    if (!view || !view.dom || view.isDestroyed || !cursor) return;

    if (!isEditorFocused || isCodemarkCursorActive(view)) {
      cursor.style.display = "none";
      return;
    }

    cursor.style.display = "block";

    const { state, dom } = view;
    const { selection } = state;
    if (!isTextSelection(selection)) return;

    const cursorRect = getCursorRect(view, selection.$head === selection.$from);

    if (!cursorRect) return cursor;

    const editorRect = dom.getBoundingClientRect();

    const className = PROSEMIRROR_SMOOTH_CURSOR_CLASS;

    // Calculate the exact position
    const x = cursorRect.left - editorRect.left;
    const y = cursorRect.top - editorRect.top;

    // Check if cursor position has changed
    if (x !== lastCursorPosition.x || y !== lastCursorPosition.y) {
      lastCursorPosition = { x, y };
      cursor.classList.remove(`${className}--blinking`);

      // Clear existing timeout
      if (blinkTimeoutId) {
        window.clearTimeout(blinkTimeoutId);
      }

      // Set new timeout for blinking
      blinkTimeoutId = window.setTimeout(() => {
        if (cursor && isEditorFocused) {
          cursor.classList.add(`${className}--blinking`);
        }
      }, BLINK_DELAY);
    }

    cursor.className = className;
    cursor.style.height = `${cursorRect.bottom - cursorRect.top}px`;

    rafId = requestAnimationFrame(() => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  return new Plugin({
    key,
    view: (view) => {
      const doc = view.dom.ownerDocument;
      smoothCursor = smoothCursor || document.createElement("div");
      const cursor = smoothCursor;

      const update = () => {
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
        updateCursor(view, cursor);
      };

      const handleFocus = () => {
        isEditorFocused = true;
        update();
      };

      const handleBlur = () => {
        isEditorFocused = false;
        if (blinkTimeoutId) {
          window.clearTimeout(blinkTimeoutId);
        }
        cursor.classList.remove(`${PROSEMIRROR_SMOOTH_CURSOR_CLASS}--blinking`);
        update();
      };

      let observer: ResizeObserver | undefined;
      if (window.ResizeObserver) {
        observer = new window.ResizeObserver(update);
        observer?.observe(view.dom);
      }

      doc.addEventListener("selectionchange", update);
      view.dom.addEventListener("focus", handleFocus);
      view.dom.addEventListener("blur", handleBlur);

      return {
        update,
        destroy: () => {
          doc.removeEventListener("selectionchange", update);
          view.dom.removeEventListener("focus", handleFocus);
          view.dom.removeEventListener("blur", handleBlur);
          observer?.unobserve(view.dom);
          if (rafId !== undefined) {
            cancelAnimationFrame(rafId);
          }
          if (blinkTimeoutId) {
            window.clearTimeout(blinkTimeoutId);
          }
        },
      };
    },
    props: {
      decorations: (state) => {
        if (!smoothCursor || !isTextSelection(state.selection) || !state.selection.empty) return;

        return DecorationSet.create(state.doc, [
          Decoration.widget(0, smoothCursor, {
            key: PROSEMIRROR_SMOOTH_CURSOR_CLASS,
          }),
        ]);
      },

      attributes: () => ({
        class: isEditorFocused ? "smooth-cursor-enabled" : "",
      }),
    },
  });
}

const key = new PluginKey(PROSEMIRROR_SMOOTH_CURSOR_CLASS);

function getCursorRect(
  view: EditorView,
  toStart: boolean
): { left: number; right: number; top: number; bottom: number } | null {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const range = selection?.getRangeAt(0)?.cloneRange();
  if (!range) return null;

  range.collapse(toStart);
  const rects = range.getClientRects();
  const rect = rects?.length ? rects[rects.length - 1] : null;
  if (rect?.height) return rect;

  return view.coordsAtPos(view.state.selection.head);
}

function isTextSelection(selection: Selection): selection is TextSelection {
  return selection && typeof selection === "object" && "$cursor" in selection;
}
