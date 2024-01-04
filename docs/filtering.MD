# Sorting, Filtering and Pagination

This document describes a convention for the sorting, filtering and pagination of response data using HTTP
request query parameters.

**Note**:

* All parameter values must be percent-encoded. For example, `=` must be encoded as `%3D`.
* Percent-encoding is a way of representing characters that are not allowed or have special meaning in a
	URL.
	For example, the character `=` is used to separate a query parameter name from its value, so it cannot
	be used as part of the value itself.
	To encode such characters, they are replaced by a percent sign (`%`) followed by two hexadecimal digits
	that represent their ASCII code.
	For example, the character `=` has the ASCII code 61, which is 3D in hexadecimal, so it is encoded as `%3D`.
	This way, the URL can be interpreted correctly by the server and the client.
	See [this](https://en.wikipedia.org/wiki/Percent-encoding) for more details.
* For readability purposes, this document does not percent-encode the parameter values in the examples.
	However, in real life, all parameter values must be percent-encoded. For example, the filter expression
	`key1==42 && key2==43` must be encoded as `key1%253D%253D42%2526%2526key2%253D%253D43` in the URL.
* Leading and trailing whitespace is stripped from all values before processing, so spaces around commas,
	hyphens, operators or quotes are allowed but not required.
* The property names specified in the value of query parameters do not necessarily have to match the name of
	database columns.
	It is up to each server endpoint to specify the property names that it supports and their meaning.
* For readability purposes, this document specifies the query parameter name once per section and only renders
	the value of the parameter in the examples. However, in real life, each query parameter name and value must
	be separated by an equal sign (`=`) and joined by an ampersand (`&`) in the URL. For example, the sorting
	expression `first,-second` must be sent as `sort=first,-second` in the URL.

## Sorting

Sorting is used to order the response data according to one or more properties.
The sorting criteria are specified using the `sort` query parameter.
For example:

```
first
```

This means that the response data should be sorted by the `first` property.

By default, each property is sorted in ascending order. To sort a property in descending order, prefix its
name with a hyphen (`-`).
For example:

```
-second
```

This means that the response data should be sorted by the `second` property in descending order.

To avoid ambiguity, property names may not begin with a hyphen or a comma.

If multiple sort parameters are specified, they are combined using a comma separator. For example:

```
first,-second
```

This means that the response data should be sorted by the `first` property in ascending order, and then by
the `second` property in descending order.

The order of the elements in the list is significant, as it determines the precedence of the sorting criteria.

If an empty parameter is specified, it is equivalent to not specifying the parameter at all.
In such a case, the server will use the default sorting value, which will return data in an arbitrary order.

If non-existent properties are referenced, or if conflicting orders are specified for the same property, the
server will return HTTP 400 (Bad Request) with an appropriate error message.

## Filtering

Filtering is used to select only the response data that match certain conditions.
The criteria are specified using the `filter` query parameter.
For example:

```
key == 42
```

This means that only the response data where the `key` property is equal to `42` should be returned.

Filtering can also use different operators for comparison, such as `<`, `>`, `<=`, `>=`, `==`, and `!=`.
They mean less than, greater than, less than or equal to, greater than or equal to, equal to, and not
equal to, respectively.
For example:

```
key > 42
```

This means that only the response data where the `key` property is greater than `42` should be returned.

Filter expressions can be combined using logical operators: `&&` for AND and `||` for OR. For example:

```
key1 == 42 && key2 == 43
```

This means that only the response data where both the `key1` property is equal to `42` and the `key2` property
is equal to `43` should be returned.

Filter expressions can also use regular expressions for string values.
A regular expression is any string value that follows
[this](https://en.wikipedia.org/wiki/Regular_expression) syntax and must be enclosed in double quotes (`"`).
However, only a subset of regular expression features are supported, for performance and security reasons.
The supported features are:

- Zero or more wildcard characters: `.*`
- One or more combination of the above: `(James.*|.*Bond|Martin .* King)`

For example:

```
key == "(value1|value2|value3)"
```

This means that only the response data where the `key` property matches any of the
values: `"value1"`, `"value2"`, or `"value3"`, should be returned.

Filter expressions can also be grouped using parentheses: `(` and `)`. For example:

```
(key1 == 42 || key2 == 43) && key3 == 44
```

This means that only the response data where both of these conditions are true should be returned:

- The key3 property is equal to 44
- The key1 property is equal to 42 or the key2 property is equal to 43

Filter expressions can also be negated using the `!` operator, which represents the NOT logical operator. For
example:

```
!(key1 == 42 || key2 == 43) && key3 == 44
```

This means that only the response data where both of these conditions are true should be returned:

* The key3 property is equal to 44
* Neither the key1 property is equal to 42 nor the key2 property is equal to 43

If multiple filter parameters are specified, they are joined using a `&&` (logical AND operator). For example,
the URL:

```
https://example.com?filter=key1==42&filter=key2==43
```

is evaluated the same as a filter with a value of:

```
key1==42 && key2==43
```

This means that only the response data where both the key1 property is equal to 42 and the key2 property is
equal to 43 should be returned.

If invalid values are specified, such as unsupported operators or malformed expressions, the server will
return HTTP 400 (Bad Request) with an appropriate error message.

If an empty parameter is specified, it is equivalent to not specifying the parameter at all. In such a case,
the server will use the default value, which is unfiltered.

If non-existent properties or values are referenced, or if constraints that result in an empty data set are
specified, the server will return an empty array with HTTP 200 (OK).

## Pagination

Pagination is used to limit the number of response data returned and to navigate through multiple pages of
results. The limit is specified using the `length` query parameter. For example:

```
50
```

This means that the response data should contain at most 50 items.

The `length` parameter has a default and maximum value of 100, unless the individual REST endpoint specifies a
different value. Each REST endpoint must document the acceptable range for the `length` parameter and indicate
whether it overrides the default or maximum value.

The server is not required to indicate the total number of items or pages in the response data, but will
indicate the existence of available pages in either direction. Implementation details are left up to the REST
endpoint.

If invalid values are specified, such as non-numeric, too large or too small values, the server will return
HTTP 400 (Bad Request) with an appropriate error message.

If items that do not exist are requested, such as pages that are beyond the available range, the server will
return an empty array with HTTP 200 (OK).