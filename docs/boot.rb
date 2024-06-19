require "/bundle/setup"
require_relative "src/loader"

def document
  @document ||= JS.global[:document]
end

def oas_valid?
  text = document.getElementById("spec-text")[:value]

  Openapi3Parser.load(text).valid?
rescue StandardError
  false
end

def visualize_mock_list
  text = document.getElementById("spec-text")[:value]
  mock_list = document.getElementById("mock-list")
  mock_list[:innerHTML] = ""

  ul = mock_list.appendChild(document.createElement("ul"))
  mock = MockServer.new(text)

  # generate path list from OAS text
  mock.all_paths.each do |path, v|
    example_path = v[:example_path]
    v[:operations].each do |method, operation|
      li = ul.appendChild(document.createElement("li"))
      if method == "get"
        # GET method is linked to the example path
        li[:textContent] = "#{method.upcase} "
        li.appendChild(document.createElement("a")).tap do |a|
          a[:textContent] = "#{path}"
          a[:href] = example_path
          a[:target] = "_blank"
          a[:rel] = "noreferer"
        end
      else
        li[:textContent] = "#{method.upcase} #{path}"
      end
    end
  end
end

puts "boot.rb completed!"
