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

function setupFloatingToggle() {
  const toggleBtn = document.querySelector('#floating-toggle-btn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      isToolbarVisible = !isToolbarVisible;
      if (isToolbarVisible) {
        document.body.classList.remove('toolbar-hidden');
        toggleBtn.innerHTML = '⟩';
      } else {
        document.body.classList.add('toolbar-hidden');
        toggleBtn.innerHTML = '⟨';
      }
    };
  }
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'n') {
        e.preventDefault();
        window.AndroidNative && window.AndroidNative.onNativeAction('new');
      } else if (key === 'o') {
        e.preventDefault();
        window.AndroidNative && window.AndroidNative.onNativeAction('open');
      } else if (key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          window.AndroidNative && window.AndroidNative.onNativeAction('save_as');
        } else {
          window.AndroidNative && window.AndroidNative.onNativeAction('save');
        }
      } else if (key === 'i' && e.shiftKey) {
        e.preventDefault();
        window.AndroidNative && window.AndroidNative.onNativeAction('image');
      }
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
  setFontSettings: function(bodyFontSizePx, headingScale, boldColor, italicColor, linkColor, codeColor, codeBgColor, codeBlockColor, codeBlockBgColor) {
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
    const currentText = window.editorBridge.getMarkdown();
    isProgrammaticChange = true;
    initEditor(disabledPlugins).then(() => {
      if (currentText) {
        editorInstance.setData(currentText);
      }
      setTimeout(() => { isProgrammaticChange = false; }, 50);
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  initEditor([], true);
});
