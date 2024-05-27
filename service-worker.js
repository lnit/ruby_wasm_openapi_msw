import { DefaultRubyVM } from "https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.1/dist/browser/+esm";

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
    "/boot.html", "/service-worker.js"
  ]
  if (bootResources.find((r) => event.request.url.endsWith(r))) {
      console.log('[rails-web] Fetching boot files from network:', event.request.url);
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

  const command = `
    mock = MockServer.new(File.open("src/sample.yml"))
    mock.response(method: '${event.request.method}', url: '${event.request.url}')
  `
  const res = vm.eval(command).toJS();
  console.log("[Service Worker] Mock response", res);
  let { status, headers, body } = res;

  return new Response(body, { headers, status: status });
}

const fetchOASYaml = async () => {
  const response = await fetch("/sample.yml");
  return await response.text();
}
