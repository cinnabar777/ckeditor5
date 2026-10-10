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
  Font
} from 'ckeditor5';

import '../../../packages/ckeditor5-editor-classic/theme/classiceditor.css';
import '../../../packages/ckeditor5-ui/theme/index-editor.css';

let editorInstance = null;
let currentConfig = null;
let isProgrammaticChange = false;
let isToolbarExpanded = false;

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
    Markdown
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

    // Inject App Action Buttons and Toggle Button into Bottom Toolbar
    const toolbarItemsContainer = document.querySelector('.ck-toolbar__items');
    if (toolbarItemsContainer) {
      if (!document.querySelector('.toolbar-app-actions')) {
        const actionStrip = document.createElement('div');
        actionStrip.className = 'toolbar-app-actions';
        actionStrip.innerHTML = `
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('new')">New</button>
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('open')">Open</button>
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save')">Save</button>
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('save_as')">Save As</button>
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('image')">Image</button>
          <button class="toolbar-app-btn" onclick="window.AndroidNative && window.AndroidNative.onNativeAction('settings')">⚙</button>
        `;
        toolbarItemsContainer.prepend(actionStrip);
      }

      if (!document.querySelector('.toolbar-toggle-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'toolbar-toggle-btn';
        toggleBtn.innerHTML = '⟨';
        toggleBtn.title = 'Toggle Toolbar';
        toggleBtn.onclick = () => {
          isToolbarExpanded = !isToolbarExpanded;
          if (isToolbarExpanded) {
            toolbarItemsContainer.classList.remove('toolbar-items-collapsed');
            toggleBtn.innerHTML = '⟩';
          } else {
            toolbarItemsContainer.classList.add('toolbar-items-collapsed');
            toggleBtn.innerHTML = '⟨';
          }
        };
        toolbarItemsContainer.appendChild(toggleBtn);
      }

      // Initial collapsed state
      toolbarItemsContainer.classList.add('toolbar-items-collapsed');
    }

    if (isInitialInit && window.AndroidNative && typeof window.AndroidNative.onEditorReady === 'function') {
      window.AndroidNative.onEditorReady();
    }
  } catch (error) {
    console.error('Failed to initialize CKEditor 5:', error);
  }
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
  setFontSettings: function(bodyFontSizePx, headingScale, boldColor, italicColor) {
    if (bodyFontSizePx) {
      document.documentElement.style.setProperty('--body-font-size', bodyFontSizePx + 'px');
    }
    if (headingScale) {
      document.documentElement.style.setProperty('--heading-scale', headingScale);
    }
    if (boldColor && boldColor !== 'default') {
      document.documentElement.style.setProperty('--bold-color', boldColor);
    } else {
      document.documentElement.style.setProperty('--bold-color', 'inherit');
    }
    if (italicColor && italicColor !== 'default') {
      document.documentElement.style.setProperty('--italic-color', italicColor);
    } else {
      document.documentElement.style.setProperty('--italic-color', 'inherit');
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
