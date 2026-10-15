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
  ImageBlock,
  ImageInline,
  MediaEmbed,
  HorizontalLine,
  FindAndReplace,
  FindAndReplaceEditing,
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

import { Footnotes } from '@tomaitken/ckeditor5-footnotes';

import '../../../packages/ckeditor5-editor-classic/theme/classiceditor.css';
import '../../../packages/ckeditor5-ui/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-editor.css';
import '../../../packages/ckeditor5-highlight/theme/index-content.css';
import '../../../node_modules/@tomaitken/ckeditor5-footnotes/dist/index-editor.css';

let editorInstance = null;
let isProgrammaticChange = false;
let isToolbarVisible = false;
let isLineWrapEnabled = true;
let activePopupGroup = null;

let customHotkeys = {
  new: 'ctrl+n',
  open: 'ctrl+o',
  save: 'ctrl+s',
  save_as: 'ctrl+shift+s',
  export: 'ctrl+shift+e',
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
  footnote: 'ctrl+shift+f',
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
  highlight_red_pen: 'ctrl+alt+r',
  highlight_green_pen: 'ctrl+alt+shift+g',
  highlight_remove: 'ctrl+alt+x'
};

// Clean SVG stroke line icon definitions
const svgIcons = {
  undo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  redo: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
  paragraph: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>`,
  lists: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  format: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  table: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/></svg>`,
  insertTable: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M12 3v18"/><path d="M16 16h4m-2-2v4"/></svg>`,
  addColumn: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M16 12h4m-2-2v4"/></svg>`,
  addRow: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18"/><path d="M12 16v4m-2-2h4"/></svg>`,
  mergeCells: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8m-3-3l3 3-3 3"/></svg>`,
  insert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
  wrap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 21 6"/><path d="M3 12h15a3 3 0 0 1 0 6h-4"/><polyline points="16 16 14 18 16 20"/></svg>`,
  bold: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  italic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  strikethrough: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`,
  inlineCode: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/><line x1="14" y1="4" x2="10" y2="20"/></svg>`,
  codeBlock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 9l-2 3 2 3"/><path d="M12 9l2 3-2 3"/></svg>`,
  link: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  image: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  blockQuote: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  horizontalLine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  bulletedList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
  numberedList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
  todoList: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  indent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 10 7 14 3 18"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg>`,
  outdent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 10 3 14 7 18"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="18" x2="11" y2="18"/></svg>`,
  newFile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>`,
  openFile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  saveFile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  saveAsFile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/><path d="M12 10v4m-2-2h4"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  sourceEditing: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="12" y1="20" x2="12" y2="4"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  newWindow: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  footnote: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M4 15h16"/><path d="M9 11V5h6v6"/><path d="M9 8h6"/></svg>`,
  squareMarker: (color) => `<svg width="18" height="18" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="${color}"/></svg>`,
  circlePen: (color) => `<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${color}"/></svg>`
};

let searchState = {
  matchCase: false,
  wholeWords: false,
  useRegex: false,
  showReplace: false
};

function addLongPressToast(btn, message) {
  if (!btn) return;
  let timer = null;
  let isLongPress = false;

  const showToastMsg = () => {
    if (window.AndroidNative && typeof window.AndroidNative.showToast === 'function') {
      window.AndroidNative.showToast(message);
    }
  };

  btn.addEventListener('pointerdown', (e) => {
    isLongPress = false;
    clearTimeout(timer);
    timer = setTimeout(() => {
      isLongPress = true;
      showToastMsg();
    }, 450);
  });

  const cancelTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  btn.addEventListener('pointerup', cancelTimer);
  btn.addEventListener('pointercancel', cancelTimer);

  btn.addEventListener('click', (e) => {
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      isLongPress = false;
      return false;
    }
  }, true);

  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
}

