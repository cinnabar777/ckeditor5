import {
  ClassicEditor,
  Markdown,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  Underline,
  BlockQuote,
  CodeBlock,
  List,
  ListProperties,
  TodoList,
  Link,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  ImageResize,
  ImageInsert,
  MediaEmbed,
  HorizontalLine,
  FindAndReplace,
  SelectAll,
  Undo,
  SourceEditing,
  HtmlEmbed,
  Font,
  Highlight,
  Autoformat,
  Indent,
  IndentBlock,
  PasteFromOffice
} from 'ckeditor5';

import '../../../packages/ckeditor5-editor-classic/theme/classiceditor.css';
import '../../../packages/ckeditor5-ui/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-content.css';

let editorInstance = null;
let isProgrammaticChange = false;
let isToolbarVisible = false;
let isLineWrapEnabled = true;

let customHotkeys = {
  new: 'ctrl+n',
  open: 'ctrl+o',
  save: 'ctrl+s',
  save_as: 'ctrl+shift+s',
  image: 'ctrl+shift+i',
  settings: 'ctrl+,',
  toggle_toolbar: 'ctrl+t',
  line_wrap: 'ctrl+alt+w',
  bold: 'ctrl+b',
  italic: 'ctrl+i',
  underline: 'ctrl+u',
  strikethrough: 'ctrl+shift+x',
  code: 'ctrl+e',
  link: 'ctrl+k',
  blockQuote: 'ctrl+shift+q',
  codeBlock: 'ctrl+shift+c',
  bulletedList: 'ctrl+shift+8',
  numberedList: 'ctrl+shift+7',
  todoList: 'ctrl+shift+l',
  indent: 'tab',
  outdent: 'shift+tab',
  horizontalLine: 'ctrl+shift+h',
  findAndReplace: 'ctrl+f',
  sourceEditing: 'ctrl+shift+u',
  heading_p: 'ctrl+alt+0',
  heading_1: 'ctrl+alt+1',
  heading_2: 'ctrl+alt+2',
  heading_3: 'ctrl+alt+3',
  heading_4: 'ctrl+alt+4',
  heading_5: 'ctrl+alt+5',
  heading_6: 'ctrl+alt+6',
  highlight_yellow: 'ctrl+alt+y',
  highlight_green: 'ctrl+alt+g',
  highlight_pink: 'ctrl+alt+p',
  highlight_blue: 'ctrl+alt+b',
  highlight_red: 'ctrl+alt+r',
  highlight_remove: 'ctrl+alt+x'
};

