require "uri"
require "json"
require "openapi3_parser"

class MockServer
  attr_reader :doc

  def initialize(oas)
    @doc = Openapi3Parser.load(oas)
  end

  def response(method:, url:)
    puts "MockServer#response(#{method}, #{url})"

    status, response_body = dig_example(method: method, path: path(url))

    {
      status: status,
      headers: { "Content-Type" => "application/json" },
      body: response_body
    }
  end

  def path(req_url)
    uri = URI.parse(req_url)
    uri.path
  end

  def dig_example(method:, path:)
    oas_path = search_oas_path(path)
    return 404, nil unless oas_path

    status, response = oas_path[method.downcase].responses.first
    content = response[:content]
    return status, nil unless content

    example = content["application/json"].schema.example
    return status, example.to_json
  end

  def search_oas_path(path)
    target_path = doc.paths.keys.detect do |p|
      path_regex = p.gsub(/{.*?}/, ".*?")
      path =~ /\A#{path_regex}\Z/
    end

    doc.paths[target_path]
  end
end
