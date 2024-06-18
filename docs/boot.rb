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

puts "boot.rb completed!"