async function initEditor(disabledPlugins = [], isInitialInit = false) {
  if (editorInstance) {
    await editorInstance.destroy();
    editorInstance = null;
  }

  const container = document.querySelector('#editor-container');
  let editorElement = document.querySelector('#editor');
  if (!editorElement && container) {
    editorElement = document.createElement('div');
    editorElement.id = 'editor';
    container.appendChild(editorElement);
  }

  const pluginsToLoad = [
    Essentials,
    Paragraph,
    Markdown,
    PasteFromOffice
  ];

  const toolbarItems = [];

  const addIfEnabled = (pluginKey, pluginClass, toolbarKey) => {
    if (!disabledPlugins.includes(pluginKey)) {
      if (pluginClass && !pluginsToLoad.includes(pluginClass)) {
        pluginsToLoad.push(pluginClass);
      }
      if (toolbarKey) {
        toolbarItems.push(toolbarKey);
      }
      return true;
    }
    return false;
  };

  toolbarItems.push('undo', 'redo', '|');

  if (addIfEnabled('heading', Heading)) toolbarItems.push('heading', '|');

  addIfEnabled('bold', Bold, 'bold');
  addIfEnabled('italic', Italic, 'italic');
  addIfEnabled('underline', Underline, 'underline');
  addIfEnabled('strikethrough', Strikethrough, 'strikethrough');
  addIfEnabled('highlight', Highlight, 'highlight');
  addIfEnabled('code', Code, 'code');
  if (toolbarItems.length > 0 && toolbarItems[toolbarItems.length - 1] !== '|') {
    toolbarItems.push('|');
  }

  addIfEnabled('link', Link, 'link');
  if (addIfEnabled('image', Image)) {
    pluginsToLoad.push(ImageCaption, ImageStyle, ImageToolbar, ImageResize, ImageInsert);
    toolbarItems.push('insertImage');
  }
  addIfEnabled('blockQuote', BlockQuote, 'blockQuote');
  addIfEnabled('codeBlock', CodeBlock, 'codeBlock');
  if (addIfEnabled('table', Table)) {
    pluginsToLoad.push(TableToolbar, TableProperties, TableCellProperties);
    toolbarItems.push('insertTable');
  }
  if (toolbarItems.length > 0 && toolbarItems[toolbarItems.length - 1] !== '|') {
    toolbarItems.push('|');
  }

  if (addIfEnabled('list', List)) {
    pluginsToLoad.push(ListProperties);
    toolbarItems.push('bulletedList', 'numberedList');
  }
  addIfEnabled('todoList', TodoList, 'todoList');
  if (addIfEnabled('indent', Indent)) {
    pluginsToLoad.push(IndentBlock);
    toolbarItems.push('outdent', 'indent');
  }
  if (toolbarItems.length > 0 && toolbarItems[toolbarItems.length - 1] !== '|') {
    toolbarItems.push('|');
  }

  addIfEnabled('horizontalLine', HorizontalLine, 'horizontalLine');
  addIfEnabled('sourceEditing', SourceEditing, 'sourceEditing');
  addIfEnabled('findAndReplace', FindAndReplace, 'findAndReplace');
  addIfEnabled('autoformat', Autoformat);

  try {
    editorInstance = await ClassicEditor.create(editorElement, {
      licenseKey: 'GPL',
      plugins: pluginsToLoad,
      toolbar: {
        items: toolbarItems,
        shouldNotGroupWhenFull: true
      },
      heading: {
        options: [
          { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
          { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
          { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
          { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
          { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
          { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
      },
      codeBlock: {
        languages: [
          { language: 'plaintext', label: 'Plain text' },
          { language: 'c', label: 'C' },
          { language: 'cs', label: 'C#' },
          { language: 'cpp', label: 'C++' },
          { language: 'css', label: 'CSS' },
          { language: 'html', label: 'HTML' },
          { language: 'java', label: 'Java' },
          { language: 'javascript', label: 'JavaScript' },
          { language: 'json', label: 'JSON' },
          { language: 'kotlin', label: 'Kotlin' },
          { language: 'markdown', label: 'Markdown' },
          { language: 'python', label: 'Python' },
          { language: 'sql', label: 'SQL' },
          { language: 'typescript', label: 'TypeScript' },
          { language: 'xml', label: 'XML' },
          { language: 'yaml', label: 'YAML' }
        ]
      },
      image: {
        toolbar: [ 'imageTextAlternative', 'imageStyle:inline', 'imageStyle:block' ]
      },
      table: {
        contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
      }
    });

    editorInstance.model.document.on('change:data', () => {
      if (!isProgrammaticChange && window.AndroidNative && typeof window.AndroidNative.onContentChanged === 'function') {
        const text = editorInstance.getData();
        window.AndroidNative.onContentChanged(text);
      }
    });

    // Save Selection / Scroll State Changes
    editorInstance.model.document.selection.on('change:range', () => {
      const sourceEditingPlugin = editorInstance.plugins ? editorInstance.plugins.get('SourceEditing') : null;
      if (sourceEditingPlugin && sourceEditingPlugin.isSourceEditingMode) {
        return;
      }
      if (!isProgrammaticChange && window.AndroidNative && typeof window.AndroidNative.onSelectionChanged === 'function') {
        const state = window.editorBridge.getSelectionState();
        if (state && Array.isArray(state.path) && state.path.length > 0) {
          window.AndroidNative.onSelectionChanged(JSON.stringify(state));
        }
      }
    });

    const mainEditingArea = document.querySelector('.ck-editor__main');
    if (mainEditingArea) {
      mainEditingArea.addEventListener('scroll', () => {
        if (!isProgrammaticChange && window.AndroidNative && typeof window.AndroidNative.onScrollChanged === 'function') {
          window.AndroidNative.onScrollChanged(mainEditingArea.scrollTop);
        }
      }, { passive: true });
    }

    // Setup Header Row with Document Title & App Action Strip inside Bottom Bar Container
    const topContainer = document.querySelector('.ck-editor__top');
    if (topContainer) {
      if (!document.querySelector('.toolbar-header-row')) {
        const headerRow = document.createElement('div');
        headerRow.className = 'toolbar-header-row';
        headerRow.innerHTML = `
          <div id="file-title" class="toolbar-title-container">Untitled.md</div>
          <div class="toolbar-app-actions">
            <button class="toolbar-app-btn" title="New" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('new')">📄</button>
            <button class="toolbar-app-btn" title="Open" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('open')">📂</button>
            <button class="toolbar-app-btn" title="Save" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save')">💾</button>
            <button class="toolbar-app-btn" title="Save As" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save_as')">📑</button>
            <button class="toolbar-app-btn" title="Line Wrap" onclick="window.editorBridge.toggleLineWrap()">↩</button>
            <button class="toolbar-app-btn" title="Image" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('image')">🖼</button>
            <button class="toolbar-app-btn" title="New Window" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('new_window')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="8" x2="21" y2="8"></line><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg></button>
            <button class="toolbar-app-btn settings-btn" title="Settings" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('settings')">⚙</button>
          </div>
        `;
        topContainer.prepend(headerRow);
      }
    }

    // Safe Copy Code event handler via delegation on editor container
    const editorMainArea = document.querySelector('.ck-editor__main');
    if (editorMainArea) {
      editorMainArea.addEventListener('click', (e) => {
        const pre = e.target.closest('pre');
        if (pre) {
          const rect = pre.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          if (clickX > rect.width - 60 && clickY < 36) {
            e.preventDefault();
            e.stopPropagation();
            const codeEl = pre.querySelector('code') || pre;
            const textToCopy = codeEl.innerText || codeEl.textContent;
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(textToCopy).catch(() => {});
            }
            if (window.AndroidNative && typeof window.AndroidNative.showToast === 'function') {
              window.AndroidNative.showToast('Code block copied to clipboard');
            }
          }
        }
      });
    }

    // Fast Scrollbar Implementation
    setupFastScrollbar();

    // Independent scroll and cursor position memory for WYSIWYG View and Source Editing View
    let lastWysiwygScrollTop = 0;
    let lastWysiwygSelectionState = null;
    let lastSourceScrollTop = 0;
    let lastSourceSelectionStart = 0;

    const mainAreaForScroll = document.querySelector('.ck-editor__main');
    if (mainAreaForScroll) {
      mainAreaForScroll.addEventListener('scroll', () => {
        const sourceEditingPlugin = editorInstance && editorInstance.plugins ? editorInstance.plugins.get('SourceEditing') : null;
        if (!sourceEditingPlugin || !sourceEditingPlugin.isSourceEditingMode) {
          lastWysiwygScrollTop = mainAreaForScroll.scrollTop;
        }
      }, { passive: true });
    }

    editorInstance.model.document.selection.on('change:range', () => {
      if (isProgrammaticChange) return;
      const sourceEditingPlugin = editorInstance && editorInstance.plugins ? editorInstance.plugins.get('SourceEditing') : null;
      if (!sourceEditingPlugin || !sourceEditingPlugin.isSourceEditingMode) {
        const sel = window.editorBridge.getSelectionState();
        if (sel && Array.isArray(sel.path) && sel.path.length > 0) {
          lastWysiwygSelectionState = sel;
        }
      }
    });

    const sourceEditingPlugin = editorInstance.plugins.get('SourceEditing');
    if (sourceEditingPlugin) {
      sourceEditingPlugin.on('change:isSourceEditingMode', (evt, propertyName, isSourceEditing) => {
        if (isSourceEditing) {
          let attempts = 0;
          const setupSourceTextarea = () => {
            const textarea = document.querySelector('.ck-source-editing-area textarea');
            if (textarea) {
              const bindSourceEvents = () => {
                lastSourceScrollTop = textarea.scrollTop;
                lastSourceSelectionStart = textarea.selectionStart || 0;
              };

              textarea.addEventListener('scroll', bindSourceEvents, { passive: true });
              textarea.addEventListener('keyup', bindSourceEvents, { passive: true });
              textarea.addEventListener('mouseup', bindSourceEvents, { passive: true });
              textarea.addEventListener('touchend', bindSourceEvents, { passive: true });

              textarea.focus();

              if (lastSourceSelectionStart > 0 || lastSourceScrollTop > 0) {
                const safePos = Math.min(lastSourceSelectionStart, textarea.value.length);
                textarea.setSelectionRange(safePos, safePos);
                textarea.scrollTop = lastSourceScrollTop;
              } else {
                let targetBlockIndex = 0;
                let innerOffset = 0;
                try {
                  const selState = window.editorBridge.getSelectionState();
                  if (selState && Array.isArray(selState.path) && selState.path.length > 0) {
                    targetBlockIndex = selState.path[0] || 0;
                    if (selState.path.length > 1) {
                      innerOffset = selState.path[selState.path.length - 1] || 0;
                    }
                  }
                } catch (e) {}

                const fullText = textarea.value || '';
                const lines = fullText.split('\n');
                let currentBlock = 0;
                let charIndex = 0;

                for (let i = 0; i < lines.length; i++) {
                  if (currentBlock >= targetBlockIndex) {
                    charIndex += Math.min(innerOffset, lines[i].length);
                    break;
                  }
                  charIndex += lines[i].length + 1;
                  if (lines[i].trim().length > 0 || (i < lines.length - 1 && lines[i + 1].trim().length > 0)) {
                    currentBlock++;
                  }
                }

                const safePos = Math.min(Math.max(0, charIndex), fullText.length);
                textarea.setSelectionRange(safePos, safePos);

                const textBefore = fullText.substring(0, safePos);
                const targetLineNum = textBefore.split('\n').length;
                const totalLines = lines.length || 1;
                const scrollRatio = Math.max(0, (targetLineNum - 1) / totalLines);
                textarea.scrollTop = Math.max(0, scrollRatio * (textarea.scrollHeight - textarea.clientHeight));

                lastSourceScrollTop = textarea.scrollTop;
                lastSourceSelectionStart = safePos;
              }
            } else if (attempts < 15) {
              attempts++;
              setTimeout(setupSourceTextarea, 30);
            }
          };
          setTimeout(setupSourceTextarea, 20);
        } else {
          isProgrammaticChange = true;
          const textarea = document.querySelector('.ck-source-editing-area textarea');
          if (textarea) {
            lastSourceScrollTop = textarea.scrollTop;
            lastSourceSelectionStart = textarea.selectionStart || 0;
          }

          setTimeout(() => {
            if (window.AndroidNative && typeof window.AndroidNative.restoreNativeCursorAndScrollState === 'function') {
              window.AndroidNative.restoreNativeCursorAndScrollState();
            }
            try {
              editorInstance.editing.view.focus();
            } catch (e) {}
            setTimeout(() => { isProgrammaticChange = false; }, 150);
          }, 100);
        }
      });
    }

    // Enhance Find & Replace Form with Regex Toggle
    const findPlugin = editorInstance.plugins.get('FindAndReplace');
    if (findPlugin) {
      const observer = new MutationObserver(() => {
        const form = document.querySelector('.ck-find-and-replace-form');
        if (form && !form.querySelector('.regex-toggle-row')) {
          const row = document.createElement('div');
          row.className = 'regex-toggle-row';
          row.innerHTML = `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
              <input type="checkbox" id="find-regex-chk"> Use RegEx (.*)
            </label>
          `;
          form.insertBefore(row, form.lastElementChild);

          const chk = row.querySelector('#find-regex-chk');
          if (chk) {
            chk.onchange = () => {
              const findInput = form.querySelector('.ck-labeled-field-view input');
              if (findInput && findInput.value) {
                try {
                  const pattern = chk.checked ? new RegExp(findInput.value, 'g') : findInput.value;
                  findPlugin.find(pattern);
                } catch (err) {
                  console.error('Invalid RegEx pattern:', err);
                }
              }
            };
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (isInitialInit) {
      setupFloatingToggle();
      setupKeyboardShortcuts();
      setupTocGestureAndPanel();
      if (window.AndroidNative && typeof window.AndroidNative.onEditorReady === 'function') {
        window.AndroidNative.onEditorReady();
      }
    }
  } catch (error) {
    console.error('Failed to initialize CKEditor 5:', error);
  }
}

function setupFastScrollbar() {
  const mainArea = document.querySelector('.ck-editor__main');
  const track = document.querySelector('#fast-scrollbar-track');
  const thumb = document.querySelector('#fast-scrollbar-thumb');
  if (!mainArea || !track || !thumb) return;

  let lastScrollTop = mainArea.scrollTop;
  let lastScrollTime = Date.now();
  let hideTimer = null;
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScrollTop = 0;

  const updateThumbPosition = () => {
    const scrollHeight = mainArea.scrollHeight;
    const clientHeight = mainArea.clientHeight;
    if (scrollHeight <= clientHeight + 10) return;

    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = Math.min(1, Math.max(0, mainArea.scrollTop / maxScroll));

    const trackHeight = track.clientHeight || window.innerHeight;
    const thumbHeight = thumb.clientHeight || 60;
    const availableTrack = trackHeight - thumbHeight;

    thumb.style.top = `${scrollRatio * availableTrack}px`;
  };

  mainArea.addEventListener('scroll', () => {
    if (isDragging) return;

    const now = Date.now();
    const dt = now - lastScrollTime;
    const dy = Math.abs(mainArea.scrollTop - lastScrollTop);
    const velocity = dt > 0 ? (dy / dt) : 0;

    lastScrollTop = mainArea.scrollTop;
    lastScrollTime = now;

    if (velocity > 0.8 || dy > 40) {
      updateThumbPosition();
      track.classList.add('visible');

      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!isDragging) {
          track.classList.remove('visible');
        }
      }, 1200);
    }
  }, { passive: true });

  // Drag handling on Fast Scrollbar Thumb
  thumb.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragStartY = e.clientY;
    dragStartScrollTop = mainArea.scrollTop;
    thumb.setPointerCapture(e.pointerId);
    track.classList.add('visible');
    clearTimeout(hideTimer);
  });

  thumb.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY;

    const trackHeight = track.clientHeight || window.innerHeight;
    const thumbHeight = thumb.clientHeight || 60;
    const availableTrack = trackHeight - thumbHeight;

    const scrollHeight = mainArea.scrollHeight;
    const clientHeight = mainArea.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    if (availableTrack > 0 && maxScroll > 0) {
      const scrollDelta = (deltaY / availableTrack) * maxScroll;
      mainArea.scrollTop = Math.min(maxScroll, Math.max(0, dragStartScrollTop + scrollDelta));
      updateThumbPosition();
    }
  });

  const stopDrag = () => {
    if (isDragging) {
      isDragging = false;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        track.classList.remove('visible');
      }, 1200);
    }
  };

  thumb.addEventListener('pointerup', stopDrag);
  thumb.addEventListener('pointercancel', stopDrag);
}

function setupTocGestureAndPanel() {
  const panel = document.querySelector('#toc-panel');
  const overlay = document.querySelector('#toc-overlay');
  const tocContent = document.querySelector('#toc-content');
  const globalToggleBtn = document.querySelector('#toc-global-toggle');
  if (!panel || !overlay) return;

  let isAllCollapsed = false;

  const openToc = () => {
    buildTocTree();
    panel.classList.add('open');
    overlay.classList.add('open');
  };

  const closeToc = () => {
    panel.classList.remove('open');
    overlay.classList.remove('open');
  };

  overlay.onclick = closeToc;

  if (globalToggleBtn) {
    globalToggleBtn.onclick = () => {
      isAllCollapsed = !isAllCollapsed;
      const itemRows = Array.from(tocContent.querySelectorAll('.toc-item'));
      itemRows.forEach(row => {
        const toggle = row.querySelector('.toc-toggle');
        const level = parseInt(row.dataset.level, 10) || 1;
        if (isAllCollapsed) {
          if (level > 1) row.style.display = 'none';
          if (toggle) toggle.textContent = '+';
        } else {
          row.style.display = 'flex';
          if (toggle) toggle.textContent = '-';
        }
      });
    };
  }

  // Touch Swipe Gesture Handling
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!isSwiping || e.changedTouches.length !== 1) return;
    isSwiping = false;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    const isSelectionActive = window.getSelection() && window.getSelection().toString().length > 0;
    if (!isSelectionActive && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && !panel.classList.contains('open')) {
        openToc();
      } else if (deltaX > 0 && panel.classList.contains('open')) {
        closeToc();
      }
    }
  }, { passive: true });

  function findActiveHeadingIndex(headings) {
    if (!headings || headings.length === 0) return -1;
    const mainArea = document.querySelector('.ck-editor__main');
    if (!mainArea) return 0;

    const viewportRect = mainArea.getBoundingClientRect();
    let activeIdx = 0;

    for (let i = 0; i < headings.length; i++) {
      const headingRect = headings[i].getBoundingClientRect();
      const relativeTop = headingRect.top - viewportRect.top;
      if (relativeTop <= 60) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }

  function buildTocTree() {
    if (!tocContent || !editorInstance) return;
    const editable = document.querySelector('.ck-content');
    if (!editable) return;

    const headings = Array.from(editable.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length === 0) {
      tocContent.innerHTML = '<div style="padding:16px;color:#888;font-size:14px;">No headings in document.</div>';
      return;
    }

    tocContent.innerHTML = '';
    const activeHeadingIdx = findActiveHeadingIndex(headings);

    const activePathIndices = new Set();
    if (activeHeadingIdx >= 0) {
      activePathIndices.add(activeHeadingIdx);
      let currLevel = parseInt(headings[activeHeadingIdx].tagName.substring(1), 10);
      for (let i = activeHeadingIdx - 1; i >= 0; i--) {
        const lvl = parseInt(headings[i].tagName.substring(1), 10);
        if (lvl < currLevel) {
          activePathIndices.add(i);
          currLevel = lvl;
        }
      }
    }

    headings.forEach((headingEl, index) => {
      const level = parseInt(headingEl.tagName.substring(1), 10) || 1;
      const titleText = headingEl.textContent.trim() || `Heading ${index + 1}`;

      const itemRow = document.createElement('div');
      itemRow.className = `toc-item level-${level}`;
      itemRow.dataset.level = level;
      itemRow.dataset.index = index;

      if (index === activeHeadingIdx) {
        itemRow.classList.add('active-section');
      }

      const hasSubHeadings = index < headings.length - 1 &&
        (parseInt(headings[index + 1].tagName.substring(1), 10) > level);

      const shouldBeExpanded = level === 1 || activePathIndices.has(index);

      let toggleBtn = null;
      if (hasSubHeadings) {
        toggleBtn = document.createElement('span');
        toggleBtn.className = 'toc-toggle';
        toggleBtn.textContent = shouldBeExpanded ? '-' : '+';
        itemRow.appendChild(toggleBtn);
      } else {
        const spacer = document.createElement('span');
        spacer.style.width = '40px';
        spacer.style.display = 'inline-block';
        itemRow.appendChild(spacer);
      }

      const textSpan = document.createElement('span');
      textSpan.className = 'toc-text';
      textSpan.textContent = titleText;
      itemRow.appendChild(textSpan);

      if (level > 1 && !activePathIndices.has(index)) {
        let parentIdx = -1;
        for (let i = index - 1; i >= 0; i--) {
          if (parseInt(headings[i].tagName.substring(1), 10) < level) {
            parentIdx = i;
            break;
          }
        }
        if (parentIdx !== -1 && !activePathIndices.has(parentIdx) && parseInt(headings[parentIdx].tagName.substring(1), 10) !== 1) {
          itemRow.style.display = 'none';
        }
      }

      itemRow.onclick = (e) => {
        if (toggleBtn && (e.target === toggleBtn || toggleBtn.contains(e.target))) {
          e.stopPropagation();
          const isCollapsed = toggleBtn.textContent === '+';
          toggleBtn.textContent = isCollapsed ? '-' : '+';

          let i = index + 1;
          while (i < headings.length) {
            const childLevel = parseInt(headings[i].tagName.substring(1), 10);
            if (childLevel <= level) break;
            const childRow = tocContent.children[i];
            if (childRow) {
              childRow.style.display = isCollapsed ? 'flex' : 'none';
            }
            i++;
          }
          return;
        }

        closeToc();
        setTimeout(() => {
          headingEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }, 150);
      };

      tocContent.appendChild(itemRow);
    });
  }
}