function initCustomSearchBar() {
  const container = document.querySelector('#custom-search-bar');
  if (!container) return;

  const searchInput = container.querySelector('#search-input');
  const replaceInput = container.querySelector('#replace-input');
  const counter = container.querySelector('#search-counter');
  const btnPrev = container.querySelector('#search-btn-prev');
  const btnNext = container.querySelector('#search-btn-next');
  const btnHighlight = container.querySelector('#search-btn-highlight');
  const btnRegex = container.querySelector('#search-btn-regex');
  const btnClose = container.querySelector('#search-btn-close');
  const btnReplaceOne = container.querySelector('#search-btn-replace-one');
  const btnReplaceAll = container.querySelector('#search-btn-replace-all');
  const btnCase = container.querySelector('#search-btn-case');
  const btnWord = container.querySelector('#search-btn-word');

  addLongPressToast(btnPrev, 'Find Previous');
  addLongPressToast(btnNext, 'Find Next');
  addLongPressToast(btnHighlight, 'Highlight All Instances');
  addLongPressToast(btnRegex, 'Regular Expression');
  addLongPressToast(btnClose, 'Close Search');
  addLongPressToast(btnReplaceOne, 'Replace One');
  addLongPressToast(btnReplaceAll, 'Replace All');
  addLongPressToast(btnCase, 'Match Case');
  addLongPressToast(btnWord, 'Match Whole Word');

  const executeSearch = () => {
    if (!editorInstance) return;
    const query = searchInput.value || '';
    if (!query) {
      counter.textContent = '';
      try {
        const findEditing = editorInstance.plugins.get('FindAndReplaceEditing');
        if (findEditing && findEditing.state) {
          findEditing.state.clear(editorInstance.model);
        }
      } catch (e) {}
      return;
    }

    try {
      if (searchState.useRegex) {
        const flags = searchState.matchCase ? 'g' : 'gi';
        const reg = new RegExp(query, flags);
        const findCallback = ({ text }) => {
          const matches = [...text.matchAll(reg)];
          return matches.map(m => ({
            label: m[0],
            start: m.index,
            end: m.index + m[0].length
          }));
        };
        editorInstance.execute('find', findCallback);
      } else {
        editorInstance.execute('find', query, {
          matchCase: searchState.matchCase,
          wholeWords: searchState.wholeWords
        });
      }

      updateSearchCounter();
    } catch (e) {
      if (window.AndroidNative && typeof window.AndroidNative.showToast === 'function') {
        window.AndroidNative.showToast('Invalid Regex pattern');
      }
    }
  };

  const updateSearchCounter = () => {
    if (!editorInstance) return;
    try {
      const findEditing = editorInstance.plugins.get('FindAndReplaceEditing');
      if (findEditing && findEditing.state) {
        const total = findEditing.state.results ? findEditing.state.results.length : 0;
        const current = findEditing.state.highlightedOffset || (total > 0 ? 1 : 0);
        counter.textContent = total > 0 ? `${current}/${total}` : '0/0';
      }
    } catch (e) {}
  };

  searchInput.addEventListener('input', executeSearch);

  btnHighlight.onclick = () => {
    const isActive = btnHighlight.classList.toggle('active');
    if (!isActive) {
      try {
        const findEditing = editorInstance.plugins.get('FindAndReplaceEditing');
        if (findEditing && findEditing.state) {
          findEditing.state.clear(editorInstance.model);
        }
      } catch (e) {}
    } else {
      executeSearch();
    }
  };

  btnCase.onclick = () => {
    searchState.matchCase = !searchState.matchCase;
    btnCase.classList.toggle('active', searchState.matchCase);
    executeSearch();
  };

  btnWord.onclick = () => {
    searchState.wholeWords = !searchState.wholeWords;
    btnWord.classList.toggle('active', searchState.wholeWords);
    executeSearch();
  };

  btnRegex.onclick = () => {
    searchState.useRegex = !searchState.useRegex;
    btnRegex.classList.toggle('active', searchState.useRegex);
    executeSearch();
  };

  btnPrev.onclick = () => {
    if (editorInstance) {
      editorInstance.execute('findPrevious');
      updateSearchCounter();
    }
  };

  btnNext.onclick = () => {
    if (editorInstance) {
      editorInstance.execute('findNext');
      updateSearchCounter();
    }
  };

  btnClose.onclick = () => {
    toggleFindAndReplaceBar(false);
  };

  btnReplaceOne.onclick = () => {
    if (editorInstance) {
      editorInstance.execute('replace', replaceInput.value || '');
      updateSearchCounter();
    }
  };

  btnReplaceAll.onclick = () => {
    if (editorInstance) {
      editorInstance.execute('replaceAll', replaceInput.value || '', searchInput.value || '');
      updateSearchCounter();
    }
  };
}

function toggleFindAndReplaceBar(forceState) {
  const container = document.querySelector('#custom-search-bar');
  if (!container) return;

  const newState = forceState !== undefined ? forceState : container.classList.contains('hidden');
  if (newState) {
    container.classList.remove('hidden');
    const input = container.querySelector('#search-input');
    if (input) {
      input.focus();
      input.select();
    }
  } else {
    container.classList.add('hidden');
    if (editorInstance) {
      try {
        const findEditing = editorInstance.plugins.get('FindAndReplaceEditing');
        if (findEditing && findEditing.state) {
          findEditing.state.clear(editorInstance.model);
        }
      } catch (e) {}
    }
  }
}

function insertCodeBlockPrompt() {
  if (!editorInstance) return;
  const languages = [
    { label: 'Plain text', value: 'plaintext' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'Kotlin', value: 'kotlin' },
    { label: 'C++', value: 'cpp' },
    { label: 'C#', value: 'cs' },
    { label: 'C', value: 'c' },
    { label: 'JSON', value: 'json' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'SQL', value: 'sql' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'XML', value: 'xml' },
    { label: 'YAML', value: 'yaml' }
  ];

  const popupItems = languages.map(lang => ({
    icon: lang.label,
    title: lang.label,
    action: () => {
      hidePopupStrip();
      try {
        editorInstance.execute('codeBlock', { language: lang.value });
      } catch (e) {
        editorInstance.execute('codeBlock');
      }
    }
  }));

  const insertBtn = document.querySelector('#grp-btn-insert');
  togglePopupStrip('codeBlockLang', insertBtn, popupItems);
}

