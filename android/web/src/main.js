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
  PasteFromOffice
} from 'ckeditor5';

import '../../../packages/ckeditor5-editor-classic/theme/classiceditor.css';
import '../../../packages/ckeditor5-ui/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-content.css';

let editorInstance = null;
let isProgrammaticChange = false;
let isToolbarVisible = false;
let customHotkeys = {
  new: 'ctrl+n',
  open: 'ctrl+o',
  save: 'ctrl+s',
  save_as: 'ctrl+shift+s',
  image: 'ctrl+shift+i',
  settings: 'ctrl+,',
  toggle_toolbar: 'ctrl+t',
  bold: 'ctrl+b',
  italic: 'ctrl+i',
  strikethrough: 'ctrl+shift+x',
  code: 'ctrl+e',
  link: 'ctrl+k',
  blockQuote: 'ctrl+shift+q',
  codeBlock: 'ctrl+shift+c',
  bulletedList: 'ctrl+shift+8',
  numberedList: 'ctrl+shift+7',
  todoList: 'ctrl+shift+l',
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
  highlight_remove: 'ctrl+alt+r'
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
  if (toolbarItems.length > 0 && toolbarItems[toolbarItems.length - 1] !== '|') {
    toolbarItems.push('|');
  }

  addIfEnabled('horizontalLine', HorizontalLine, 'horizontalLine');
  addIfEnabled('sourceEditing', SourceEditing, 'sourceEditing');
  addIfEnabled('findAndReplace', FindAndReplace, 'findAndReplace');

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
        window.AndroidNative.onContentChanged();
      }
    });

    // Save Selection / Scroll State Changes
    editorInstance.model.document.selection.on('change:range', () => {
      if (!isProgrammaticChange && window.AndroidNative && typeof window.AndroidNative.onSelectionChanged === 'function') {
        const state = window.editorBridge.getSelectionState();
        window.AndroidNative.onSelectionChanged(JSON.stringify(state));
      }
    });

    const mainEditingArea = document.querySelector('.ck-editor__main');
    if (mainEditingArea) {
      mainEditingArea.addEventListener('scroll', () => {
        if (!isProgrammaticChange && window.AndroidNative && typeof window.AndroidNative.onScrollChanged === 'function') {
          window.AndroidNative.onScrollChanged(mainEditingArea.scrollTop);
        }
      });
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
            <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('new')">New</button>
            <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('open')">Open</button>
            <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save')">Save</button>
            <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save_as')">Save As</button>
            <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('image')">Image</button>
            <button class="toolbar-app-btn settings-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('settings')">⚙</button>
          </div>
        `;
        topContainer.prepend(headerRow);
      }
    }

    // Synchronize cursor & scroll between WYSIWYG View and Source Editing View
    const sourceEditingPlugin = editorInstance.plugins.get('SourceEditing');
    if (sourceEditingPlugin) {
      sourceEditingPlugin.on('change:isSourceEditingMode', (evt, propertyName, isSourceEditing) => {
        if (isSourceEditing) {
          // Entering Source Editing Mode
          try {
            const selection = editorInstance.model.document.selection;
            const range = selection.getFirstRange();
            let charOffset = 0;
            if (range) {
              const root = editorInstance.model.document.getRoot();
              const fullRange = editorInstance.model.createRangeIn(root);
              for (const value of fullRange.getWalker({ shallow: false })) {
                if (value.previousPosition && value.previousPosition.isEqual(range.start)) {
                  break;
                }
                if (value.item && value.item.is && value.item.is('$text')) {
                  charOffset += value.item.data ? value.item.data.length : 0;
                } else if (value.type === 'elementEnd') {
                  charOffset += 1; // newline or element boundary
                }
              }
            }

            setTimeout(() => {
              const textarea = document.querySelector('.ck-source-editing-area textarea');
              if (textarea) {
                const targetOffset = Math.min(charOffset, textarea.value.length);
                textarea.focus();
                textarea.setSelectionRange(targetOffset, targetOffset);

                // Scroll textarea so cursor is visible
                const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight, 10) || 20;
                const linesBeforeCursor = textarea.value.substring(0, targetOffset).split('\n').length;
                textarea.scrollTop = Math.max(0, (linesBeforeCursor - 3) * lineHeight);
              }
            }, 50);
          } catch (e) {
            console.error('Error syncing cursor to Source View:', e);
          }
        } else {
          // Exiting Source Editing Mode back to WYSIWYG Mode
          setTimeout(() => {
            const mainEditingArea = document.querySelector('.ck-editor__main');
            if (mainEditingArea) {
              const selection = editorInstance.model.document.selection;
              const range = selection.getFirstRange();
              if (range) {
                const domConverter = editorInstance.editing.view.domConverter;
                const viewRange = editorInstance.editing.mapper.toViewRange(range);
                if (viewRange) {
                  const domRange = domConverter.viewRangeToDom(viewRange);
                  if (domRange && domRange.startContainer) {
                    const el = domRange.startContainer.nodeType === Node.ELEMENT_NODE
                      ? domRange.startContainer
                      : domRange.startContainer.parentElement;
                    if (el && el.scrollIntoView) {
                      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                  }
                }
              }
            }
          }, 50);
        }
      });
    }

    if (isInitialInit) {
      setupFloatingToggle();
      setupKeyboardShortcuts();
      if (window.AndroidNative && typeof window.AndroidNative.onEditorReady === 'function') {
        window.AndroidNative.onEditorReady();
      }
    }
  } catch (error) {
    console.error('Failed to initialize CKEditor 5:', error);
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

function parseAndMatchHotkey(event, shortcutString) {
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
    return event.key.toLowerCase() === keyPart;
  }
  return true;
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
      else if (parseAndMatchHotkey(e, customHotkeys.strikethrough)) exec('strikethrough');
      else if (parseAndMatchHotkey(e, customHotkeys.code)) exec('code');
      else if (parseAndMatchHotkey(e, customHotkeys.link)) exec('link');
      else if (parseAndMatchHotkey(e, customHotkeys.blockQuote)) exec('blockQuote');
      else if (parseAndMatchHotkey(e, customHotkeys.codeBlock)) exec('codeBlock');
      else if (parseAndMatchHotkey(e, customHotkeys.bulletedList)) exec('bulletedList');
      else if (parseAndMatchHotkey(e, customHotkeys.numberedList)) exec('numberedList');
      else if (parseAndMatchHotkey(e, customHotkeys.todoList)) exec('todoList');
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
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_remove)) exec('highlight', { value: null });
    }
  });
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
    editorInstance.setData(markdownText || '');
    setTimeout(() => { isProgrammaticChange = false; }, 50);
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
      if (range) {
        const start = range.start;
        return {
          path: start.path || [],
          offset: start.offset || 0
        };
      }
    } catch (e) {
      console.error('Error getting selection state:', e);
    }
    return { path: [], offset: 0 };
  },
  setSelectionState: function(stateJson, scrollTop) {
    if (!editorInstance) return;
    try {
      if (stateJson) {
        const state = typeof stateJson === 'string' ? JSON.parse(stateJson) : stateJson;
        if (state && Array.isArray(state.path)) {
          const doc = editorInstance.model.document;
          const root = doc.getRoot();
          const position = editorInstance.model.createPositionFromPath(root, state.path);
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
    if (typeof scrollTop === 'number' && scrollTop > 0) {
      setTimeout(() => {
        const mainEditingArea = document.querySelector('.ck-editor__main');
        if (mainEditingArea) {
          mainEditingArea.scrollTop = scrollTop;
        }
      }, 100);
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
  setFontSettings: function(bodyFontSizePx, headingScale, boldColor, italicColor, linkColor, codeColor, codeBgColor, codeBlockColor, codeBlockBgColor, fontBodyData, fontHeadingData, fontBoldData, fontItalicData, fontCodeData) {
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

    // Check if plugin list actually changed to avoid re-initializing editor when returning from settings
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