function toggleBottomToolbar() {
  const toggleBtn = document.querySelector('#floating-toggle-btn');
  isToolbarVisible = !isToolbarVisible;
  if (isToolbarVisible) {
    document.body.classList.remove('toolbar-hidden');
    if (toggleBtn) toggleBtn.innerHTML = '⟩';
  } else {
    document.body.classList.add('toolbar-hidden');
    if (toggleBtn) toggleBtn.innerHTML = '⟨';
  }
}

function setupFloatingToggle() {
  const toggleBtn = document.querySelector('#floating-toggle-btn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      toggleBottomToolbar();
    };
  }
}

function matchSingleHotkey(event, shortcutString) {
  if (!shortcutString || typeof shortcutString !== 'string') return false;
  const parts = shortcutString.toLowerCase().trim().split('+');
  const hasCtrl = parts.includes('ctrl') || parts.includes('control');
  const hasAlt = parts.includes('alt');
  const hasShift = parts.includes('shift');
  const keyPart = parts.find(p => p !== 'ctrl' && p !== 'control' && p !== 'alt' && p !== 'shift');

  const ctrlPressed = event.ctrlKey || event.metaKey;
  const altPressed = event.altKey;
  const shiftPressed = event.shiftKey;

  if (hasCtrl !== ctrlPressed) return false;
  if (hasAlt !== altPressed) return false;
  if (hasShift !== shiftPressed) return false;

  if (keyPart) {
    const keyLower = (event.key || '').toLowerCase();
    const codeLower = (event.code || '').toLowerCase();

    if (keyLower === keyPart) return true;
    if (codeLower === `key${keyPart}` || codeLower === keyPart) return true;
    if (keyPart === ',' && (keyLower === ',' || codeLower === 'comma')) return true;
    if (keyPart === '.' && (keyLower === '.' || codeLower === 'period')) return true;
    if (keyPart === 'tab' && (keyLower === 'tab' || codeLower === 'tab')) return true;

    if (hasShift) {
      if (keyPart === '8' && (keyLower === '*' || keyLower === '8')) return true;
      if (keyPart === '7' && (keyLower === '&' || keyLower === '7')) return true;
      if (keyPart === 'x' && (keyLower === 'x' || keyLower === 'X')) return true;
      if (keyPart === 'c' && (keyLower === 'c' || keyLower === 'C')) return true;
      if (keyPart === 'u' && (keyLower === 'u' || keyLower === 'U')) return true;
      if (keyPart === 'h' && (keyLower === 'h' || keyLower === 'H')) return true;
      if (keyPart === 'q' && (keyLower === 'q' || keyLower === 'Q')) return true;
      if (keyPart === 'i' && (keyLower === 'i' || keyLower === 'I')) return true;
      if (keyPart === 's' && (keyLower === 's' || keyLower === 'S')) return true;
      if (keyPart === 'l' && (keyLower === 'l' || keyLower === 'L')) return true;
      if (keyPart === 'w' && (keyLower === 'w' || keyLower === 'W')) return true;
      if (keyPart === 'r' && (keyLower === 'r' || keyLower === 'R')) return true;
      if (keyPart === 'g' && (keyLower === 'g' || keyLower === 'G')) return true;
    }
    return false;
  }
  return true;
}

