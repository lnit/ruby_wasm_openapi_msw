require "openapi3_parser"

module Openapi3Parser
  module Node
    class MediaType < Node::Object
      def example_value
        return example if example
        return schema.example if schema.example

        schema.example_value
      end
    end

    class Schema < Node::Object
      def example_value
        return example if example

        case type
        when "array"
          return [items.example_value]
        when "object"
          return properties.example_value
        when "number", "integer"
          return 1
        when "string"
          return "string"
        when "boolean"
          return true
        else
          return "unsupported type"
        end
      end
    end

    class Map
      def example_value
        keys.map do |key|
          [key, self[key].example_value]
        end.to_h
      end
    end
  end
end
