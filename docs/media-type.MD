# The Lumina Hypermedia Type

## Table of Contents

- [Introduction](#introduction)
- [Resource Representation](#resource-representation)
  - [State vs Metadata Properties](#state-vs-metadata-properties)
  - [Identifying Resources](#identifying-resources)
  - [State Metadata](#state-metadata)
  - [Null Values](#null-values)
  - [Metadata for Non-Object Types](#metadata-for-non-object-types)
  - [Type Metadata](#type-metadata)
  - [Referencing Objects](#referencing-objects)
  - [Linking properties](#linking-properties)
  - [Resource Relations](#resource-relation)
- [Form Object](#form-object)
  - [Creating a new Employee Resource](#creating-a-new-employee-resource)
  - [Submitting Forms](#submitting-forms)
- [Authentication Metadata](#authentication-metadata)
- [Navigating a Document](#navigating-a-document)
- [Deprecated Properties](#deprecated-properties)
- [Versioning](#versioning)

## Introduction

Lumina is a JSON-based media type for interacting with web resources through hypermedia controls,
such as links, forms and queries.
For example, a link is a hypermedia control that lets you navigate to another web resource.

You can use Lumina to create, update, delete or query web resources using HTTP methods.
HTTP methods are the standard ways of communicating with web servers.
For example, GET is an HTTP method that requests data from a web server.

The media type for a Lumina document is `application/vnd.com.github.cowwoc.lumina+json`.
You can add optional media type parameters, such as the charset, or version.

This document defines version 1 of the specification.
Servers may support multiple versions of the specification.
Clients should use the `Accept` header to indicate which versions of the specification they support.

For example, `Accept: application/vnd.com.github.cowwoc.lumina+json; charset=utf-8; version=1` means that the
client supports version 1 of this specification, using the UTF-8 character set.

Property names and values introduced by this document are case-sensitive.

This specification provides core concepts for the Lumina media type, which are expected to be extended by
API publishers.
They can define their own types and parameters for their API.

## Resource Representation

A web resource is anything that has a name and can be transferred over the web.
Examples of web resources are images, documents, and services.

Lumina uses JSON objects to represent web resources and their properties.
In this document, a resource means the JSON object that represents the web resource.

The JSON object at the top of Lumina documents represents a resource.

### State vs Metadata Properties

A resource object has properties that may contain other objects.
Each object has two kinds of properties: state and metadata.

State properties describe the current condition of an object, such as its content, appearance, behavior or
location.
State properties can change over time, or in response to user actions.

Metadata properties describe an object's state properties, such as their format, origin, purpose or quality.
Metadata properties are usually constant and do not change.

When an object is inside another object, its properties only describe itself, not any other objects, even
if it is nested inside another object.

State properties are defined by the application and can have any name and value.
Metadata properties are defined by the Lumina specification and must start with `@`.

For example:

```json
{
  "@type": "person",
  "name": "Sarah",
  "age": 25,
  "hobbies": [
    "reading",
    "cooking",
    "dancing"
  ]
}
```

This object has three state properties: `name`, `age`, and `hobbies`.
This object has one metadata property: `@type`.

State properties whose name starts with `@` must use a special metadata property as explained in the
[State Metadata] section.

### Identifying Resources

Resources have a `@link` property that identifies their URI.
Nested resources can link to any of their URIs, but top-level resources must link to their canonical URI.
If the canonical URI is equal to the request URI, then the top-level resource can omit the `@link` property.

A document may contain several references to a resource, with the same or different states.
The overhead of repeating a resource's state is minimal (as low as one byte per reference) due to the use of
HTTP content compression.

Nested objects with a `@link` property indicate a new resource with its own state.
For example, this document has two resources: a department and its manager.

```json
{
  "@link": "https://example.com/departments/789",
  "name": "Sales",
  "manager": {
    "@link": "https://example.com/employees/123",
    "name": "John Doe"
  }
}
```

You can also use URIs as property values to link to resources with external state, as explained
in the [Linking Properties] section.

Metadata can only be attached to resources.
It is only valid for the resource it is attached to, and it must be a direct child of that resource.

For example:

```json
{
  "friend": {
    "@link": "https://example.com/people/1",
    "address": {
      "@type": "address"
    }
  }
}
```

In the above document, the metadata `@type` cannot be attached to "address" because it is not a resource.
Further, `@type` does not apply to "friend" because it is not a direct child of it.

### State Metadata

Resource state can be represented in two ways: by using top-level properties or by using a `@state`
property that contains nested properties.

If an object has a `@state` property, it must include all the state properties of the resource.
All metadata properties must remain at the top-level.

For example, this object uses a `@state` property to represent the state of an employee resource:

```json
{
  "@link": "https://example.com/employees/123",
  "@state": {
    "name": "John Doe",
    "age": 35,
    "gender": "male"
  }
}
```

This `@state` property contains three state properties: `name`, `age`, and `gender`.
The object also has an `@link` property that identifies the URI of the resource.

Alternatively, this object uses normal properties to represent the same state of the employee resource:

```json
{
  "@link": "https://example.com/employees/123",
  "name": "John Doe",
  "age": 35,
  "gender": "male"
}
```

This object has four top-level properties: three state properties (`name`, `age`, and `gender`) and one
metadata property (`@link`).
Both representations are valid and equivalent.

Unless required by this specification, the choice of using a `@state` property or not depends on the
preference of the API publisher or the client.

If a state property name starts with `@`, then all state properties must be nested inside the `@state`
metadata property.

For example:

```json
{
  "@type": "person",
  "@state": {
    "@createdAt": "20231210T021919Z",
    "name": "Sarah",
    "age": 25,
    "hobbies": [
      "reading",
      "cooking",
      "dancing"
    ]
  }
}
```

This object has four state properties: `@createdAt`, `name`, `age`, and `hobbies`.
The presence of `@createdAt` inside the `@state` metadata indicates that it is a state property, not a
metadata property.
This object has one metadata property: `@type`.

### Null Values

API publishers may omit state properties that have a null value.
This makes the document smaller and saves data.
When you receive a resource, you should treat any missing properties as having a null value.
For example:

```json
{
  "name": "Sarah",
  "age": 25,
  "hobbies": [
    "reading",
    "cooking",
    "dancing"
  ],
  "address": null
}
```

and:

```json
{
  "name": "Sarah",
  "age": 25,
  "hobbies": [
    "reading",
    "cooking",
    "dancing"
  ]
}
```

Both objects have the same properties and values for the same resource state.
The second object does not have the `address` property because it has a null value.
You should assume that the `address` property has a null value in both objects.

### Metadata for Non-Object Types

To use metadata for JSON types other than objects, such as strings, numbers, booleans, arrays, or nulls,
you can wrap them in an object with a `@state` property.
For example:

```json
{
  "@link": "https://example.com/employees/123",
  "name": {
    "@link": "https://example.com/employees/123#name",
    "@state": "John Doe"
  },
  "age": {
    "@link": "https://example.com/employees/123#age",
    "@state": 35
  },
  "gender": {
    "@link": "https://example.com/employees/123#gender",
    "@state": "male"
  },
  "hobbies": {
    "@link": "https://example.com/employees/123#hobbies",
    "@state": [
      "reading",
      "cooking",
      "dancing"
    ]
  }
}
```

This example shows an employee resource with four properties: `name`, `age`, `gender`, and `hobbies`.
Each property value is an object with a `@link` property for its URI and a `@state` property for
its original value.
The original values are a string, a number, a string, and an array, respectively.

### Type Metadata

The `@type` metadata specifies the constraints of the resource to which it is applied.
Clients should not infer any semantics from a @type beyond its constraints.
For instance, `"@type": "Person"` does not imply any fixed meaning, as it may change over time.

- The `@type` metadata defines a property's data type. Possible values include:
  - `object`
  - `array`
  - `boolean`
  - `date`
  - `dateTime`
  - `decimal`
  - `integer`
  - `uri`
  - `string`
  - or a URI that uniquely identifies the type.
  - The default value is `string`.
- The `@optional` property is a JSON boolean that indicates whether a property value may be `null`.
  It also indicates whether a property must be submitted as part of a form.
  Its default value is false.
- The `@options` property is an array whose elements specify the set of possible values.

A property of type `object` is a JSON object.

A property of type `array` is a JSON array.

Properties of type `boolean` or `string` must have a value of the corresponding JSON type.

A property of type `date` must have a JSON string value that follows the full-date format defined
by [RFC 3339].
If the element is an object, it may contain these metadata properties: `min`, `max`.

A property of type `dateTime` must have a JSON string value that follows the date-time format defined
by [RFC 3339].
If the element is an object, it MAY contain these metadata properties: `min`, `max`.

A property of type `decimal` is a JSON number that has a decimal point.

A property of type `integer` is a JSON number that does not have a decimal point.

A property of type `uri` is a JSON string that contains a URI as defined by [RFC 3986].

A custom `@type` consisting of a URI that uniquely identifies the type could look like
`https://example.com/person`.
The URI does not have to reference an existing resource, though it is recommended to reference a
human-readable document that describes the type and its properties.

Properties of type `array`, `boolean`, `date`, `dateTime`, `uri` or `string` do not need to specify a `@type`
as their type is implied.
Properties with any other type must explicitly contain a `@type` property.

A property can have optional metadata properties that describe its constraints or characteristics. The
metadata properties depend on the type of the property. The following table lists the possible state
properties for each type:

| Type      | Metadata properties           |
|-----------|-------------------------------|
| array     | minLength, maxLength          |
| boolean   |                               |
| date      | min, max                      |
| date-time | min, max                      |
| decimal   | min, max                      |
| integer   | min, max                      |
| number    | min, max                      |
| string    | minLength, maxLength, pattern |

- The `min` and `max` properties specify the minimum (inclusive) and maximum (exclusive) value that a
  property may have.
  These apply to `array`, `date`, `dateTime`, `decimal` and `integer` types.
- The `minLength` and `maxLength` properties specify the minimum (inclusive) and maximum (exclusive)
  number of characters that a string property can have.
- A pattern property is a string that specifies the regular expression that the string value of the property
  must match.
  The regular expression format is defined by ECMAScript 13: [ECMAScript Language Specification].

#### Example

This object has four properties: `name`, `age`, `gender`, and `email`.
Each property has a value of the corresponding JSON type: `string`, `number`, `string`, and `string`.
The `age` property is an `integer`, while the `email` property is a URI.
However, these types are not explicitly specified by the object, so they are inferred from the values.
To make the types and constraints more clear, we can add `@type` metadata to the object, as shown in the next
section.

```json
{
  "name": "John Smith",
  "age": 18,
  "gender": "male",
  "email": "john.smith@gmail.com"
}
```

and here is that same object with `@type` metadata added:

```json
{
  "@description": "An individual human being",
  "@type": "https://example.com/Person",
  "name": {
    "description": "The person's name",
    "type": "The person's name",
    "min-length": 5,
    "max-length": 30
  },
  "age": {
    "description": "The person's age in years",
    "type": "integer",
    "min": 18,
    "max": 65
  },
  "gender": {
    "description": "The person's gender",
    "options": [
      {
        "value": "male",
        "description": "The person identifies as male"
      },
      {
        "value": "female",
        "description": "The person identifies as female"
      },
      {
        "value": "other",
        "description": "The person does not identify as a male or female"
      }
    ]
  },
  "email": {
    "description": "The person's email address",
    "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    "optional": true
  }
}
```

This is a resource that represents a person.
It has a `@description` metadata that describes its value and a `@type` metadata that identifies its schema.
Each property has a `description` metadata that describes its meaning.

The `@description` metadata is optional and may be omitted by API publishers, but it is recommended to
include it by default, as it provides useful information for validating and processing the data.

The `age` property has a type metadata that defines it as an `integer` and a `min` and `max` metadata that
specify its range.
The `gender` property has an options metadata that defines the possible values for it.
The `email` property has a pattern metadata that defines the regular expression for it and an `optional`
metadata that indicates it may be `null`.

### Referencing Objects

Nested resources may include their state or link to its by its URI.
A reference to an external document looks like this: `"https://example.com/other-resource"`.

For example:

```json
{
  "@link": "https://example.com/departments/789",
  "name": "Sales Department",
  "manager": {
    "@link": "https://example.com/employees/123"
  },
  "employees": {
    "@link": "https://example.com/departments/789/employees/",
    "@state": [
      {
        "@link": "https://example.com/employees/123",
        "name": "John",
        "age": 15
      },
      {
        "@link": "https://example.com/employees/456"
      }
    ]
  }
}
```

This is a Lumina document for a department resource.

The top-level resource has a `name` property with the department name and two related resources: the manager
and the employees.
The `manager` object only references an object with URI `https://example.com/employees/123` without including
its state.
The state of the manager is present further down in the same document under the employees property.
The `employees` property references a resource whose state is included as an array.
The `employees` value also references a resource with URI `https://example.com/employees/456` whose state is
external to the document.

Nested resources that include their state but whose properties are all null, must have a `@state` property
with an empty object as its value.

If an object does not have any state properties or a `@state` property, it means that the state of the
resource is not included.

If a server includes a resource's state, it must include all its properties.
The server may include a subset of a property's value, such as an array or an object, as long as it
provides a pagination mechanism for navigating through it.

You must use the included state if it exists, or get it from the server and use it as if it was included in
the original document.

For example:

```json
{
  "@link": "https://example.com/departments/789",
  "name": "Sales",
  "manager": {
    "@link": "https://example.com/employees/123",
    "name": "John Doe",
    "age": 35,
    "gender": "male"
  },
  "employees": {
    "@link": "https://example.com/departments/789/employees"
  }
}
```

This document describes a department resource.
The top-level resource has an explicit `@link` property that identifies the resource URI and `name`
that identifies the department name.

It also has two related resources: the manager and the employees.
The `manager` object includes the state of the manager resource.
The `employees` object does not include the state of the "employees" resource and only provides a link
to it.
You must use the included state of the manager, but must get the state of the employees using their link.

### Linking properties

Sometimes, a property value may be a URI that identifies another resource. For example:

```json
{
  "name": "John Doe",
  "profile": "https://example.com/profiles/123"
}
```

This object has a profile property that contains a URI of another resource.
This is equivalent to having a `@link` metadata property with the same URI value.
For example:

```json
{
  "name": "John Doe",
  "profile": {
    "@link": "https://example.com/profiles/123"
  }
}
```

Both objects represent the same link to the profile resource.
The second object uses an object to specify the link, while the first object uses a shorthand notation.
You can use either notation to represent links to resources with external state.

### Resource Relations

Resources must qualify their references to other resources by specifying the relation between the two.
For example, a book resource must qualify its reference to an author resource by stating whether the author is
a creator, contributor, editor, etc.

A resource has an implicit relation to the resources nested inside it, based on the property name that
connects them.

For example, the following JSON object implies that the top-level resource has an "employee"
relation to the nested resource:

```json
{
  "employee": {
    "@link": "https://example.com/employees/123",
    "name": "John Doe"
  }
}
```

The `@relations` property is an array of strings that can override the implicit relation and specify multiple
relations.
The array must contain one or more elements, and each element must be a relation type defined by this
specification or API publishers.

The `@relations` metadata only applies to nested resources.
For example, the following JSON object indicates that the nested resource is both the "manager" and the
"friend" of the parent resource:

```json
{
  "employee": {
    "@link": "https://example.com/employees/123",
    "@relations": [
      "manager",
      "friend"
    ],
    "name": "John Doe"
  }
}
```

Top-level resources do not have implicit or explicit relations.

## Form Object

A form object is a JSON object that describes how to submit requests to the server.

Forms must have one of these relations: `formCreate`, `formUpdate`, or `formDelete`.
A form element is a property of the form object that specifies the name, type, and constraints of a piece of
input data.

- `formCreate` indicates creating new resources.
- `formUpdate` indicates updating existing resources.
- `formDelete` indicates deleting existing resources.

Forms must contain these metadata properties:

- `link`: where to submit the form.
- `method`: which HTTP method to use when submitting the form.
- `contentType`: which HTTP Content-Type header value to use when submitting the form.
- `responses`: the possible server response codes and their meanings.

A form object may contain these optional properties:

- `description`: a human-readable explanation of the form.
- `inputs`: the names and constraints of the form elements.

The name of each element must be unique per form.

### Creating a new Employee Resource

Here is how submit a form for creating a new employee resource.

```json
{
  "formCreate": {
    "@link": "https://example.com/employees",
    "@description": "A form for creating a new employee resource",
    "method": "POST",
    "contentType": "application/json",
    "inputs": {
      "@description": "The list of inputs that the form accepts",
      "name": {
        "type": "string",
        "description": "The name of the employee"
      },
      "age": {
        "type": "integer",
        "min": 18,
        "max": 65,
        "description": "The age of the employee in years"
      },
      "gender": {
        "type": "string",
        "options": [
          {
            "@state": "male",
            "description": "The employee identifies as male"
          },
          {
            "@state": "female",
            "description": "The employee identifies as female"
          },
          {
            "@state": "other",
            "description": "The employee identifies as neither male nor female"
          }
        ],
        "description": "The gender identity of the employee"
      },
      "email": {
        "type": "string",
        "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        "optional": true,
        "description": "The email address of the employee"
      }
    },
    "responses": {
      "@description": "The list of responses that the form may return",
      "@state": [
        {
          "code": 204,
          "description": "The server successfully created the new employee resource and did not return any content. The `Location` header contains the URI of the created resource."
        },
        {
          "code": 404,
          "description": "The server could not find the requested resource or did not allow creating new resources"
        }
      ]
    }
  }
}
```

This is a form object that represents a form for creating a new employee resource. It has a `formCreate`
relation to indicate its purpose. It has a `@link` property that specifies where to submit the form data.
It has a `method` property that specifies to use the POST HTTP method. It has a
`contentType` property that specifies to use the JSON media type for the form data.

The form object has an `inputs` property that indicates the names and constraints of the form elements.
The value is an object that contains four form elements: `name`, `age`, `gender`, and `email`.
Each element has a name property that identifies its key in the form data. Each element also has a `type`
property that defines its data type. The type metadata properties are explained in detail in the Type
Metadata section.

Each element also has optional metadata properties that describe their constraints or characteristics.
For example, the `age` element has a minimum and maximum value, the `gender` element has a set of possible
values, and the `email` element has a regular expression pattern and an `optional` flag.

The form object has a `responses` property that indicates the expected response codes and their meanings.
The first response code is 204, which means that the server successfully created the new employee resource and
did not return any content.
The second response code is 404, which means that the server could not find the requested resource or did
not allow creating new resources.

Each property in the form object and its elements has a `description` metadata property that describes it
in [CommonMark] format.
This can help you understand the purpose and usage of each property.

### Submitting Forms

To submit a form, you must follow these steps:

- Collect the input data from the form elements, which are the inputs that the form accepts.
  You must provide a value for each element that is not optional.
  You may omit the optional elements if you do not have a value for them.
- Encode the input data according to the `contentType` property of the form object.
  The `contentType` property specifies the HTTP Content-Type header that the server expects for the form
  data, which is the encoded input data.
  For example, if the `contentType` property is `application/json`, you must encode the input data as a
  JSON object.
- Send an HTTP request to the server using the `method` and `@link` properties of the form object.
  The `method` property specifies the HTTP method to use for the request.
  The `@link` property specifies the URL to send the request to.
  You must include the encoded input data as the body of the request and set the Content-Type header to
  match the `contentType` property of the form object.
- Receive an HTTP response from the server with a status code and an optional body.
  The status code indicates whether the form submission was successful or not.
- If a response has a body, it may contain additional information or feedback from the server.
  You can use the `responses` property of the form object to understand what each status code
  means.

For example, suppose you want to submit this form:

```json
{
  "@relations": [
    "formCreate"
  ],
  "@link": "https://example.com/employees",
  "description": "A form for creating a new employee resource",
  "method": "POST",
  "contentType": "application/vnd.com.github.cowwoc.lumina+json; version=1",
  "inputs": {
    "name": {
      "type": "string",
      "description": "The name of the employee"
    },
    "age": {
      "type": "integer",
      "min": 18,
      "max": 65,
      "description": "The age of the employee in years"
    },
    "gender": {
      "type": "string",
      "options": [
        {
          "value": "male",
          "description": "The employee identifies as male"
        },
        {
          "value": "female",
          "description": "The employee identifies as female"
        },
        {
          "value": "other",
          "description": "The employee identifies as neither male nor female"
        }
      ],
      "description": "The gender identity of the employee"
    },
    "email": {
      "type": "string",
      "pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      "optional": true,
      "description": "The email address of the employee"
    }
  },
  "responses": [
    {
      "code": 204,
      "description": "The server successfully created the new employee resource and did not return any content. The `Location` header contains the URI of the created resource."
    },
    {
      "code": 404,
      "description": "The server could not find the requested resource or did not allow creating new resources"
    }
  ]
}
```

You must provide values for these elements: `name`, `age`, and `gender`.
You may provide a value for `email` if you have one, or omit it if you do not.

Suppose you provide these values:

- name: Alice
- age: 30
- gender: female
- email: alice@example.com

You must encode these values as a JSON object like this:

```json
{
  "name": "Alice",
  "age": 30,
  "gender": "female",
  "email": "alice@example.com"
}
```

You must send an HTTP request to `https://example.com/employees` using the POST method.
You must include this JSON object as the body of your request and set the Content-Type header to
`application/vnd.com.github.cowwoc.lumina+json; version=1`.

You may receive an HTTP response from the server with a status code and an optional body.
The status code indicates whether your form submission was successful or not.
If the response has a body, it may contain additional information or feedback from the server.

If you receive a status code of 204, it means that the server successfully created the new employee resource
and did not return any content.
The `Location` header contains the URI of the created resource.

If you receive a status code of 404, it means that the server could not find the requested resource or did not
allow creating new resources.

You can use these steps to submit any form that follows the Lumina hypermedia type specification.

## Authentication Metadata

Some operations require authentication, which means you must provide your credentials in the `Authorization`
header of your request.
Your credentials are information that verifies your identity or authorization.

The `@authentication` metadata defines the authentication scheme that the server expects.

You must follow this scheme and include your credentials accordingly.

Authentication metadata describes the authentication options that you can use.
They have at least have two properties: `type`, and `realm`.

- The `type` property indicates one of the authentication schemes listed
  at [IANA HTTP Authentication Schemes].
- The `realm` property determines the scope that the authentication scheme applies to and is specified
  by [RFC 7235].

For example:

```json
{
  "@authentication": {
    "type": "basic",
    "realm": "employees"
  }
}
```

This means that you must use the `Basic` authentication scheme to access the resource.
The `realm` property indicates that the authentication applies to the `employees` protection scope.
You must provide a valid username and password separated by a colon (:) and encoded in base64 format
in the `Authorization` header of your request.
For example:

```http
Authorization: Basic Zm9vOmJhcg==
```

The Basic authentication scheme is one of the most common types of authentication schemes, but there are
others, such as Digest and Bearer.
Each scheme has its own syntax and rules for encoding and decoding the credentials, which are the
information that proves your identity or authorization to access the resource.

## Navigating a Document

Every aspect of a resource may change over time:

- The value of state or metadata properties.
- The names or positions of properties.

Use a resource's relations to navigate a document reliably.
To find a property of interest:

- Search descendant nodes implicit or explicit `@relations` that match your interest.
- Descendant nodes are the objects or arrays that are nested inside another object or array.

You should ignore nested resources, identified by their `@link` property, as thy indicate a new resource
with different values.

For example:

```json
{
  "@link": "https://example.com/departments/789",
  "@type": "Department",
  "name": "Sales",
  "manager": {
    "@link": "https://example.com/employees/123",
    "@type": "Employee",
    "name": "John Doe",
    "phone": "555-1234"
  },
  "phone": "555-4321"
}
```

If you are interested in the phone number of the department manager, you should search for a node that has a
`manager` relation, then use the value of the `phone` property.
The `phone` property in the top-level object belongs to the department resource, not the manager resource.

## Deprecated Properties

A property may be marked as deprecated by adding a `@deprecated` metadata property.
The `@deprecated` metadata is a markdown-formatted human-readable explanation of why the property is
deprecated, and whether there are other properties that take its place.
For example:

```json
{
  "@link": "https://example.com/employees/123",
  "name": "John Doe",
  "age": 35,
  "gender": "male",
  "address": {
    "@deprecated": "The address property is deprecated and will be removed in a future version. Use street-number and street-name instead.",
    "@state": "123 Main Street"
  },
  "streetNumber": 123,
  "streetName": "Main Street"
}
```

This object has a deprecated property called `address`, which contains the street number and name of the
employee.
The `@deprecated` property explains that this property is obsolete and will be removed in a future version,
and that the `streetNumber` and `streetName` properties should be used instead.
Clients should avoid using deprecated properties and prefer their replacements if available.

## Versioning

The Lumina hypermedia type specification may evolve over time to add new features, fix bugs, or improve
usability.
However, not all clients and servers may be able to support the latest version of the specification at the
same time.
Therefore, it is important to have a mechanism for managing different versions of the specification and
ensuring compatibility between them.

The Lumina hypermedia type specification uses major versioning, a convention that assigns a single-digit
version number to each release of a software product or specification, to indicate the changes and
compatibility of each version.
Major versioning is a convention that assigns a single-digit version number to each release of a software
product or specification, following this format:

`MAJOR`

- The major version indicates a breaking change that is incompatible with previous versions.
- Backward-compatible changes, such as new features, bug fixes, or improvements, do not change the version
  number.

For example, the first release of the Lumina hypermedia type specification has the version number 1. If a new
feature is added that does not affect the existing functionality, the version number remains 1. If a bug is
fixed or an improvement is made that does not affect the existing functionality, the version number remains 1.
If a breaking change is made that affects the existing functionality, the version number becomes 2.

The Lumina hypermedia type specification uses the `version` media type parameter, a modifier that specifies
the version number of the media type, to indicate the version of the specification that a document follows.
For example: `Content-Type: application/vnd.com.github.cowwoc.lumina+json; version=1`

This is the content-type of a document that follows version 1 of the Lumina hypermedia type specification.

Clients and servers must use the `version` parameter to determine if they can process a document according to
the Lumina hypermedia type specification.
Clients and servers must support at least one version of the specification and indicate which versions
they support in their documentation or configuration.

If the `Accept` header sent by a client does not contain a version parameter, the server should assume that it
supports the latest version.

Using a versioning scheme allows clients and servers to handle different versions of the Lumina hypermedia
type specification gracefully and avoid breaking changes and compatibility issues.

[CommonMark]: https://commonmark.org/

[RFC 3986]: https://datatracker.ietf.org/doc/html/rfc3986

[Linking Objects]: #Linking-Objects

[RFC 3339]: https://datatracker.ietf.org/doc/html/rfc3339

[RFC 7235]: https://datatracker.ietf.org/doc/html/rfc7235

[IANA HTTP Authentication Schemes]: https://www.iana.org/assignments/http-authschemes/http-authschemes.xhtml

[ECMAScript Language Specification]: https://262.ecma-international.org/13.0

# Credits

This design was inspired by:

- [Designing Beautiful REST + JSON APIs](https://www.okta.com/video/oktane17-appdev-designing-beautiful-rest-plus-json-apis/)
- [Building Hypermedia APIs with HTML](https://www.infoq.com/presentations/web-api-html/)
- [Ion Specification](https://ionspec.org/)
- [Modeling JSON API with Ion](https://recaffeinate.co/post/modeling-json-api-with-ion/)
- [RESTful Web Services: A Tutorial](https://vimeo.com/20781278)