function insertLinkPrompt() {
  if (!editorInstance) return;
  try {
    const linkBtn = editorInstance.ui.componentFactory.create('link');
    if (linkBtn) linkBtn.fire('execute');
  } catch (err) {
    console.error('Failed to execute link UI:', err);
  }
}

function toggleSourceEditing() {
  if (!editorInstance) return;
  try {
    const sourceEditing = editorInstance.plugins.get('SourceEditing');
    if (sourceEditing) {
      sourceEditing.isSourceEditingMode = !sourceEditing.isSourceEditingMode;
    }
  } catch (err) {
    console.error('Failed to toggle SourceEditing:', err);
  }
}

function setupMarkdownFootnotesProcessor(editor) {
  if (!editor || !editor.data || !editor.data.processor) return;
  const processor = editor.data.processor;

  const originalToView = processor.toView.bind(processor);
  const originalToData = processor.toData.bind(processor);

  processor.toView = function(data) {
    if (typeof data !== 'string') return originalToView(data);

    // Extract footnote definitions: [^id]: text
    const footnoteDefRegex = /^\[\^([^\]]+)\]:\s*([\s\S]*?)(?=(?:\n\[\^[^\]]+\]:)|$)/gm;
    const definitions = [];

    let cleanMarkdown = data.replace(footnoteDefRegex, (fullMatch, id, text) => {
      definitions.push({ id, text: text.trim() });
      return '';
    }).trim();

    if (definitions.length > 0) {
      // Replace inline references [^id]
      definitions.forEach((def, idx) => {
        const indexNum = idx + 1;
        const refRegex = new RegExp(`\\[\\^${def.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
        cleanMarkdown = cleanMarkdown.replace(refRegex, `<sup data-footnote-reference data-footnote-id="${def.id}" data-footnote-index="${indexNum}"><a href="#fn${def.id}" id="fnref${def.id}">${indexNum}</a></sup>`);
      });

      // Construct footnote section HTML
      let sectionHtml = `<ol data-footnote-section class="footnote-section footnotes" role="doc-endnotes">`;
      definitions.forEach((def, idx) => {
        const indexNum = idx + 1;
        sectionHtml += `<li data-footnote-item data-footnote-id="${def.id}" data-footnote-index="${indexNum}"><div data-footnote-content><p>${def.text}</p></div><span data-footnote-back-link data-footnote-id="${def.id}"><sup><strong><a href="#fnref${def.id}">^</a></strong></sup></span></li>`;
      });
      sectionHtml += `</ol>`;

      cleanMarkdown += '\n\n' + sectionHtml;
    }

    return originalToView(cleanMarkdown);
  };

  processor.toData = function(viewFragment) {
    let markdown = originalToData(viewFragment);
    if (typeof markdown !== 'string') return markdown;

    // Convert inline footnote reference tags to [^N]
    markdown = markdown.replace(/<sup[^>]*data-footnote-reference[^>]*data-footnote-index="([^"]+)"[^>]*>[\s\S]*?<\/sup>/gi, '[^$1]');
    markdown = markdown.replace(/<sup[^>]*data-footnote-index="([^"]+)"[^>]*data-footnote-reference[^>]*>[\s\S]*?<\/sup>/gi, '[^$1]');

    // Extract footnote section HTML
    const sectionMatch = markdown.match(/<(ol|div)[^>]*data-footnote-section[^>]*>([\s\S]*?)<\/\1>/i);
    if (sectionMatch) {
      const sectionHtml = sectionMatch[2];
      const items = [];
      const itemRegex = /<li[^>]*data-footnote-id="([^"]+)"[^>]*data-footnote-index="([^"]+)"[^>]*>([\s\S]*?)<\/li>/gi;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(sectionHtml)) !== null) {
        const fnId = itemMatch[1];
        const fnIndex = itemMatch[2];
        const itemContentHtml = itemMatch[3];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = itemContentHtml;
        const backLink = tempDiv.querySelector('[data-footnote-back-link]');
        if (backLink) backLink.remove();
        const text = tempDiv.innerText.trim().replace(/\n+/g, ' ');
        items.push({ id: fnIndex || fnId, text });
      }

      markdown = markdown.replace(sectionMatch[0], '').trim();

      if (items.length > 0) {
        markdown += '\n\n' + items.map(item => `[^${item.id}]: ${item.text}`).join('\n');
      }
    }

    return markdown.trim();
  };
}

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
    pluginsToLoad.push(ImageBlock, ImageInline, ImageCaption, ImageStyle, ImageToolbar, ImageResize, ImageInsert);
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
  addIfEnabled('footnotes', Footnotes);

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
      highlight: {
        options: [
          { model: 'yellowMarker', class: 'marker-yellow', title: 'Yellow marker', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
          { model: 'greenMarker', class: 'marker-green', title: 'Green marker', color: 'var(--ck-highlight-marker-green)', type: 'marker' },
          { model: 'pinkMarker', class: 'marker-pink', title: 'Pink marker', color: 'var(--ck-highlight-marker-pink)', type: 'marker' },
          { model: 'blueMarker', class: 'marker-blue', title: 'Blue marker', color: 'var(--ck-highlight-marker-blue)', type: 'marker' },
          { model: 'redPen', class: 'pen-red', title: 'Red pen', color: 'var(--ck-highlight-pen-red)', type: 'pen' },
          { model: 'greenPen', class: 'pen-green', title: 'Green pen', color: 'var(--ck-highlight-pen-green)', type: 'pen' }
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

    setupMarkdownFootnotesProcessor(editorInstance);

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

    // Setup Grouped Bottom Control Bar
    setupGroupedControlBar();

    // Setup Custom Search Bar
    initCustomSearchBar();

    // Safe Copy Code event handler via capture-phase delegation
    const editorMainArea = document.querySelector('.ck-editor__main');
    if (editorMainArea) {
      let lastCopyTime = 0;
      const handleCodeBlockCopy = (e) => {
        const pre = e.target.closest('pre');
        if (pre) {
          const rect = pre.getBoundingClientRect();
          const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX || 0);
          const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY || 0);
          const clickX = clientX - rect.left;
          const clickY = clientY - rect.top;

          if (clickX >= rect.width - 88 && clickX <= rect.width - 8 && clickY >= 6 && clickY < 38) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof e.stopImmediatePropagation === 'function') {
              e.stopImmediatePropagation();
            }
            const now = Date.now();
            if (now - lastCopyTime > 500) {
              lastCopyTime = now;
              const codeEl = pre.querySelector('code') || pre;
              const textToCopy = codeEl.innerText || codeEl.textContent;
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).catch(() => {});
              }
              if (window.AndroidNative && typeof window.AndroidNative.showToast === 'function') {
                window.AndroidNative.showToast('Code block copied to clipboard');
              }
            }
            return false;
          }
        }
      };

      ['pointerdown', 'touchstart', 'mousedown', 'click'].forEach(evtType => {
        editorMainArea.addEventListener(evtType, handleCodeBlockCopy, { capture: true, passive: false });
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

function setupGroupedControlBar() {
  const topContainer = document.querySelector('.ck-editor__top');
  if (!topContainer) return;

  let bar = topContainer.querySelector('.grouped-control-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'grouped-control-bar';
    topContainer.appendChild(bar);
  }

  bar.innerHTML = `
    <button class="grouped-key-btn" id="grp-btn-undo" title="Undo (Hold: Redo)">${svgIcons.undo}</button>
    <button class="grouped-key-btn" id="grp-btn-heading" title="Paragraph & Headings">${svgIcons.paragraph}</button>
    <button class="grouped-key-btn" id="grp-btn-lists" title="Lists">${svgIcons.lists}</button>
    <button class="grouped-key-btn" id="grp-btn-format" title="Format">${svgIcons.format}</button>
    <button class="grouped-key-btn" id="grp-btn-table" title="Table">${svgIcons.insertTable}</button>
    <button class="grouped-key-btn" id="grp-btn-insert" title="Insert">${svgIcons.insert}</button>
    <button class="grouped-key-btn" id="grp-btn-menu" title="Menu">${svgIcons.menu}</button>
  `;

  // Undo (Tap) / Redo (Hold)
  const undoBtn = bar.querySelector('#grp-btn-undo');
  if (undoBtn) {
    let holdTimer = null;
    let didRedo = false;

    undoBtn.addEventListener('pointerdown', () => {
      didRedo = false;
      holdTimer = setTimeout(() => {
        didRedo = true;
        if (editorInstance) editorInstance.execute('redo');
      }, 500);
    });

    const clearHold = () => {
      clearTimeout(holdTimer);
    };

    undoBtn.addEventListener('pointerup', (e) => {
      clearHold();
      if (!didRedo) {
        if (editorInstance) editorInstance.execute('undo');
      }
    });

    undoBtn.addEventListener('pointercancel', clearHold);
  }

  // Dismiss popup strip when tapping editor content
  document.addEventListener('pointerdown', (e) => {
    const strip = document.querySelector('#popup-toolbar-strip');
    const barEl = document.querySelector('.grouped-control-bar');
    if (strip && !strip.classList.contains('hidden')) {
      if (!strip.contains(e.target) && (!barEl || !barEl.contains(e.target))) {
        hidePopupStrip();
      }
    }
  });

  const headingBtn = bar.querySelector('#grp-btn-heading');
  if (headingBtn) {
    headingBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('heading', headingBtn, [
        { ckeComponent: 'heading' },
        { icon: svgIcons.wrap, title: 'Toggle Line Wrap', action: () => window.editorBridge.toggleLineWrap() }
      ]);
    };
  }

  const listsBtn = bar.querySelector('#grp-btn-lists');
  if (listsBtn) {
    listsBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('lists', listsBtn, [
        { ckeComponent: 'bulletedList' },
        { ckeComponent: 'numberedList' },
        { icon: svgIcons.todoList, title: 'Todo List', action: () => execCmd('todoList') },
        { icon: svgIcons.indent, title: 'Indent', action: () => execCmd('indent') },
        { icon: svgIcons.outdent, title: 'Outdent', action: () => execCmd('outdent') }
      ]);
    };
  }

  const formatBtn = bar.querySelector('#grp-btn-format');
  if (formatBtn) {
    formatBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('format', formatBtn, [
        { icon: svgIcons.bold, title: 'Bold', action: () => execCmd('bold') },
        { icon: svgIcons.italic, title: 'Italic', action: () => execCmd('italic') },
        { icon: svgIcons.strikethrough, title: 'Strikethrough', action: () => execCmd('strikethrough') },
        { icon: svgIcons.underline, title: 'Underline', action: () => execCmd('underline') },
        { icon: svgIcons.squareMarker('#ffe066'), title: 'Yellow Marker', action: () => execCmd('highlight', { value: 'yellowMarker' }) },
        { icon: svgIcons.squareMarker('#a8f087'), title: 'Green Marker', action: () => execCmd('highlight', { value: 'greenMarker' }) },
        { icon: svgIcons.squareMarker('#ff99c8'), title: 'Pink Marker', action: () => execCmd('highlight', { value: 'pinkMarker' }) },
        { icon: svgIcons.squareMarker('#9bf6ff'), title: 'Blue Marker', action: () => execCmd('highlight', { value: 'blueMarker' }) },
        { icon: svgIcons.circlePen('#ff595e'), title: 'Red Pen', action: () => execCmd('highlight', { value: 'redPen' }) },
        { icon: svgIcons.circlePen('#2ec4b6'), title: 'Green Pen', action: () => execCmd('highlight', { value: 'greenPen' }) },
        { icon: '✕', title: 'Clear Marker / Pen', action: () => execCmd('highlight', { value: null }) }
      ]);
    };
  }

  const tableBtn = bar.querySelector('#grp-btn-table');
  if (tableBtn) {
    tableBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('table', tableBtn, [
        { ckeComponent: 'insertTable' },
        { ckeComponent: 'tableColumn' },
        { ckeComponent: 'tableRow' },
        { ckeComponent: 'mergeTableCells' }
      ]);
    };
  }

  const insertBtn = bar.querySelector('#grp-btn-insert');
  if (insertBtn) {
    insertBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('insert', insertBtn, [
        { ckeComponent: 'insertImage' },
        { ckeComponent: 'link' },
        { icon: svgIcons.inlineCode, title: 'Inline Code', action: () => execCmd('code') },
        { icon: svgIcons.blockQuote, title: 'Insert Quote', action: () => execCmd('blockQuote') },
        { ckeComponent: 'codeBlock' },
        { icon: svgIcons.horizontalLine, title: 'Insert Line', action: () => execCmd('horizontalLine') },
        { icon: svgIcons.footnote, title: 'Insert Footnote', action: () => execCmd('InsertFootnote') }
      ]);
    };
  }

  const menuBtn = bar.querySelector('#grp-btn-menu');
  if (menuBtn) {
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      togglePopupStrip('menu', menuBtn, [
        { icon: svgIcons.newFile, title: 'New File', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('new') },
        { icon: svgIcons.openFile, title: 'Open File', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('open') },
        { icon: svgIcons.saveFile, title: 'Save File', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('save') },
        { icon: svgIcons.saveAsFile, title: 'Save As', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('save_as') },
        { icon: svgIcons.saveFile, title: 'Export HTML / MHTML', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('export') },
        { icon: svgIcons.search, title: 'Find & Replace', action: () => { hidePopupStrip(); toggleFindAndReplaceBar(); } },
        { icon: svgIcons.sourceEditing, title: 'Toggle Source View', action: () => toggleSourceEditing() },
        { icon: svgIcons.newWindow, title: 'New Window', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('new_window') },
        { icon: svgIcons.settings, title: 'Settings', action: () => window.AndroidNative && window.AndroidNative.onNativeAction('settings') }
      ]);
    };
  }
}

function execCmd(cmdName, options) {
  if (editorInstance) {
    try {
      editorInstance.execute(cmdName, options);
    } catch (err) {
      console.error(`Command ${cmdName} failed:`, err);
    }
  }
}

function hidePopupStrip() {
  const strip = document.querySelector('#popup-toolbar-strip');
  if (strip) {
    strip.classList.add('hidden');
    strip.innerHTML = '';
  }
  activePopupGroup = null;
  document.querySelectorAll('.grouped-key-btn').forEach(btn => btn.classList.remove('active'));
}

function togglePopupStrip(groupKey, targetBtn, items) {
  const strip = document.querySelector('#popup-toolbar-strip');
  if (!strip) return;

  if (activePopupGroup === groupKey) {
    hidePopupStrip();
    return;
  }

  hidePopupStrip();
  activePopupGroup = groupKey;
  targetBtn.classList.add('active');

  items.forEach(item => {
    if (item.ckeComponent) {
      if (editorInstance && editorInstance.ui.componentFactory.has(item.ckeComponent)) {
        try {
          const view = editorInstance.ui.componentFactory.create(item.ckeComponent);
          if (!view.element) {
            view.render();
          }
          if (view.element) {
            strip.appendChild(view.element);
          }
        } catch (e) {
          console.error('Failed to create CKE component:', item.ckeComponent, e);
        }
      }
    } else {
      const btn = document.createElement('button');
      btn.className = 'popup-strip-btn';
      if (item.title) btn.title = item.title;
      btn.innerHTML = item.icon;
      btn.onclick = (e) => {
        e.stopPropagation();
        item.action();
      };
      strip.appendChild(btn);
    }
  });

  strip.classList.remove('hidden');
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

    // Fast scroll activation threshold (velocity > 4.5 or dy > 250)
    if (velocity > 4.5 || dy > 250) {
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
    const popupStrip = document.querySelector('#popup-toolbar-strip');
    if (popupStrip && popupStrip.contains(e.target)) {
      isSwiping = false;
      return;
    }
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
      const screenWidth = window.innerWidth;
      const isRightEdgeTouch = touchStartX >= (screenWidth * 0.80);

      if (deltaX < 0 && !panel.classList.contains('open') && isRightEdgeTouch) {
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

function toggleBottomToolbar(forceState) {
  const toggleBtn = document.querySelector('#floating-toggle-btn');
  const isCurrentlyHidden = document.body.classList.contains('toolbar-hidden');
  const shouldShow = forceState !== undefined ? forceState : isCurrentlyHidden;

  if (shouldShow) {
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

  if (!keyPart || keyPart.length === 0) return false;

  const ctrlPressed = event.ctrlKey || event.metaKey;
  const altPressed = event.altKey;
  const shiftPressed = event.shiftKey;

  if (hasCtrl !== ctrlPressed) return false;
  if (hasAlt !== altPressed) return false;
  if (hasShift !== shiftPressed) return false;

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

function parseAndMatchHotkey(event, shortcutString) {
  if (!shortcutString || typeof shortcutString !== 'string') return false;
  const shortcuts = shortcutString.trim().split(/\s+/);
  return shortcuts.some(sc => matchSingleHotkey(event, sc));
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    const c = (e.code || '').toLowerCase();

    // Bypass custom hotkeys for native Undo / Redo events so Undo never triggers 'open' or dialogs
    if (k === 'undo' || k === 'redo' || c === 'undo' || c === 'redo' || (e.ctrlKey && (k === 'z' || k === 'y'))) {
      return;
    }

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
    } else if (parseAndMatchHotkey(e, customHotkeys.export)) {
      e.preventDefault();
      window.AndroidNative && window.AndroidNative.onNativeAction('export');
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
      else if (parseAndMatchHotkey(e, customHotkeys.link)) {
        e.preventDefault();
        insertLinkPrompt();
      }
      else if (parseAndMatchHotkey(e, customHotkeys.blockQuote)) exec('blockQuote');
      else if (parseAndMatchHotkey(e, customHotkeys.codeBlock)) exec('codeBlock');
      else if (parseAndMatchHotkey(e, customHotkeys.bulletedList)) exec('bulletedList');
      else if (parseAndMatchHotkey(e, customHotkeys.numberedList)) exec('numberedList');
      else if (parseAndMatchHotkey(e, customHotkeys.todoList)) exec('todoList');
      else if (parseAndMatchHotkey(e, customHotkeys.indent)) exec('indent');
      else if (parseAndMatchHotkey(e, customHotkeys.outdent)) exec('outdent');
      else if (parseAndMatchHotkey(e, customHotkeys.horizontalLine)) exec('horizontalLine');
      else if (parseAndMatchHotkey(e, customHotkeys.findAndReplace)) {
        e.preventDefault();
        toggleFindAndReplaceBar();
      }
      else if (parseAndMatchHotkey(e, customHotkeys.sourceEditing)) {
        e.preventDefault();
        toggleSourceEditing();
      }

      // Headings
      else if (parseAndMatchHotkey(e, customHotkeys.heading_p)) exec('heading', { value: 'paragraph' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_1)) exec('heading', { value: 'heading1' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_2)) exec('heading', { value: 'heading2' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_3)) exec('heading', { value: 'heading3' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_4)) exec('heading', { value: 'heading4' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_5)) exec('heading', { value: 'heading5' });
      else if (parseAndMatchHotkey(e, customHotkeys.heading_6)) exec('heading', { value: 'heading6' });

      // Highlight Markers & Pens
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_yellow)) exec('highlight', { value: 'yellowMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_green)) exec('highlight', { value: 'greenMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_pink)) exec('highlight', { value: 'pinkMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_blue)) exec('highlight', { value: 'blueMarker' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_red_pen) || parseAndMatchHotkey(e, customHotkeys.highlight_red)) exec('highlight', { value: 'redPen' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_green_pen)) exec('highlight', { value: 'greenPen' });
      else if (parseAndMatchHotkey(e, customHotkeys.highlight_remove)) exec('highlight', { value: null });
    }
  }, true);
}

// Global JS Bridge exposure
window.editorBridge = {
  applyAllPreferences: function(prefsJson) {
    if (!prefsJson) return;
    const prefs = typeof prefsJson === 'string' ? JSON.parse(prefsJson) : prefsJson;

    const setCssVar = (varName, val, unit = '') => {
      if (val !== undefined && val !== null && val !== 'default' && val !== '') {
        document.documentElement.style.setProperty(varName, val + unit);
      } else {
        document.documentElement.style.removeProperty(varName);
      }
    };

    // Theme & Wrap
    if (prefs.pref_app_theme === 'light') {
      document.body.classList.add('light-theme');
    } else if (prefs.pref_app_theme === 'amoled') {
      document.body.classList.remove('light-theme');
    }
    if (prefs.pref_line_wrap === false) {
      document.body.classList.add('no-line-wrap');
    } else if (prefs.pref_line_wrap === true) {
      document.body.classList.remove('no-line-wrap');
    }

    // Body & Headings typography
    setCssVar('--body-font-size', prefs.pref_body_font_size, 'px');
    setCssVar('--heading-scale', prefs.pref_heading_scale_percent ? (prefs.pref_heading_scale_percent / 100.0) : null);
    setCssVar('--bold-font-weight', prefs.pref_font_weight_bold);
    setCssVar('--italic-font-weight', prefs.pref_font_weight_italic);
    setCssVar('--heading-font-weight', prefs.pref_font_weight_heading);
    setCssVar('--heading-align', prefs.pref_heading_align);
    setCssVar('--heading-line-height', prefs.pref_heading_line_height);
    setCssVar('--heading-letter-spacing', prefs.pref_heading_letter_spacing);
    setCssVar('--heading-text-transform', prefs.pref_heading_text_transform);
    setCssVar('--heading-underline-style', prefs.pref_heading_underline_style);
    setCssVar('--heading-underline-thickness', prefs.pref_heading_underline_thickness, 'px');
    setCssVar('--heading-underline-color', prefs.pref_heading_underline_color);
    setCssVar('--heading-margin-top', prefs.pref_heading_margin_top, 'px');
    setCssVar('--heading-margin-bottom', prefs.pref_heading_margin_bottom, 'px');

    // Heading colors 1-6
    for (let i = 1; i <= 6; i++) {
      setCssVar(`--heading-${i}-color`, prefs[`pref_heading_${i}_color`]);
    }

    // Paragraph
    setCssVar('--paragraph-align', prefs.pref_paragraph_align);
    setCssVar('--paragraph-line-height', prefs.pref_paragraph_line_height);
    setCssVar('--letter-spacing', prefs.pref_letter_spacing);
    setCssVar('--paragraph-first-line-indent', prefs.pref_paragraph_first_line_indent, 'px');
    setCssVar('--paragraph-margin-top', prefs.pref_paragraph_margin_top, 'px');
    setCssVar('--paragraph-margin-bottom', prefs.pref_paragraph_margin_bottom, 'px');

    // Inline & Footnotes
    setCssVar('--bold-color', prefs.pref_bold_color);
    setCssVar('--italic-color', prefs.pref_italic_color);
    setCssVar('--link-color', prefs.pref_link_color);
    setCssVar('--link-decoration', prefs.pref_link_decoration);
    setCssVar('--code-color', prefs.pref_code_color);
    setCssVar('--code-bg-color', prefs.pref_code_bg_color);
    setCssVar('--code-padding', prefs.pref_code_padding, 'px');
    setCssVar('--code-border-radius', prefs.pref_code_border_radius, 'px');
    setCssVar('--footnote-font-size', prefs.pref_footnote_font_size, 'px');
    setCssVar('--footnote-text-color', prefs.pref_footnote_text_color);
    setCssVar('--footnote-ref-color', prefs.pref_footnote_ref_color);
    setCssVar('--footnote-link-color', prefs.pref_footnote_link_color);
    setCssVar('--footnote-bg-color', prefs.pref_footnote_bg_color);

    // Lists & Todos
    setCssVar('--list-left-indent', prefs.pref_list_left_indent, 'px');
    setCssVar('--list-item-spacing', prefs.pref_list_item_spacing, 'px');
    setCssVar('--list-line-height', prefs.pref_list_line_height);
    setCssVar('--list-bullet-color', prefs.pref_list_bullet_color);
    setCssVar('--list-number-color', prefs.pref_list_number_color);
    setCssVar('--todo-unchecked-color', prefs.pref_todo_unchecked_color);
    setCssVar('--todo-checked-color', prefs.pref_todo_checked_color);

    // BlockQuotes & Callouts
    setCssVar('--blockquote-border-width', prefs.pref_blockquote_line_thickness, 'px');
    setCssVar('--blockquote-border-style', prefs.pref_blockquote_line_style);
    setCssVar('--blockquote-border-color', prefs.pref_blockquote_line_color);
    setCssVar('--blockquote-bg-color', prefs.pref_blockquote_bg_color);
    setCssVar('--blockquote-text-color', prefs.pref_blockquote_text_color);
    setCssVar('--blockquote-left-indent', prefs.pref_blockquote_left_indent, 'px');
    setCssVar('--blockquote-padding', prefs.pref_blockquote_padding, 'px');

    setCssVar('--callout-border-width', prefs.pref_callout_line_thickness, 'px');
    setCssVar('--callout-border-style', prefs.pref_callout_line_style);
    setCssVar('--callout-border-color', prefs.pref_callout_line_color);
    setCssVar('--callout-bg-color', prefs.pref_callout_bg_color);
    setCssVar('--callout-padding', prefs.pref_callout_padding, 'px');

    // Tables
    setCssVar('--table-border-style', prefs.pref_table_border_style);
    setCssVar('--table-border-width', prefs.pref_table_border_thickness, 'px');
    setCssVar('--table-border-color', prefs.pref_table_border_color);
    setCssVar('--table-header-bg', prefs.pref_table_header_bg_color);
    setCssVar('--table-header-color', prefs.pref_table_header_text_color);
    setCssVar('--table-header-font-weight', prefs.pref_table_header_font_weight);
    setCssVar('--table-cell-bg', prefs.pref_table_cell_bg_color);
    setCssVar('--table-cell-color', prefs.pref_table_cell_text_color);
    setCssVar('--table-cell-padding', prefs.pref_table_cell_padding, 'px');

    // Code Blocks
    setCssVar('--code-block-color', prefs.pref_code_block_color);
    setCssVar('--code-block-bg-color', prefs.pref_code_block_bg_color);
    setCssVar('--code-block-padding', prefs.pref_code_block_padding, 'px');
    setCssVar('--code-block-border-radius', prefs.pref_code_block_border_radius, 'px');
    setCssVar('--code-block-line-height', prefs.pref_code_block_line_height);
    setCssVar('--code-block-lang-label-color', prefs.pref_code_block_lang_label_color);

    // HR
    setCssVar('--hr-thickness', prefs.pref_hr_thickness, 'px');
    setCssVar('--hr-style', prefs.pref_hr_style);
    setCssVar('--hr-color', prefs.pref_hr_color);
    setCssVar('--hr-width', prefs.pref_hr_width_percent ? prefs.pref_hr_width_percent + '%' : null);
    setCssVar('--hr-margin-top', prefs.pref_hr_margin_top, 'px');
    setCssVar('--hr-margin-bottom', prefs.pref_hr_margin_bottom, 'px');

    // Toolbar
    setCssVar('--toolbar-bg', prefs.pref_toolbar_bg_color);
    setCssVar('--toolbar-icon-color', prefs.pref_toolbar_icon_color);
    setCssVar('--toolbar-active-icon-color', prefs.pref_toolbar_active_icon_color);
    setCssVar('--toolbar-height', prefs.pref_toolbar_height, 'px');
  },
  getMarkdown: function() {
    if (!editorInstance) return '';
    return editorInstance.getData();
  },
  setMarkdown: function(markdownText) {
    if (!editorInstance) return;
    isProgrammaticChange = true;
    try {
      editorInstance.setData(markdownText || '');
    } catch (e) {
      console.error('Error setting markdown:', e);
    }
    setTimeout(() => { isProgrammaticChange = false; }, 50);
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
  setToolbarSettings: function(bgColorHex, iconColorHex, heightDp) {
    if (bgColorHex && bgColorHex !== 'default') {
      document.documentElement.style.setProperty('--toolbar-bg', bgColorHex);
    } else {
      document.documentElement.style.removeProperty('--toolbar-bg');
    }
    if (iconColorHex && iconColorHex !== 'default') {
      document.documentElement.style.setProperty('--toolbar-icon-color', iconColorHex);
    } else {
      document.documentElement.style.removeProperty('--toolbar-icon-color');
    }
    if (heightDp && typeof heightDp === 'number') {
      document.documentElement.style.setProperty('--toolbar-height', heightDp + 'px');
    }
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
