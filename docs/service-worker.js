import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.1/dist/browser/+esm";
import { openDB, deleteDB, wrap, unwrap  } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const initRuby = async () => {
  const response = await fetch("/my-ruby-app.wasm");
  const module = await WebAssembly.compileStreaming(response);

  const { vm } = await DefaultRubyVM(module);

  vm.eval(`
    require "/bundle/setup"
    require_relative "src/loader"

    puts "Initialized RubyVM!"
  `);

  self.RubyVM = vm
};

self.addEventListener('fetch', (event) => {
  const bootResources = [
    "/boot.html", "/service-worker.js", "/my-ruby-app.wasm"
  ]
  if (bootResources.find((r) => event.request.url.endsWith(r))) {
    console.log('[Service Worker] Fetching boot files from network:', event.request.url);
    event.respondWith(fetch(event.request.url));
    return;
  }
  if (event.request.url.includes("cdn.jsdelivr.net")) {
    console.log('[Service Worker] Fetching lib files from network:', event.request.url);
    event.respondWith(fetch(event.request.url));
    return;
  }

  event.respondWith(
    respondWithRuby(event)
  );
});

const respondWithRuby = async (event) => {
  let vm = self.RubyVM;
  if (!vm) {
    await initRuby();
    vm = self.RubyVM;
  }

  const specs = await loadSpecsFromDB();
  console.log("[Service Worker] Specs loaded from DB");

  const command = `
    specs_str = <<EOS
${specs.specs}
EOS

    mock = MockServer.new(specs_str)
    mock.response(method: '${event.request.method}', url: '${event.request.url}')
  `
  const res = vm.eval(command).toJS();
  console.log("[Service Worker] Mock response", res);
  let { status, headers, body } = res;

  return new Response(body, { headers, status: status });
}

const loadSpecsFromDB = async () => {
  let db = await openDB("OpenApiDatabase", 1, db => {});

  let transaction = db.transaction('apiSpecs', 'readwrite');
  let apiSpecs = transaction.objectStore('apiSpecs');
  return apiSpecs.get(1)
}
