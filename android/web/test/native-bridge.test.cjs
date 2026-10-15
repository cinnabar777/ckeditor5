const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
const setter = source.slice(source.indexOf('  getMarkdown: function('), source.indexOf('  toggleLineWrap: function('));
const configuration = source.slice(source.indexOf('  configurePlugins: function('), source.indexOf("\nwindow.addEventListener('DOMContentLoaded'"));

function fixture() {
  const state = { text: 'old document', builds: 0, restores: 0 };
  let finishBuild;
  const context = vm.createContext({
    window: { _lastDisabledPluginsStr: '[]', AndroidNative: { restoreNativeCursorAndScrollState() { state.restores++; } } },
    editorInstance: { getData: () => state.text, setData: value => { state.text = value; } },
    pluginConfigurationTask: null,
    pendingMarkdown: null,
    rebuildMarkdown: null,
    contentSnapshots: { cancel() {} },
    isProgrammaticChange: false,
    document: { querySelector: () => null },
    setTimeout: fn => fn(),
    console,
    initEditor: () => { state.builds++; return new Promise(resolve => { finishBuild = resolve; }); }
  });
  vm.runInContext(`window.editorBridge = {
    getSelectionState: () => null,
    setSelectionState: () => {},
    ${setter}
    ${configuration}`, context);
  return { state, bridge: context.window.editorBridge, finish: () => finishBuild() };
}

test('unchanged initial configuration does not destroy the editor', () => {
  const f = fixture();
  f.bridge.configurePlugins('[]');
  assert.equal(f.state.builds, 0);
  assert.equal(f.state.text, 'old document');
});

test('a file arriving during rebuild wins over the old editor snapshot', async () => {
  const f = fixture();
  const rebuilding = f.bridge.configurePlugins('["table"]');
  f.bridge.setMarkdown('first incoming file');
  f.bridge.setMarkdown('latest incoming file');
  f.finish();
  await rebuilding;
  assert.equal(f.state.text, 'latest incoming file');
  assert.equal(f.state.restores, 1);
});

test('an empty incoming document is not replaced by the previous document', async () => {
  const f = fixture();
  const rebuilding = f.bridge.configurePlugins('["table"]');
  f.bridge.setMarkdown('');
  f.finish();
  await rebuilding;
  assert.equal(f.state.text, '');
});

test('a settings-only rebuild preserves the document', async () => {
  const f = fixture();
  const rebuilding = f.bridge.configurePlugins('["table"]');
  f.finish();
  await rebuilding;
  assert.equal(f.state.text, 'old document');
  assert.equal(f.state.restores, 0);
});

test('simultaneous identical configuration requests share one rebuild', async () => {
  const f = fixture();
  const first = f.bridge.configurePlugins('["table"]');
  const second = f.bridge.configurePlugins('["table"]');
  assert.equal(f.state.builds, 1);
  f.finish();
  await Promise.all([first, second]);
  assert.equal(f.state.builds, 1);
});

test('saving during a rebuild returns the pending file or retained snapshot', async () => {
  const f = fixture();
  const rebuilding = f.bridge.configurePlugins('["table"]');
  assert.equal(f.bridge.getMarkdown(), 'old document');
  f.bridge.setMarkdown('incoming document');
  assert.equal(f.bridge.getMarkdown(), 'incoming document');
  f.bridge.setMarkdown('');
  assert.equal(f.bridge.getMarkdown(), '');
  f.finish();
  await rebuilding;
});

function snapshotFixture() {
  const jobs = new Map();
  let next = 0;
  const context = vm.createContext({
    setTimeout: fn => { jobs.set(++next, fn); return next; },
    clearTimeout: id => jobs.delete(id)
  });
  vm.runInContext(source.slice(source.indexOf('function createContentSnapshotScheduler('),
    source.indexOf('const contentSnapshots =')), context);
  let reads = 0;
  let dirty = 0;
  const scheduler = context.createContentSnapshotScheduler(() => reads++, () => dirty++);
  return { scheduler, jobs, counts: () => ({ reads, dirty }) };
}

test('rapid typing marks edits immediately but serializes only once after idle', () => {
  const f = snapshotFixture();
  for (let i = 0; i < 100; i++) f.scheduler.changed();
  assert.deepEqual(f.counts(), { reads: 0, dirty: 100 });
  assert.equal(f.jobs.size, 1);
  [...f.jobs.values()][0]();
  assert.equal(f.counts().reads, 1);
});

test('saving or replacing a document cancels its scheduled old snapshot', () => {
  const f = snapshotFixture();
  f.scheduler.changed();
  f.scheduler.cancel();
  assert.equal(f.jobs.size, 0);
  assert.equal(f.counts().reads, 0);
});
