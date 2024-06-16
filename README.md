# ruby.wasm OpenApi Mock Service Worker

OpenAPI Specに基づいたレスポンスを返すMockServerです。
ブラウザーのService Worker上で動作するため、静的ファイルのみで構成されています。

## Demo

https://ruby-wasm-oas-mock.lnilab.net/boot.html

## Build wasm binary

```sh
# Build wasm and rubygems packages
JS=true bin/rbwasm build -o ruby.wasm

# Package ruby code
bundle exec rbwasm pack ruby.wasm --dir ./src::/src -o openapi-msw.wasm
gzip openapi-msw.wasm
```
