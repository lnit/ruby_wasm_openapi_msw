import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.1/dist/browser/+esm";
import { openDB, deleteDB, wrap, unwrap  } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const initRuby = async () => {
  const wasm_buf = fetch("https://cdn.jsdelivr.net/npm/@lni_t/openapi-msw-bin@0.0.4/build/openapi-msw.wasm.gz")
    .then(response => response.blob())
    .then(blob => blob.stream().pipeThrough(new DecompressionStream('gzip')))
    .then(stream => new Response(stream))
    .then(response => response.arrayBuffer());
  const module = await WebAssembly.compile(await wasm_buf);

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
    "/boot.html", "/service-worker.js", "/boot.rb", "/_default.yml"
  ]
  if (bootResources.find((r) => event.request.url.endsWith(r))) {
    console.log('[Service Worker] Fetching boot files from network:', event.request.url);
    event.respondWith(fetch(event.request.url, { cache: "no-cache" }));
    return;
  }

  const libResources = [
    "cdn.jsdelivr.net", ".wasm.gz"
  ]
  if (libResources.find((r) => event.request.url.includes(r))) {
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