function parseAndMatchHotkey(event, shortcutString) {
  if (!shortcutString || typeof shortcutString !== 'string') return false;
  const shortcuts = shortcutString.trim().split(/\s+/);
  return shortcuts.some(sc => matchSingleHotkey(event, sc));
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Actions
    if (parseAndMatchHotkey(e, customHotkeys.new)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('new');
    } else if (parseAndMatchHotkey(e, customHotkeys.open)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('open');
    } else if (parseAndMatchHotkey(e, customHotkeys.save_as)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('save_as');
    } else if (parseAndMatchHotkey(e, customHotkeys.save)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('save');
    } else if (parseAndMatchHotkey(e, customHotkeys.image)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('image');
    } else if (parseAndMatchHotkey(e, customHotkeys.settings)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('settings');
    } else if (parseAndMatchHotkey(e, customHotkeys.toggle_toolbar)) {
      e.preventDefault();
      toggleBottomToolbar();
    } else if (parseAndMatchHotkey(e, customHotkeys.line_wrap)) {
      e.preventDefault();
      window.editorBridge.toggleLineWrap();
    }

    // Formatting Commands
    else if (editorInstance) {
      const exec = (cmdName, options) => {
        e.preventDefault();
        try {
          editorInstance.execute(cmdName, options);
        } catch (err) {
          console.error(`Command ${cmdName} failed:`, err);
        }
      };

      if (parseAndMatchHotkey(e, customHotkeys.bold)) exec('bold');
      else if (parseAndMatchHotkey(e, customHotkeys.italic)) exec('italic');
      else if (parseAndMatchHotkey(e, customHotkeys.underline)) exec('underline');
      else if (parseAndMatchHotkey(e, customHotkeys.strikethrough)) exec('strikethrough');
      else if (parseAndMatchHotkey(e, customHotkeys.code)) exec('code');
      else if (parseAndMatchHotkey(e, customHotkeys.link)) exec('link');
      else if (parseAndMatchHotkey(e, customHotkeys.blockQuote)) exec('blockQuote');
      else if (parseAndMatchHotkey(e, customHotkeys.codeBlock)) exec('codeBlock');
      else if (parseAndMatchHotkey(e, customHotkeys.bulletedList)) exec('bulletedList');
      else if (parseAndMatchHotkey(e, customHotkeys.numberedList)) exec('numberedList');
      else if (parseAndMatchHotkey(e, customHotkeys.todoList)) exec('todoList');
      else if (parseAndMatchHotkey(e, customHotkeys.indent)) exec('indent');
      else if (parseAndMatchHotkey(e, customHotkeys.outdent)) exec('outdent');
      else if (parseAndMatchHotkey(e, customHotkeys.horizontalLine)) exec('horizontalLine');
      else if (parseAndMatchHotkey(e, customHotkeys.findAndReplace)) exec('findAndReplace');
      else if (parseAndMatchHotkey(e, customHotkeys.sourceEditing)) exec('sourceEditing');

      // Headings
      else if (parseAndMatchHotkey(e, customHotkeys.heading_p)) exec('heading', { value: 'paragraph' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_1)) exec('heading', { value: 'heading1' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_2)) exec('heading', { value: 'heading2' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_3)) exec('heading', { value: 'heading3' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_4)) exec('heading', { value: 'heading4' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_5)) exec('heading', { value: 'heading5' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_6)) exec('heading', { value: 'heading6' });

      // Highlight Markers
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_yellow)) exec('highlight', { value: 'yellowMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_green)) exec('highlight', { value: 'greenMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_pink)) exec('highlight', { value: 'pinkMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_blue)) exec('highlight', { value: 'blueMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_red)) exec('highlight', { value: 'redMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_remove)) exec('highlight', { value: null });
    }
  }, true);
}

