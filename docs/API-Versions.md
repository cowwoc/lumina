## About API versioning

Any breaking changes will be released in a new API version. Breaking changes are changes that can potentially
break an integration. Breaking changes include:

* removing an entire operation
* removing or renaming a parameter
* removing or renaming a response field
* adding a new required parameter
* making a previously optional parameter required
* changing the type of parameter or response field
* removing enum values
* adding a new validation rule to an existing parameter
* changing authentication or authorization requirements

Any additive (non-breaking) changes will be added in the same API version. Additive changes include:

* adding an operation
* adding an optional parameter
* adding an optional request header
* adding a response field
* adding a response header
* adding enum values

### Specifying an API version

You should use the `Version` header to specify an API version. For example:

```
$ curl --header "Version: 1" https://www.example.com/
```

Requests without the `Version` header will default to use the latest version.

If you specify an API version that is no longer supported, you will receive an `HTTP 400` error.

### Upgrading to a new API version

Before upgrading to a new REST API version, you should read the changelog of breaking changes for the new API
version to understand what breaking changes are included and to learn more about how to upgrade to that
specific API version.

When you update your integration to specify the new API version in the `Version` header, you'll also need
to make any changes required for your integration to work with the new API version.

Once your integration is updated, test your integration to verify that it works with the new API version.