// Global JS Bridge exposure
window.editorBridge = {
  getMarkdown: function() {
    if (!editorInstance) return '';
    return editorInstance.getData();
  },
  setMarkdown: function(markdownText) {
    if (!editorInstance) return;
    isProgrammaticChange = true;
    requestAnimationFrame(() => {
      editorInstance.setData(markdownText || '');
      setTimeout(() => { isProgrammaticChange = false; }, 50);
    });
  },
  toggleLineWrap: function() {
    isLineWrapEnabled = !isLineWrapEnabled;
    window.editorBridge.setLineWrap(isLineWrapEnabled);
    if (window.AndroidNative && typeof window.AndroidNative.showToast === 'function') {
      window.AndroidNative.showToast(isLineWrapEnabled ? 'Line wrap enabled' : 'Line wrap disabled');
    }
  },
  setLineWrap: function(enabled) {
    isLineWrapEnabled = !!enabled;
    if (isLineWrapEnabled) {
      document.body.classList.remove('no-line-wrap');
    } else {
      document.body.classList.add('no-line-wrap');
    }
  },
  setHeadingColors: function(h1, h2, h3, h4, h5, h6) {
    const colors = [h1, h2, h3, h4, h5, h6];
    colors.forEach((col, idx) => {
      const varName = `--heading-${idx + 1}-color`;
      if (col && col !== 'default') {
        document.documentElement.style.setProperty(varName, col);
      } else {
        document.documentElement.style.removeProperty(varName);
      }
    });
  },
  getSnapshotDataUrl: function() {
    return new Promise((resolve) => {
      try {
        const contentEl = document.querySelector('.ck-content');
        if (!contentEl) return resolve('');

        const rect = contentEl.getBoundingClientRect();
        const width = Math.max(rect.width || 600, 400);
        const height = Math.max(rect.height || 800, 300);

        const isDark = !document.body.classList.contains('light-theme');
        const bgColor = isDark ? '#000000' : '#ffffff';
        const textColor = isDark ? '#ffffff' : '#111111';

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        const htmlString = `<div xmlns="http://www.w3.org/1999/xhtml" style="background-color:${bgColor};color:${textColor};font-family:sans-serif;font-size:16px;line-height:1.6;padding:12px;">${contentEl.innerHTML}</div>`;
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${htmlString}</foreignObject></svg>`;

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          resolve('');
        };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      } catch (e) {
        console.error('Snapshot error:', e);
        resolve('');
      }
    });
  },
  setHotkeys: function(hotkeysJson) {
    if (!hotkeysJson) return;
    try {
      const parsed = typeof hotkeysJson === 'string' ? JSON.parse(hotkeysJson) : hotkeysJson;
      Object.assign(customHotkeys, parsed);
    } catch (e) {
      console.error('Failed to set hotkeys:', e);
    }
  },
  getSelectionState: function() {
    if (!editorInstance) return { path: [], offset: 0 };
    try {
      const selection = editorInstance.model.document.selection;
      const range = selection.getFirstRange();
      if (range && range.start) {
        return {
          path: range.start.path ? Array.from(range.start.path) : [],
          offset: range.start.offset || 0
        };
      }
    } catch (e) {
      console.error('Error getting selection state:', e);
    }
    return { path: [], offset: 0 };
  },
  setSelectionState: function(stateJson, scrollTop) {
    if (!editorInstance) return;
    isProgrammaticChange = true;
    try {
      if (stateJson) {
        let state = typeof stateJson === 'string' ? JSON.parse(stateJson) : stateJson;
        if (typeof state === 'string') {
          state = JSON.parse(state);
        }
        if (state && Array.isArray(state.path) && state.path.length > 0) {
          const doc = editorInstance.model.document;
          const root = doc.getRoot();
          let curr = root;
          let safePath = [];
          for (let i = 0; i < state.path.length; i++) {
            const isLast = (i === state.path.length - 1);
            const requestedIdx = state.path[i];
            if (isLast) {
              const maxOff = curr.maxOffset !== undefined ? curr.maxOffset : (curr.childCount || 0);
              const safeOff = Math.min(Math.max(0, requestedIdx), maxOff);
              safePath.push(safeOff);
            } else {
              if (curr.childCount > 0) {
                const safeIdx = Math.min(Math.max(0, requestedIdx), curr.childCount - 1);
                safePath.push(safeIdx);
                curr = curr.getChild(safeIdx);
              } else {
                safePath.push(0);
              }
            }
          }
          const position = editorInstance.model.createPositionFromPath(root, safePath);
          if (position) {
            editorInstance.model.change(writer => {
              writer.setSelection(position);
            });
          }
        }
      }
    } catch (e) {
      console.error('Error restoring selection state:', e);
    }
    if (typeof scrollTop === 'number' && scrollTop >= 0) {
      setTimeout(() => {
        const mainEditingArea = document.querySelector('.ck-editor__main');
        if (mainEditingArea) {
          mainEditingArea.scrollTop = scrollTop;
        }
      }, 50);
    }
  },
  insertImage: function(imageUrl, altText = '') {
    if (!editorInstance) return;
    editorInstance.execute('insertImage', { source: imageUrl, alt: altText });
  },
  setTheme: function(themeName) {
    if (themeName === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  },
  setDocumentTitle: function(title) {
    const titleEl = document.querySelector('#file-title');
    if (titleEl) {
      titleEl.textContent = title;
    }
  },
  setFontSettings: function(bodyFontSizePx, headingScale, boldColor, italicColor, linkColor, codeColor, codeBgColor, codeBlockColor, codeBlockBgColor, fontBodyData, fontHeadingData, fontBoldData, fontItalicData, fontCodeData, fontWeightBold, fontWeightItalic, fontWeightHeading) {
    const setCssVar = (varName, val) => {
      if (val && val !== 'default') {
        document.documentElement.style.setProperty(varName, val);
      } else {
        document.documentElement.style.removeProperty(varName);
      }
    };

    if (bodyFontSizePx) {
      document.documentElement.style.setProperty('--body-font-size', bodyFontSizePx + 'px');
    }
    if (headingScale) {
      document.documentElement.style.setProperty('--heading-scale', headingScale);
    }
    if (fontWeightBold) {
      document.documentElement.style.setProperty('--bold-font-weight', fontWeightBold);
    }
    if (fontWeightItalic) {
      document.documentElement.style.setProperty('--italic-font-weight', fontWeightItalic);
    }
    if (fontWeightHeading) {
      document.documentElement.style.setProperty('--heading-font-weight', fontWeightHeading);
    }
    setCssVar('--bold-color', boldColor);
    setCssVar('--italic-color', italicColor);
    setCssVar('--link-color', linkColor);
    setCssVar('--code-color', codeColor);
    setCssVar('--code-bg-color', codeBgColor);
    setCssVar('--code-block-color', codeBlockColor);
    setCssVar('--code-block-bg-color', codeBlockBgColor);

    let styleEl = document.querySelector('#custom-fonts-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-fonts-style';
      document.head.appendChild(styleEl);
    }

    let fontCss = '';
    const applyFontCategory = (categoryName, fontData, cssVarName) => {
      if (fontData && fontData.length > 10) {
        const familyName = `CustomFont_${categoryName}`;
        fontCss += `
          @font-face {
            font-family: '${familyName}';
            src: url('${fontData}');
          }
          .ck-content {
            --custom-${categoryName.toLowerCase()}-font: '${familyName}';
          }
        `;
        document.documentElement.style.setProperty(cssVarName, `'${familyName}'`);
      } else {
        document.documentElement.style.removeProperty(cssVarName);
      }
    };

    applyFontCategory('Body', fontBodyData, '--body-font-family');
    applyFontCategory('Heading', fontHeadingData, '--heading-font-family');
    applyFontCategory('Bold', fontBoldData, '--bold-font-family');
    applyFontCategory('Italic', fontItalicData, '--italic-font-family');
    applyFontCategory('Code', fontCodeData, '--code-font-family');

    styleEl.innerHTML = fontCss;
  },
  setHrSettings: function(thicknessPx, colorHex, widthPercent) {
    if (thicknessPx) {
      document.documentElement.style.setProperty('--hr-thickness', thicknessPx + 'px');
    }
    if (colorHex && colorHex !== 'default') {
      document.documentElement.style.setProperty('--hr-color', colorHex);
    } else {
      document.documentElement.style.removeProperty('--hr-color');
    }
    if (widthPercent) {
      document.documentElement.style.setProperty('--hr-width', widthPercent + '%');
    }
  },
  setTypographySettings: function(justifyParagraph, paragraphLineHeight, letterSpacing) {
    document.documentElement.style.setProperty('--paragraph-justify', justifyParagraph ? 'justify' : 'left');
    if (paragraphLineHeight && paragraphLineHeight !== 'default') {
      document.documentElement.style.setProperty('--paragraph-line-height', paragraphLineHeight);
    } else {
      document.documentElement.style.removeProperty('--paragraph-line-height');
    }
    if (letterSpacing && letterSpacing !== 'default') {
      document.documentElement.style.setProperty('--letter-spacing', letterSpacing);
    } else {
      document.documentElement.style.removeProperty('--letter-spacing');
    }
  },
  setBlockquoteAndCalloutSettings: function(bqThicknessPx, bqColorHex, calloutThicknessPx, calloutColorHex) {
    if (bqThicknessPx) {
      document.documentElement.style.setProperty('--blockquote-border-width', bqThicknessPx + 'px');
    }
    if (bqColorHex && bqColorHex !== 'default') {
      document.documentElement.style.setProperty('--blockquote-border-color', bqColorHex);
    } else {
      document.documentElement.style.removeProperty('--blockquote-border-color');
    }
    if (calloutThicknessPx) {
      document.documentElement.style.setProperty('--callout-border-width', calloutThicknessPx + 'px');
    }
    if (calloutColorHex && calloutColorHex !== 'default') {
      document.documentElement.style.setProperty('--callout-border-color', calloutColorHex);
    } else {
      document.documentElement.style.removeProperty('--callout-border-color');
    }
  },
  configurePlugins: function(disabledPluginsJson) {
    let disabledPlugins = [];
    try {
      if (typeof disabledPluginsJson === 'string') {
        disabledPlugins = JSON.parse(disabledPluginsJson);
      } else if (Array.isArray(disabledPluginsJson)) {
        disabledPlugins = disabledPluginsJson;
      }
    } catch (e) {
      console.error('Invalid disabledPlugins JSON:', e);
    }

    const currentDisabledStr = JSON.stringify(disabledPlugins.sort());
    if (window._lastDisabledPluginsStr === currentDisabledStr && editorInstance) {
      return;
    }
    window._lastDisabledPluginsStr = currentDisabledStr;

    const currentText = window.editorBridge.getMarkdown();
    const currentState = window.editorBridge.getSelectionState();
    const mainEditingArea = document.querySelector('.ck-editor__main');
    const scrollTop = mainEditingArea ? mainEditingArea.scrollTop : 0;

    isProgrammaticChange = true;
    initEditor(disabledPlugins).then(() => {
      if (currentText) {
        editorInstance.setData(currentText);
      }
      if (currentState) {
        window.editorBridge.setSelectionState(currentState, scrollTop);
      }
      setTimeout(() => { isProgrammaticChange = false; }, 50);
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  initEditor([], true);
});
